/**
 * 股票價格資料服務
 * 負責抓取和快取股票價格資料到 IndexedDB
 */
import axios from '@/lib/axios';
import { initDB, putToStore, getDB } from '@/lib/idb';
import dayjs from 'dayjs';
import _ from 'lodash';

/**
 * 取得單一 user-stock-data 資料
 * @param {string} stockId - 股票代碼
 * @returns {Promise<Object|null>} 該股票的 user-stock-data
 */
export async function getUserStockData(stockId) {
    const db = await getDB();
    return db.get('user-stock-data', stockId);
}

/**
 * 將股票資料儲存到 IndexedDB
 * @param {Object} stockData - 股票資料
 */
async function saveUserStockDataToDB(stockData) {
    try {
        // 將每日資料存入 daily key，id 為股票代碼
        const dataToSave = {
            id: stockData.stockCode,
            daily: stockData.data,
            lastUpdated: stockData.lastUpdated,
            fetchedAt: stockData.fetchedAt,
        };
        await putToStore('user-stock-data', dataToSave);
        console.log(`股票 ${stockData.stockCode} 資料已儲存到 IndexedDB`);
    } catch (error) {
        console.error(`儲存股票 ${stockData.stockCode} 資料失敗:`, error);
    }
}

/**
 * 從 IndexedDB 讀取股票資料
 * @param {string} stockCode - 股票代碼
 * @returns {Promise<Object|null>} 快取的股票資料或 null
 */
async function getUserStockDataById(stockCode) {
    try {
        const db = await getDB();
        const stockData = await db.get('user-stock-data', stockCode);
        return stockData || null;
    } catch (error) {
        console.error(`讀取股票 ${stockCode} 快取資料失敗:`, error);
        return null;
    }
}

/**
 * 更新單一股票的價格資料並回傳處理後的資料
 * @param {string} stockId - 股票代碼
 * @param {Object} baseStockInfo - 基本股票資訊 { id, name, code }
 * @returns {Promise<Object|null>} 處理後的股票資料
 */
export async function fetchUserStockPriceByBaseInfo(stockId, baseStockInfo) {
    const latestPriceDate = _.get(baseStockInfo, 'latestPriceDate', null);
    try {
        console.log(`開始抓取股票 ${stockId} 的資料...`);
        const response = await axios.get(`stocks/${stockId}/all.json`);

        if (response.data) {
            // 過濾日期大於 latestPriceDate 的資料
            let filteredData = response.data;
            if (latestPriceDate) {
                filteredData = response.data.filter(item => {
                    // 假設 item.date 為日期欄位，格式為 'YYYYMMDD'
                    return dayjs(item.date, 'YYYYMMDD').isAfter(dayjs(latestPriceDate));
                });
            }
            // 取得最後一筆資料的日期與價格
            let fetchedAt = null;
            let lastDate = null;
            let lastPrice = null;
            if (filteredData && filteredData.length > 0) {
                const last = filteredData[filteredData.length - 1];
                fetchedAt =  dayjs().format('YYYY-MM-DD HH:mm:ss');
                lastDate = dayjs(last[0], 'YYYYMMDD').format('YYYY-MM-DD HH:mm:ss');
                lastPrice = last[4];
            }
            const updatedStock = {
                ...baseStockInfo,
                fetchedAt,
                lastPrice,
                lastDate,
                // 可以添加更多技術指標
                // weeklyKD: Math.floor(Math.random() * 100), // 暫時用隨機數，待實際資料結構確定
                // rsi: Math.floor(Math.random() * 100), // 暫時用隨機數，待實際資料結構確定
            };
            console.log(`成功抓取股票 ${stockId} 資料`, updatedStock);
            return updatedStock;
        }

        console.warn(`股票 ${stockId} 無資料回傳`);
        return null;
    } catch (error) {
        console.error(`抓取股票 ${stockId} 失敗:`, error);
        return null;
    }
}

// 初始化時確保資料庫已建立
initDB().catch(console.error);

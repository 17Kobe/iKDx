/**
 * 股票價格資料服務
 * 負責抓取和快取股票價格資料到 IndexedDB
 */
import axios from '@/lib/axios';
import { initDB, putToStore, getAllFromStore, getDB } from '@/lib/idb';
import dayjs from 'dayjs';

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
 * 檢查快取資料是否過期
 * @param {string} lastUpdated - 上次更新時間（ISO 字串）
 * @param {number} cacheMinutes - 快取有效時間（分鐘）
 * @returns {boolean} 是否過期
 */
function isCacheExpired(lastUpdated, cacheMinutes = 30) {
    if (!lastUpdated) return true;
    const now = dayjs();
    const lastUpdate = dayjs(lastUpdated);
    return now.diff(lastUpdate, 'minute') > cacheMinutes;
}

/**
 * 從 API 抓取單一股票資料
 * @param {string} stockCode - 股票代碼
 * @returns {Promise<Object|null>} 股票資料或 null
 */
async function fetchStockDataFromAPI(stockCode) {
    try {
        console.log(`開始抓取股票 ${stockCode} 的資料...`);
        const response = await axios.get(`stocks/${stockCode}/all.json`);

        if (response.data) {
            const stockData = {
                stockCode,
                data: response.data,
                lastUpdated: new Date().toISOString(),
                fetchedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            console.log(`成功抓取股票 ${stockCode} 資料`);
            return stockData;
        }

        console.warn(`股票 ${stockCode} 無資料回傳`);
        return null;
    } catch (error) {
        console.error(`抓取股票 ${stockCode} 失敗:`, error);
        return null;
    }
}

/**
 * 將股票資料儲存到 IndexedDB
 * @param {Object} stockData - 股票資料
 */
async function saveStockDataToDB(stockData) {
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
async function getStockDataFromDB(stockCode) {
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
 * 取得股票資料（優先使用快取）
 * @param {string} stockCode - 股票代碼
 * @param {boolean} forceRefresh - 是否強制重新抓取
 * @returns {Promise<Object|null>} 股票資料
 */
export async function getStockData(stockCode, forceRefresh = false) {
    // 檢查快取
    if (!forceRefresh) {
        const cachedData = await getStockDataFromDB(stockCode);
        if (cachedData && !isCacheExpired(cachedData.lastUpdated)) {
            console.log(`使用快取資料: ${stockCode}`);
            return {
                ...cachedData,
                data: cachedData.daily,
            };
        }
    }

    // 從 API 抓取新資料
    const freshData = await fetchStockDataFromAPI(stockCode);
    if (freshData) {
        await saveStockDataToDB(freshData);
        return freshData;
    }

    // 如果 API 失敗，嘗試使用舊的快取資料
    const fallbackData = await getStockDataFromDB(stockCode);
    if (fallbackData) {
        console.warn(`API 失敗，使用舊快取資料: ${stockCode}`);
        return fallbackData;
    }

    return null;
}

/**
 * 批量抓取多個股票資料（並發處理）
 * @param {string[]} stockCodes - 股票代碼陣列
 * @param {number} concurrency - 併發數量（預設 5）
 * @param {boolean} forceRefresh - 是否強制重新抓取
 * @returns {Promise<Object[]>} 股票資料陣列
 */
export async function batchFetchStockData(stockCodes, concurrency = 5, forceRefresh = false) {
    if (!stockCodes || stockCodes.length === 0) {
        return [];
    }

    console.log(`開始批量抓取 ${stockCodes.length} 支股票資料，併發數: ${concurrency}`);

    const results = [];
    const chunks = [];

    // 將股票代碼分批處理
    for (let i = 0; i < stockCodes.length; i += concurrency) {
        chunks.push(stockCodes.slice(i, i + concurrency));
    }

    // 逐批並發處理
    for (const chunk of chunks) {
        const promises = chunk.map(stockCode => getStockData(stockCode, forceRefresh));
        const chunkResults = await Promise.allSettled(promises);

        chunkResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            } else {
                console.error(`股票 ${chunk[index]} 抓取失敗:`, result.reason);
            }
        });

        // 避免過於頻繁的請求，批次間稍作延遲
        if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`批量抓取完成，成功: ${results.length}/${stockCodes.length}`);
    return results;
}

/**
 * 更新單一股票的價格資料並回傳處理後的資料
 * @param {string} stockCode - 股票代碼
 * @param {Object} baseStockInfo - 基本股票資訊 { id, name, code }
 * @returns {Promise<Object|null>} 處理後的股票資料
 */
export async function fetchAndUpdateStockPrice(stockCode, baseStockInfo) {
    const stockData = await getStockData(stockCode);

    if (!stockData || !stockData.data) {
        console.warn(`股票 ${stockCode} 無價格資料`);
        return null;
    }

    // 處理股票資料，提取最新價格資訊
    const priceData = stockData.data;

    // 假設 all.json 包含歷史價格資料，取最新一筆
    let latestPrice = null;
    let change = 0;
    let changePercent = 0;

    if (Array.isArray(priceData) && priceData.length > 0) {
        // 如果是陣列格式（歷史資料）
        const latest = priceData[priceData.length - 1];
        latestPrice = latest.close || latest.price || latest[4]; // 適應不同資料格式

        if (priceData.length > 1) {
            const previous = priceData[priceData.length - 2];
            const previousPrice = previous.close || previous.price || previous[4];
            change = latestPrice - previousPrice;
            changePercent = (change / previousPrice) * 100;
        }
    } else if (typeof priceData === 'object') {
        // 如果是物件格式
        latestPrice = priceData.price || priceData.close || priceData.last;
        change = priceData.change || 0;
        changePercent = priceData.changePercent || 0;
    }

    // 組合最終的股票資料
    const updatedStock = {
        ...baseStockInfo,
        price: latestPrice || 0,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        lastUpdated: stockData.lastUpdated,
        // 可以添加更多技術指標
        weeklyKD: Math.floor(Math.random() * 100), // 暫時用隨機數，待實際資料結構確定
        rsi: Math.floor(Math.random() * 100), // 暫時用隨機數，待實際資料結構確定
    };

    return updatedStock;
}

// 初始化時確保資料庫已建立
initDB().catch(console.error);

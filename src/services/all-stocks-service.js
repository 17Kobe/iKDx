import { getAllFromStore, putToStore } from '@/lib/idb';
import axios from '@/lib/axios';

/**
 * 取得 all-stocks 中的股票資料
 * 若 IndexedDB 無資料則自動從 stock_list.json 載入並快取
 */
export async function getAllStocks() {
    console.log('開始執行 getAllStocks');
    const localDb = await getAllFromStore('all-stocks');
    if (localDb && localDb.length > 0) {
        console.log('從 IndexedDB 獲取的股票資料:', localDb);
        return localDb;
    } else {
        console.log('all-stocks store 無資料，開始從 stock_list.json 獲取');
        const res = await axios.get('data/stock_list.json');
        const stocks = res.data;
        for (const stock of stocks) {
            await putToStore('all-stocks', stock);
        }
        console.log('股票資料已快取到 IndexedDB:', stocks);
        return stocks;
    }
}

/**
 * 取得單一 all-stocks 資料
 * @param {string} stockId - 股票代碼
 * @returns {Promise<Object|null>} 該股票的 all-stocks 資料
 */
export async function getAllStocksById(stockId) {
    return await getFromStore('all-stocks', stockId);
}
/**
 * 新增或更新單一 all-stocks 資料
 * @param {Object} stock
 */
export async function putAllStocks(stock) {
    return await putToStore('all-stocks', stock);
}

import { getAllFromStore, putToStore } from '@/lib/idb';
import axios from '@/lib/axios';

/**
 * 取得 all-stocks 中的股票資料
 * 若 IndexedDB 無資料則自動從 stock_list.json 載入並快取
 */
export async function getStocksFromDB() {
    console.log('開始執行 getStocksFromDB');
    const localDb = await getAllFromStore('all-stocks');
    if (localDb && localDb.length > 0) {
        console.log('從 IndexedDB 獲取的股票資料:', localDb);
        return localDb;
    } else {
        console.log('all-stocks store 無資料，開始從 stock_list.json 獲取');
        const res = await axios.get('stocks/stock_list.json');
        const stocks = res.data;
        for (const stock of stocks) {
            await putToStore('all-stocks', stock);
        }
        console.log('股票資料已快取到 IndexedDB:', stocks);
        return stocks;
    }
}

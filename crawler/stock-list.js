// 取得台股股票清單，並寫入 public/stocks/stock_list.json
// 使用 axios 取得 FinMind API，並轉換格式
import axios from 'axios';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import _ from 'lodash';

/**
 * 取得台股股票清單，轉換格式並寫入 stock_list.json
 */
export async function fetchStockList() {
    // FinMind 股票清單 API
    const url = 'https://api.finmindtrade.com/api/v4/data';
    const params = {
        dataset: 'TaiwanStockInfo',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRlIjoiMjAyNC0wMS0wMiAxNTowODoyMyIsInVzZXJfaWQiOiIxN2tvYmUiLCJpcCI6IjIxMC43MS4yMTcuMjUxIn0.Dl5cEreMFOqT_4rrpwHwApyVn6vrEovKPMP3-zygpHk',
    };
    const { data } = await axios.get(url, { params });
    if (!data.data) throw new Error('FinMind 股票清單 API 回傳異常');
    // 用 lodash groupBy + map + uniq 合併同 id+type，industryCategory 陣列去重
    const grouped = _.groupBy(data.data, item => `${item.stock_id}_${item.type}`);
    const stocks = Object.values(grouped).map(group => ({
        id: group[0].stock_id,
        name: group[0].stock_name,
        // 如果 group 內所有物件的 industry_category 都是 null→ group.map(...) 得到 [null, null, null]
        // 但應該不可能有這種資料
        industryCategory: _.uniq(group.map(i => i.industry_category)),
        type: group[0].type,
    }));
    // 寫入 public/stocks/stock_list.json
    // 目前 stock-list.js 的邏輯是每次執行都會將最新取得的股票清單「全部覆寫」寫入 public/stocks/stock_list.json，不會保留舊資料。這樣可確保 stock_list.json 內容永遠是最新的全量清單
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const rootDir = resolve(__dirname, '../../');
    const outPath = resolve(rootDir, 'public/stocks/stock_list.json');
    await fs.mkdir(resolve(rootDir, 'public/stocks'), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(stocks, null, 4), 'utf8');
    console.log('股票清單已寫入 stock_list.json');
}

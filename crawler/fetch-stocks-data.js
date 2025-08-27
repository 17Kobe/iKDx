// Orchestrator: 先抓股票清單，再抓價格
import { fetchStockList } from './stock-list.js';
import { fetchStockPrice } from './stock-price.js';

async function main() {
    await fetchStockList();
    // 讀取 stock-list.js 寫入的 stock_list.json
    const fs = await import('fs');
    const path = await import('path');
    const { resolve } = path;
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = resolve(__dirname, '../../');
    const stocksData = JSON.parse(
        fs.readFileSync(resolve(rootDir, 'public/data/stock_list.json'), 'utf8')
    );
    // 僅處理指定 id 的股票
    const targetIds = [
        '2330',
        '2454',
        '2885',
        '0056',
        '1215',
        '00713',
        '2646',
        '2308',
        '2412',
        '00646',
        '3008',
        '00919',
        '00937B',
        '00679B',
    ];
    const filteredStocks = stocksData.filter(stock => targetIds.includes(stock.id));
    // 去除重複股票，確保唯一性
    const uniqueStocks = Array.from(
        new Map(filteredStocks.map(stock => [stock.id, stock])).values()
    );
    /**
     * 批次非同步抓取股票價格
     * - 每批同時處理 3 檔，避免 API 過度集中
     * - 每批間隔 500ms，降低被封鎖風險
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const batchSize = 3; // 每批同時處理數量
    for (let i = 0; i < uniqueStocks.length; i += batchSize) {
        // 取出本批要處理的股票
        const batch = uniqueStocks.slice(i, i + batchSize);
        // 同時非同步呼叫 fetchStockPrice 並取得 logs
        const results = await Promise.all(batch.map(stock => fetchStockPrice(stock)));
        // 統一輸出每檔股票的日誌
        for (const { id, name, logs } of results) {
            // 清晰分隔線
            const sep = '='.repeat(60);
            console.log(sep);
            // 輸出日誌內容
            logs.forEach(line => console.log(line));
        }
        // 若還有下一批，則等待 500ms 再繼續
        if (i + batchSize < uniqueStocks.length) {
            await sleep(500);
        }
    }
    console.log('全部股票資料抓取完成！');
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('fetch-stocks-data.js')) {
    main();
}

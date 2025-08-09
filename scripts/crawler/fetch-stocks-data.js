// Orchestrator: 先抓股票清單，再抓價格
// import { fetchStockList } from './stock-list.js';
import { fetchStockPrice } from './stock-price.js';

async function main() {
    // await fetchStockList();
    // 讀取 stock-list.js 寫入的 stock_list.json
    const fs = await import('fs');
    const path = await import('path');
    const { resolve } = path;
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = resolve(__dirname, '../../');
    const stocksData = JSON.parse(
        fs.readFileSync(resolve(rootDir, 'public/stocks/stock_list.json'), 'utf8')
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
    for (const stock of filteredStocks) {
        await fetchStockPrice(stock);
    }
    console.log('全部股票資料抓取完成！');
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('fetch-stocks-data.js')) {
    main();
}

import os from 'os';
import axios from 'axios';
import fs from 'fs';
import path, { resolve } from 'path';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';

const proxyConfig = {
    host: 'proxy.cht.com.tw',
    port: 8080,
    protocol: 'http',
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../../');

// 判斷本機是否為 10.144.179.x 網段
function needProxy() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                iface.address.startsWith('10.144.169')
            ) {
                return true;
            }
        }
    }
    return false;
}

async function fetchStockData() {
    try {
        console.log('開始抓取股票資料...');

        // 讀取股票清單（專案根目錄 public/stocks/stocks.json）
        const stocksData = JSON.parse(
            fs.readFileSync(resolve(rootDir, 'public/stocks/stocks.json'), 'utf8')
        );
        console.log(`找到 ${stocksData.length} 支股票`);

        // 非同步並行處理股票資料

        const useProxy = needProxy();
        const processingPromises = stocksData.map(async (stock, index) => {
            await new Promise(resolve => setTimeout(resolve, index * 200));

            const stockDir = resolve(rootDir, 'public/stocks', stock.id);
            const allJsonPath = resolve(stockDir, 'all.json');

            if (!fs.existsSync(stockDir)) {
                fs.mkdirSync(stockDir, { recursive: true });
            }

            if (!fs.existsSync(allJsonPath)) {
                console.log(`抓取 ${stock.id} (${stock.name}) 的歷史資料...`);
                try {
                    const startDate = dayjs().subtract(10, 'year').format('YYYY-MM-DD');
                    const finmindResponse = await axios.get(
                        'https://api.finmindtrade.com/api/v4/data',
                        {
                            params: {
                                dataset: 'TaiwanStockPrice',
                                data_id: stock.id,
                                start_date: startDate,
                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRlIjoiMjAyNC0wMS0wMiAxNTowODoyMyIsInVzZXJfaWQiOiIxN2tvYmUiLCJpcCI6IjIxMC43MS4yMTcuMjUxIn0.Dl5cEreMFOqT_4rrpwHwApyVn6vrEovKPMP3-zygpHk',
                            },
                            // ...(useProxy ? { proxy: proxyConfig } : {})
                        }
                    );

                    if (
                        finmindResponse.data &&
                        finmindResponse.data.data &&
                        finmindResponse.data.data.length > 0
                    ) {
                        // 轉換格式: [['date', open, high, low, close, volume], ...]
                        const klineArr = finmindResponse.data.data.map(item => [
                            item.date,
                            item.open,
                            item.max,
                            item.min,
                            item.close,
                            item.Trading_Volume,
                        ]);
                        const jsonStr = JSON.stringify(klineArr);
                        fs.writeFileSync(allJsonPath, jsonStr);
                        console.log(
                            `✓ ${stock.id} 歷史資料已儲存 (${klineArr.length} 筆記錄): ${allJsonPath}`
                        );
                    } else {
                        console.log(`⚠ ${stock.id} 無歷史資料`);
                    }
                } catch (error) {
                    console.error(`✗ 抓取 ${stock.id} 歷史資料失敗:`, error.message);
                }
            } else {
                console.log(`${stock.id} 歷史資料已存在，跳過`);
            }

            // 更新今日資料 (從證交所)
            console.log(`更新 ${stock.id} (${stock.name}) 今日資料...`);
            try {
                const exchange = stock.id.length === 4 ? 'tse' : 'otc';
                const stockParam = `${exchange}_${stock.id}.tw`;

                const twseResponse = await axios.get(
                    `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${stockParam}`,
                    { timeout: 10000, ...(useProxy ? { proxy: proxyConfig } : {}) }
                );

                if (
                    twseResponse.data &&
                    twseResponse.data.msgArray &&
                    twseResponse.data.msgArray.length > 0
                ) {
                    const todayData = twseResponse.data.msgArray[0];
                    console.log(`✓ ${stock.id} 今日資料已取得 (價格: ${todayData.z || 'N/A'})`);

                    // 若 t 為 13:30:00，才視為確定值，並檢查 all.json 是否已有今日資料
                    if (todayData.t === '13:30:00') {
                        const allJsonPath = resolve(stockDir, 'all.json');
                        if (fs.existsSync(allJsonPath)) {
                            const allArr = JSON.parse(fs.readFileSync(allJsonPath, 'utf8'));
                            // 取得 todayData 日期
                            const todayDate =
                                todayData.d ||
                                todayData.date ||
                                (todayData.tlong
                                    ? new Date(Number(todayData.tlong)).toISOString().slice(0, 10)
                                    : null);
                            // all.json 格式: [[date, open, high, low, close, volume], ...]
                            const hasToday = allArr.some(row => row[0] === todayDate);
                            if (!hasToday) {
                                // append 新資料
                                allArr.push([
                                    todayDate,
                                    Number(todayData.o),
                                    Number(todayData.h),
                                    Number(todayData.l),
                                    Number(todayData.z),
                                    Number(todayData.v),
                                ]);
                                fs.writeFileSync(allJsonPath, JSON.stringify(allArr));
                                console.log(`✓ ${stock.id} 已 append 今日資料到 all.json`);
                            } else {
                                console.log(`✓ ${stock.id} all.json 已有今日資料，略過 append`);
                            }
                        }
                    }
                } else {
                    console.log(`⚠ ${stock.id} 無今日交易資料`);
                }
            } catch (error) {
                console.error(`✗ 更新 ${stock.id} 今日資料失敗:`, error.message);
            }
        });

        await Promise.all(processingPromises);
        console.log('股票資料抓取完成！');
    } catch (error) {
        console.error('股票資料抓取失敗:', error);
        process.exit(1);
    }
}

// 直接執行時才啟動主程式
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('fetch-stocks-data.js')) {
    fetchStockData();
}

export { fetchStockData };

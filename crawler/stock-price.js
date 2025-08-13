import axios from 'axios';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import dayjs from 'dayjs';

/**
 * 取得單一股票歷史與當日價格，寫入 public/stocks/{id}/all.json
 * 若無歷史檔案則先抓 FinMind，若已有則只補今日收盤價
 * @param {Object} stock - 股票物件，需有 id, name
 */
export async function fetchStockPrice(stock) {
    const logs = [];
    const rootDir = process.cwd();
    const stockDir = resolve(rootDir, 'public/stocks', stock.id);
    const allJsonPath = resolve(stockDir, 'all.json');

    // 確保目錄存在
    await fs.mkdir(stockDir, { recursive: true });

    // 1. 檢查歷史檔案是否存在
    const existedBefore = await fileExists(allJsonPath);
    // 2. 讀取或抓取歷史資料
    let klineArr = [];
    if (!existedBefore) {
        try {
            logs.push(`抓取 ${stock.id} (${stock.name}) 的歷史資料...`);
            const startDate = dayjs().subtract(10, 'year').format('YYYY-MM-DD');
            const url = 'https://api.finmindtrade.com/api/v4/data';
            const params = {
                dataset: 'TaiwanStockPrice',
                data_id: stock.id,
                start_date: startDate,
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRlIjoiMjAyNC0wMS0wMiAxNTowODoyMyIsInVzZXJfaWQiOiIxN2tvYmUiLCJpcCI6IjIxMC43MS4yMTcuMjUxIn0.Dl5cEreMFOqT_4rrpwHwApyVn6vrEovKPMP3-zygpHk',
            };
            const res = await axios.get(url, { params });
            if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                klineArr = res.data.data.map(item => [
                    // 日期去 dash
                    item.date.replace(/-/g, ''),
                    item.open,
                    item.max,
                    item.min,
                    item.close,
                    // 股數轉張數（四捨五入）
                    Math.round(Number(item.Trading_Volume) / 1000),
                ]);
                await fs.writeFile(allJsonPath, JSON.stringify(klineArr), 'utf8');
                logs.push(
                    `✓ ${stock.id} 歷史資料已儲存 (${klineArr.length} 筆記錄): ${allJsonPath}`
                );
            } else {
                logs.push(`⚠ ${stock.id} 無歷史資料`);
            }
        } catch (error) {
            let detail = '';
            if (error.response && error.response.data) {
                detail = `\nFinMind 回應: ${JSON.stringify(error.response.data, null, 2)}`;
            }
            logs.push(`✗ 抓取 ${stock.id} 歷史資料失敗: ${error.message}${detail}`);
        }
    } else {
        // 2. 若已有 all.json，讀取現有資料
        try {
            const raw = await fs.readFile(allJsonPath, 'utf8');
            klineArr = JSON.parse(raw);
        } catch (e) {
            klineArr = [];
        }
    }

    // 3. 更新今日資料（僅當歷史資料檔案已存在時才抓取）
    if (existedBefore) {
        try {
            const exchange = stock.id.length === 4 ? 'tse' : 'otc';
            const stockParam = `${exchange}_${stock.id}.tw`;
            const twseResponse = await axios.get(
                `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${stockParam}`,
                { timeout: 10000 }
            );
            if (
                twseResponse.data &&
                twseResponse.data.msgArray &&
                twseResponse.data.msgArray.length > 0
            ) {
                const todayData = twseResponse.data.msgArray[0];
                // 成功取得今日資料後才印出更新訊息
                logs.push(`更新 ${stock.id} (${stock.name}) 今日資料...`);
                logs.push(`✓ ${stock.id} 今日資料已取得 (價格: ${todayData.z || 'N/A'})`);
                // 若 t 為 13:30:00，才視為確定值，並檢查 all.json 是否已有今日資料
                if (todayData.t === '13:30:00') {
                    const todayDate =
                        todayData.d ||
                        todayData.date ||
                        (todayData.tlong
                            ? new Date(Number(todayData.tlong)).toISOString().slice(0, 10)
                            : null);
                    const hasToday = klineArr.some(row => row[0] === todayDate);
                    if (!hasToday && todayDate) {
                        klineArr.push([
                            todayDate,
                            Number(todayData.o),
                            Number(todayData.h),
                            Number(todayData.l),
                            Number(todayData.z),
                            Number(todayData.v),
                        ]);
                        await fs.writeFile(allJsonPath, JSON.stringify(klineArr), 'utf8');
                        logs.push(`✓ ${stock.id} 已 append 今日資料到 all.json`);
                    } else if (hasToday) {
                        logs.push(`✓ ${stock.id} all.json 已有今日資料，略過 append`);
                    }
                }
            } else {
                console.log(`⚠ ${stock.id} 無今日交易資料`);
            }
        } catch (error) {
            logs.push(`✗ 更新 ${stock.id} 今日資料失敗: ${error.message}`);
        }
    } else {
        logs.push(`跳過 ${stock.id} 今日資料更新，因歷史資料檔案無建立`);
    }
    return { id: stock.id, name: stock.name, logs };
}

/**
 * 檢查檔案是否存在
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * 原生週線策略計算 Worker (不使用 Comlink)
 * 專為 iOS Chrome 相容性設計
 */

// 直接使用專案中安裝的 dayjs
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// 使用專案的 IndexedDB 模組
import { initDB, putToStore, getFromStore } from '@/lib/idb';

// 擴展 dayjs 支援 ISO 週
dayjs.extend(isoWeek);

/**
 * 從 daily 資料計算週線 OHLC
 * @param {Array} dailyData - 日線資料 [[date, open, high, low, close, volume], ...]
 * @returns {Array} 週線資料 [[date, open, high, low, close, tradingVolume], ...]
 */
function calcWeeklyFromDaily(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        return [];
    }

    // 內建 slice, map, min, max, sum 函數，避免外部依賴
    const slice = (arr, start, end) => arr.slice(start, end);
    const map = (arr, fn) => arr.map(fn);
    const min = (arr) => Math.min(...arr);
    const max = (arr) => Math.max(...arr);
    const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);

    const resData = [];
    let i = dailyData.length - 1; // 從最後一筆資料開始（最舊的）
    let j = i;
    let firstDayOfWeek = dayjs(dailyData[i][0], 'YYYYMMDD').startOf('isoWeek');

    while (i >= 0) {
        if (dayjs(dailyData[i][0], 'YYYYMMDD').isBefore(firstDayOfWeek) || i === 0) {
            // startIndex 值要小於等於 endIndex，for 是由大到小, i<j
            const startIndex = i + 1; // 因為是找到前一個才算後面1個
            const endIndex = j; // 因為外層array 是從日期最現在，往以前日期去掃。endIndex應該是最現在日期. i比n大
            const range2dArray = slice(dailyData, startIndex, endIndex + 1);
            const rangeHighArray = map(range2dArray, v => v[2]);
            const rangeLowArray = map(range2dArray, v => v[3]);
            const rangeTradingVolumeArray = map(range2dArray, v => (v.length >= 6 ? v[5] : 0));

            const date = dailyData[endIndex][0];
            const open = dailyData[startIndex][1]; // 上一個n的意思， 也許有 bug n+1應該要<這迴圈數量，若只有1個就有問題
            const close = dailyData[endIndex][4]; // 之前的i，還沒i=n是下一個
            const low = min(rangeLowArray);
            const high = max(rangeHighArray);
            const tradingVolume = sum(rangeTradingVolumeArray);

            resData.push([date, open, high, low, close, tradingVolume]);
            j = startIndex - 1;

            // 要採用下個i值的該週第一天，不能用firstDayOfWeek-7天，因為有可能該週都沒值
            firstDayOfWeek = dayjs(dailyData[i][0], 'YYYYMMDD').startOf('isoWeek');
        }
        i -= 1;
    }

    return resData.reverse(); // 反轉回正常順序（由舊到新）
}

/**
 * 計算週線 KD 指標
 * @param {Array} weeklyData - 週線資料 [[date, open, high, low, close, volume], ...]
 * @returns {Object} KD 計算結果 { data: [], predictGoldPrice, predictDeadPrice }
 */
function calcWeeklyKdj(weeklyData) {
    if (!weeklyData || weeklyData.length === 0) {
        return { data: [], predictGoldPrice: null, predictDeadPrice: null };
    }

    // 內建工具函數
    const slice = (arr, start, end) => arr.slice(start, end);
    const map = (arr, fn) => arr.map(fn);
    const min = (arr) => Math.min(...arr);
    const max = (arr) => Math.max(...arr);

    let weeklyKdData = [];
    let rsv = 0;
    let preK = 0;
    let preD = 0;
    let todayK = 0;
    let todayD = 0;
    let todayJ = 0;
    let predictGoldPrice = null;
    let predictDeadPrice = null;

    for (let k = 0; k <= weeklyData.length - 1; k += 1) {
        const startIndex = k - 8 < 0 ? 0 : k - 8;
        const endIndex = k;
        const range2dArray = slice(weeklyData, startIndex, endIndex + 1);
        const rangeHighArray = map(range2dArray, v => v[2]); // 高
        const rangeLowArray = map(range2dArray, v => v[3]); // 低
        const low = min(rangeLowArray);
        const high = max(rangeHighArray);

        const close = weeklyData[k][4];
        rsv = high - low !== 0 ? ((close - low) / (high - low)) * 100 : 100;
        todayK = (2 / 3) * preK + (1 / 3) * rsv;
        todayD = (2 / 3) * preD + (1 / 3) * todayK;
        todayJ = 3 * todayD - 2 * todayK;
        preK = todayK;
        preD = todayD;
        const date = weeklyData[endIndex][0];

        weeklyKdData.push([date, todayK, todayD, todayJ]);

        // ✅ 如果是最後一週，內部計算黃金交叉 & 死亡交叉收盤價
        const isLast = k === weeklyData.length - 1;
        if (isLast) {
            const pastHighs = rangeHighArray.slice(0, -1);
            const pastLows = rangeLowArray.slice(0, -1);
            const thisWeekHigh = rangeHighArray[rangeHighArray.length - 1];
            const thisWeekLow = rangeLowArray[rangeLowArray.length - 1];

            // === 黃金交叉收盤價 ===
            // predictGoldPrice = calcCrossPrice(preK, preD, pastHighs, pastLows, thisWeekHigh, thisWeekLow, 'gold');

            // === 死亡交叉收盤價 ===
            // predictDeadPrice = calcCrossPrice(preK, preD, pastHighs, pastLows, thisWeekHigh, thisWeekLow, 'dead');
        }
    }

    return {
        data: weeklyKdData,
        predictGoldPrice,
        predictDeadPrice,
    };
}

/**
 * 計算週線 RSI 指標
 * @param {Array} weeklyData - 週線資料 [[date, open, high, low, close, volume], ...]
 * @returns {Array} RSI 計算結果 [[date, rsi], ...]
 */
function calcWeeklyRsi(weeklyData) {
    if (!weeklyData || weeklyData.length === 0) {
        return [];
    }

    const period = 5;
    let weeklyRsiData = [];
    let gains = [];
    let losses = [];
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < weeklyData.length; i++) {
        let closePrice = weeklyData[i][4];
        if (i === 0) {
            gains.push(0);
            losses.push(0);
        } else {
            let diff = closePrice - weeklyData[i - 1][4];
            gains.push(Math.max(diff, 0));
            losses.push(Math.max(-diff, 0));
        }

        if (i >= period) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        } else {
            avgGain = (avgGain * (i + 1) + gains[i]) / (i + 2);
            avgLoss = (avgLoss * (i + 1) + losses[i]) / (i + 2);
        }

        if (i >= period - 1) {
            let rs = avgGain / avgLoss;
            weeklyRsiData.push([weeklyData[i][0], 100 - 100 / (1 + rs)]);
        }
    }

    return weeklyRsiData;
}

// Worker 方法映射
const workerMethods = {
    calcPolicy: async function (params) {
        try {
            const { stockId, type, newDailyData, ...options } = params;

            if (!stockId) {
                throw new Error('stockId 參數必須提供');
            }

            // 從 IndexedDB 讀取現有的股票資料
            let existingData = await getFromStore('user-stock-data', stockId);
            let allDailyData = [];
            let existingWeeklyData = [];

            console.log(`[${stockId}] 開始處理股票資料`);
            console.log(`[${stockId}] 新增日線資料筆數:`, newDailyData ? newDailyData.length : 0);

            if (existingData && existingData.daily) {
                allDailyData = [...existingData.daily];
                existingWeeklyData = existingData.weekly || [];
                console.log(`[${stockId}] 現有日線資料筆數:`, allDailyData.length);
                console.log(`[${stockId}] 現有週線資料筆數:`, existingWeeklyData.length);
            } else {
                console.log(`[${stockId}] 無現有資料，從零開始計算`);
            }

            // 合併新的日線資料
            if (newDailyData && newDailyData.length > 0) {
                allDailyData = [...allDailyData, ...newDailyData];
                console.log(`[${stockId}] 合併後總日線資料筆數:`, allDailyData.length);
            }

            // 優化週線計算：只計算新增或需要更新的週線
            let weeklyData = [];
            if (newDailyData && newDailyData.length > 0 && existingWeeklyData.length > 0) {
                console.log(`[${stockId}] 執行增量週線計算`);
                
                // 找出需要重新計算的週線起始點
                const lastExistingDate = existingWeeklyData[existingWeeklyData.length - 1][0];
                const lastExistingWeek = dayjs(lastExistingDate, 'YYYYMMDD').startOf('isoWeek');
                console.log(`[${stockId}] 最後現有週線日期:`, lastExistingDate, '週開始:', lastExistingWeek.format('YYYY-MM-DD'));
                
                // 找出新資料中第一筆可能影響週線的日期
                const firstNewDate = newDailyData[0][0];
                const firstNewWeek = dayjs(firstNewDate, 'YYYYMMDD').startOf('isoWeek');
                console.log(`[${stockId}] 第一筆新資料日期:`, firstNewDate, '週開始:', firstNewWeek.format('YYYY-MM-DD'));
                
                if (firstNewWeek.isSameOrBefore(lastExistingWeek)) {
                    console.log(`[${stockId}] 新資料會影響最後一週，重新計算受影響週線`);
                    
                    // 新資料會影響最後一週，需要重新計算最後幾週
                    const weekDataToRecalc = allDailyData.filter(item => {
                        const itemWeek = dayjs(item[0], 'YYYYMMDD').startOf('isoWeek');
                        return itemWeek.isSameOrAfter(lastExistingWeek);
                    });
                    
                    console.log(`[${stockId}] 需要重新計算的日線資料筆數:`, weekDataToRecalc.length);
                    console.log(`[${stockId}] 重新計算範圍: ${weekDataToRecalc[0][0]} ~ ${weekDataToRecalc[weekDataToRecalc.length-1][0]}`);
                    
                    const newWeeklyData = calcWeeklyFromDaily(weekDataToRecalc);
                    console.log(`[${stockId}] 重新計算得到週線筆數:`, newWeeklyData.length);
                    
                    // 移除舊的最後一週，加入新計算的週線
                    weeklyData = [...existingWeeklyData.slice(0, -1), ...newWeeklyData];
                    console.log(`[${stockId}] 保留現有週線:`, existingWeeklyData.length - 1, '筆，新增:', newWeeklyData.length, '筆');
                } else {
                    console.log(`[${stockId}] 新資料不影響現有週線，只計算新週線`);
                    
                    // 新資料不影響現有週線，只需計算新週線
                    const newWeeklyData = calcWeeklyFromDaily(newDailyData);
                    console.log(`[${stockId}] 新週線資料筆數:`, newWeeklyData.length);
                    
                    weeklyData = [...existingWeeklyData, ...newWeeklyData];
                    console.log(`[${stockId}] 現有週線:`, existingWeeklyData.length, '筆，新增:', newWeeklyData.length, '筆');
                }
            } else {
                console.log(`[${stockId}] 執行完整週線計算 (無現有資料或無新資料)`);
                
                // 沒有現有週線資料或沒有新資料，重新計算全部
                weeklyData = calcWeeklyFromDaily(allDailyData);
                console.log(`[${stockId}] 完整計算得到週線筆數:`, weeklyData.length);
            }

            console.log(`[${stockId}] 最終週線資料筆數:`, weeklyData.length);

            console.log(`[${stockId}] 最終週線資料筆數:`, weeklyData.length);

            if (weeklyData.length === 0) {
                throw new Error('無法產生週線資料，請檢查日線資料格式');
            }

            // 優化技術指標計算：只重新計算受影響的部分
            let weeklyKdj, weeklyRsi;
            
            console.log(`[${stockId}] 開始計算技術指標`);
            
            if (existingData && existingData.weeklyKdj && existingData.weeklyRsi && 
                existingWeeklyData.length > 0 && weeklyData.length > existingWeeklyData.length) {
                
                console.log(`[${stockId}] 檢查是否可以增量計算技術指標`);
                console.log(`[${stockId}] 現有KDJ資料筆數:`, existingData.weeklyKdj.length);
                console.log(`[${stockId}] 現有RSI資料筆數:`, existingData.weeklyRsi.length);
                
                // 如果只是新增週線資料，可以基於現有指標計算
                const newWeeksCount = weeklyData.length - existingWeeklyData.length;
                console.log(`[${stockId}] 新增週線筆數:`, newWeeksCount);
                
                if (newWeeksCount === weeklyData.length - existingWeeklyData.length && newWeeksCount <= 2) {
                    console.log(`[${stockId}] 少量新週線，使用增量計算邏輯`);
                    // 少量新週線，使用增量計算（這裡簡化，實際可以更精確）
                    weeklyKdj = calcWeeklyKdj(weeklyData);
                    weeklyRsi = calcWeeklyRsi(weeklyData);
                } else {
                    console.log(`[${stockId}] 較多變動，重新計算全部技術指標`);
                    // 較多變動，重新計算全部
                    weeklyKdj = calcWeeklyKdj(weeklyData);
                    weeklyRsi = calcWeeklyRsi(weeklyData);
                }
            } else {
                console.log(`[${stockId}] 無現有技術指標資料，重新計算全部`);
                // 沒有現有指標資料，重新計算全部
                weeklyKdj = calcWeeklyKdj(weeklyData);
                weeklyRsi = calcWeeklyRsi(weeklyData);
            }

            console.log(`[${stockId}] KDJ計算完成，資料筆數:`, weeklyKdj.data ? weeklyKdj.data.length : 0);
            console.log(`[${stockId}] RSI計算完成，資料筆數:`, weeklyRsi ? weeklyRsi.length : 0);

            console.log(`[${stockId}] KDJ計算完成，資料筆數:`, weeklyKdj.data ? weeklyKdj.data.length : 0);
            console.log(`[${stockId}] RSI計算完成，資料筆數:`, weeklyRsi ? weeklyRsi.length : 0);

            // 更新資料到 IndexedDB
            const dataToSave = {
                id: stockId,
                daily: allDailyData,
                weekly: weeklyData,
                weeklyKdj: weeklyKdj.data,
                weeklyRsi,
                lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                fetchedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            console.log(`[${stockId}] 準備儲存資料到 IndexedDB`);
            console.log(`[${stockId}] 儲存資料摘要: 日線${dataToSave.daily.length}筆, 週線${dataToSave.weekly.length}筆, KDJ${dataToSave.weeklyKdj.length}筆, RSI${dataToSave.weeklyRsi.length}筆`);

            // 如果原本有其他資料，保留它們
            if (existingData) {
                console.log(`[${stockId}] 合併現有資料`);
                Object.assign(dataToSave, existingData, dataToSave);
            }

            await putToStore('user-stock-data', dataToSave);
            console.log(`[${stockId}] 資料已成功儲存到 IndexedDB`);

            const result = {
                success: true,
                stockId,
                weekly: weeklyData.slice(-26),
                weeklyKdj: weeklyKdj.data.slice(-26),
                weeklyRsi: weeklyRsi.slice(-26),
                processedAt: new Date().toISOString(),
            };

            console.log(`[${stockId}] 回傳結果: 週線${result.weekly.length}筆, KDJ${result.weeklyKdj.length}筆, RSI${result.weeklyRsi.length}筆`);
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                processedAt: new Date().toISOString(),
            };
        }
    },

    ping: async function () {
        return 'Native Worker Pong! ' + new Date().toISOString();
    },
};

// 原生 Worker 訊息處理
self.onmessage = async function (event) {
    const { messageId, method, params } = event.data;

    try {
        if (workerMethods[method]) {
            const result = await workerMethods[method](params);
            // result = {
            //     success: true, // 是否成功
            //     stockId: '股票代碼',
            //     weekly: [      // 週線資料，最多26筆
            //         [date, open, high, low, close, tradingVolume],
            //         // ...
            //     ],
            //     weeklyKdj: [   // 週線KD資料，最多26筆
            //         [date, K, D, J],
            //         // ...
            //     ],
            //     weeklyRsi: [   // 週線RSI資料，最多26筆
            //         [date, rsi],
            //         // ...
            //     ],
            //     processedAt: '2025-08-27T12:34:56.789Z', // 處理完成時間
            // }

            self.postMessage({
                messageId,
                result,
                error: null,
            });
        } else {
            throw new Error(`未知的方法: ${method}`);
        }
    } catch (error) {
        self.postMessage({
            messageId,
            result: null,
            error: error.message,
        });
    }
};

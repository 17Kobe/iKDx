import { expose } from 'comlink';
import _ from 'lodash';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { initDB, putToStore, getDB } from '@/lib/idb';

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

    const resData = [];
    let i = dailyData.length - 1; // 從最後一筆資料開始（最舊的）
    let j = i;
    let firstDayOfWeek = dayjs(dailyData[i][0]).startOf('isoWeek');

    while (i >= 0) {
        if (dayjs(dailyData[i][0]).isBefore(firstDayOfWeek) || i === 0) {
            // startIndex 值要小於等於 endIndex，for 是由大到小, i<j
            const startIndex = i + 1; // 因為是找到前一個才算後面1個
            const endIndex = j; // 因為外層array 是從日期最現在，往以前日期去掃。endIndex應該是最現在日期. i比n大
            const range2dArray = _.slice(dailyData, startIndex, endIndex + 1);
            const rangeHighArray = _.map(range2dArray, v => v[2]);
            const rangeLowArray = _.map(range2dArray, v => v[3]);
            const rangeTradingVolumeArray = _.map(range2dArray, v => (v.length >= 6 ? v[5] : 0));

            const date = dailyData[endIndex][0];
            const open = dailyData[startIndex][1]; // 上一個n的意思， 也許有 bug n+1應該要<這迴圈數量，若只有1個就有問題
            const close = dailyData[endIndex][4]; // 之前的i，還沒i=n是下一個
            const low = _.min(rangeLowArray);
            const high = _.max(rangeHighArray);
            const tradingVolume = _.sum(rangeTradingVolumeArray);

            resData.push([date, open, high, low, close, tradingVolume]);
            j = startIndex - 1;

            // 要採用下個i值的該週第一天，不能用firstDayOfWeek-7天，因為有可能該週都沒值
            firstDayOfWeek = dayjs(dailyData[i][0]).startOf('isoWeek');
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
        const range2dArray = _.slice(weeklyData, startIndex, endIndex + 1);
        const rangeHighArray = _.map(range2dArray, v => v[2]); // 高
        const rangeLowArray = _.map(range2dArray, v => v[3]); // 低
        const low = _.min(rangeLowArray);
        const high = _.max(rangeHighArray);

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

function calcMA(weeklyData) {
    // TODO: 實際的 MA 計算邏輯
    return { ma: 'MA結果' };
}

/**
 * 主要處理函式：從 IndexedDB 讀取日線資料，合併新資料，計算週線並儲存
 * @param {string} stockId - 股票代碼
 * @param {Array} newDailyData - 新增的日線資料
 * @returns {Object} 包含週線資料和技術指標的物件
 */
async function processPolicy(stockId, type, newDailyData) {
    try {
        // 初始化 IndexedDB
        await initDB();
        const db = await getDB();

        // 從 IndexedDB 讀取現有的股票資料
        let existingData = await db.get('user-stock-data', stockId);
        let allDailyData = [];

        if (existingData && existingData.daily) {
            allDailyData = [...existingData.daily];
        }

        // 合併新的日線資料
        if (newDailyData && newDailyData.length > 0) {
            allDailyData = [...allDailyData, ...newDailyData];
        }

        // 計算週線
        const weeklyData = calcWeeklyFromDaily(allDailyData);

        // 計算週線技術指標（並行執行）
        const [weeklyKdj, weeklyRsi, ma] = await Promise.all([
            Promise.resolve(calcWeeklyKdj(weeklyData)),
            Promise.resolve(calcWeeklyRsi(weeklyData)),
            Promise.resolve(calcMA(weeklyData)),
        ]);

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

        // 如果原本有其他資料，保留它們
        if (existingData) {
            Object.assign(dataToSave, existingData, dataToSave);
        }

        await putToStore('user-stock-data', dataToSave);
        console.log(`股票 ${stockId} 週線計算完成並已儲存到 IndexedDB`);

        return {
            stockId,
            weekly: weeklyData.slice(-26),
            weeklyKdj: weeklyKdj.data.slice(-26),
            weeklyRsi: weeklyRsi.slice(-26),
        };
    } catch (error) {
        console.error(`股票 ${stockId} 週線計算失敗:`, error);
        throw error;
    }
}

expose({ processPolicy });

import { expose } from 'comlink';
import _ from 'lodash';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

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
 * 計算技術指標（KD、RSI、MA）
 * @param {Array} weeklyData - 週線資料
 * @returns {Object} 包含各項技術指標的物件
 */
function calcKD(weeklyData) {
    // TODO: 實際的 KD 計算邏輯
    return { kd: 'KD結果' };
}

function calcRSI(weeklyData) {
    // TODO: 實際的 RSI 計算邏輯
    return { rsi: 'RSI結果' };
}

function calcMA(weeklyData) {
    // TODO: 實際的 MA 計算邏輯
    return { ma: 'MA結果' };
}

/**
 * 主要處理函式：從 daily 資料計算週線並計算技術指標
 * @param {Array} dailyData - 日線資料
 * @returns {Object} 包含週線資料和技術指標的物件
 */
async function processPolicy(dailyData) {
    try {
        // 計算週線
        const weeklyData = calcWeeklyFromDaily(dailyData);

        // 計算技術指標
        const kd = calcKD(weeklyData);
        const rsi = calcRSI(weeklyData);
        const ma = calcMA(weeklyData);

        return {
            weeklyData,
            indicators: { ...kd, ...rsi, ...ma },
        };
    } catch (error) {
        console.error('週線計算失敗:', error);
        throw error;
    }
}

expose({ processPolicy });

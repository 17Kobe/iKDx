// Classic Worker 版本的週線計算器（iOS 相容）
// 使用 importScripts 而非 ES Module

importScripts('https://unpkg.com/comlink/dist/umd/comlink.js');

// 簡化的日期處理函數
function parseDate(dateStr) {
    return new Date(dateStr);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整到週一
    return new Date(d.setDate(diff));
}

// 簡化的工具函數
function min(array) {
    return Math.min(...array);
}

function max(array) {
    return Math.max(...array);
}

function sum(array) {
    return array.reduce((a, b) => a + b, 0);
}

function slice(array, start, end) {
    return array.slice(start, end);
}

/**
 * 從 daily 資料計算週線 OHLC
 */
function calcWeeklyFromDaily(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        return [];
    }
    
    const resData = [];
    let i = dailyData.length - 1;
    let j = i;
    let firstDayOfWeek = getWeekStart(new Date(dailyData[i][0]));
    
    while (i >= 0) {
        const currentDate = new Date(dailyData[i][0]);
        
        if (currentDate < firstDayOfWeek || i === 0) {
            const startIndex = i + 1;
            const endIndex = j;
            const range2dArray = slice(dailyData, startIndex, endIndex + 1);
            const rangeHighArray = range2dArray.map(v => v[2]);
            const rangeLowArray = range2dArray.map(v => v[3]);
            const rangeTradingVolumeArray = range2dArray.map(v => (v.length >= 6 ? v[5] : 0));
            
            const date = dailyData[endIndex][0];
            const open = dailyData[startIndex][1];
            const close = dailyData[endIndex][4];
            const low = min(rangeLowArray);
            const high = max(rangeHighArray);
            const tradingVolume = sum(rangeTradingVolumeArray);
            
            resData.push([date, open, high, low, close, tradingVolume]);
            j = startIndex - 1;
            
            firstDayOfWeek = getWeekStart(new Date(dailyData[i][0]));
        }
        i -= 1;
    }
    
    return resData.reverse();
}

/**
 * 簡化的 KDJ 計算
 */
function calcWeeklyKdj(weeklyData, period = 9) {
    if (!weeklyData || weeklyData.length < period) {
        return { data: [] };
    }
    
    const kdjData = [];
    let k = 50, d = 50;
    
    for (let i = period - 1; i < weeklyData.length; i++) {
        const rangeLow = min(weeklyData.slice(i - period + 1, i + 1).map(v => v[3]));
        const rangeHigh = max(weeklyData.slice(i - period + 1, i + 1).map(v => v[2]));
        const close = weeklyData[i][4];
        
        const rsv = rangeHigh === rangeLow ? 50 : ((close - rangeLow) / (rangeHigh - rangeLow)) * 100;
        
        k = (2/3) * k + (1/3) * rsv;
        d = (2/3) * d + (1/3) * k;
        const j = 3 * k - 2 * d;
        
        kdjData.push([weeklyData[i][0], k, d, j]);
    }
    
    return { data: kdjData };
}

/**
 * 簡化的 RSI 計算
 */
function calcWeeklyRsi(weeklyData, period = 14) {
    if (!weeklyData || weeklyData.length < period + 1) {
        return [];
    }
    
    const rsiData = [];
    
    for (let i = period; i < weeklyData.length; i++) {
        let gains = 0, losses = 0;
        
        for (let j = i - period + 1; j <= i; j++) {
            const change = weeklyData[j][4] - weeklyData[j - 1][4];
            if (change > 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 1);
        const rsi = 100 - (100 / (1 + rs));
        
        rsiData.push([weeklyData[i][0], rsi]);
    }
    
    return rsiData;
}

/**
 * 移動平均線計算
 */
function calcMA(weeklyData, periods = [5, 10, 20]) {
    const maData = {};
    
    periods.forEach(period => {
        maData['ma' + period] = [];
        
        for (let i = period - 1; i < weeklyData.length; i++) {
            const sum = weeklyData.slice(i - period + 1, i + 1)
                .reduce((acc, curr) => acc + curr[4], 0);
            const avg = sum / period;
            maData['ma' + period].push([weeklyData[i][0], avg]);
        }
    });
    
    return maData;
}

/**
 * Worker API
 */
const api = {
    ping: () => ({
        status: 'ok',
        timestamp: Date.now(),
        workerType: 'classic-weekly-policy-worker',
        platform: 'iOS Compatible'
    }),
    
    processPolicy: (data) => {
        const { stockId, dailyData } = data;
        
        try {
            // 計算週線
            const weeklyData = calcWeeklyFromDaily(dailyData);
            
            // 計算技術指標
            const weeklyKdj = calcWeeklyKdj(weeklyData);
            const weeklyRsi = calcWeeklyRsi(weeklyData);
            const ma = calcMA(weeklyData);
            
            return {
                stockId,
                weekly: weeklyData.slice(-26),
                weeklyKdj: weeklyKdj.data.slice(-26),
                weeklyRsi: weeklyRsi.slice(-26),
                ma,
            };
        } catch (error) {
            throw new Error('Classic週線計算失敗: ' + error.message);
        }
    }
};

// 使用 Comlink 暴露 API
Comlink.expose(api);

console.log('📱 Classic Worker (iOS 相容) 週線計算器已準備就緒');

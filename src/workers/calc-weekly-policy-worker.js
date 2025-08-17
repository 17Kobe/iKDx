/**
 * 原生週線策略計算 Worker (不使用 Comlink)
 * 專為 iOS Chrome 相容性設計
 */

// 直接使用專案中安裝的 dayjs
import dayjs from 'dayjs';

// 內建工具函數，避免外部依賴
function calcWeeklyFromDaily(dailyData) {
    if (!dailyData || dailyData.length === 0) return [];

    const weeklyData = [];
    let currentWeek = null;

    for (const dayArray of dailyData) {
        // 處理陣列格式: [日期, 開盤, 最高, 最低, 收盤, 成交量]
        const dateStr = dayArray[0].toString();
        const date = dayjs(dateStr, 'YYYYMMDD').toDate();

        // 檢查日期是否有效
        if (isNaN(date.getTime())) {
            console.warn('無效的日期格式:', dateStr);
            continue;
        }

        const day = {
            date: dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD'),
            open: parseFloat(dayArray[1]),
            high: parseFloat(dayArray[2]),
            low: parseFloat(dayArray[3]),
            close: parseFloat(dayArray[4]),
            volume: parseFloat(dayArray[5]) || 0,
        };

        const weekKey = getWeekKey(date);

        if (!currentWeek || currentWeek.weekKey !== weekKey) {
            if (currentWeek) {
                weeklyData.push(createWeeklyCandle(currentWeek));
            }
            currentWeek = {
                weekKey,
                open: day.open,
                high: day.high,
                low: day.low,
                close: day.close,
                volume: day.volume || 0,
                date: day.date,
            };
        } else {
            currentWeek.high = Math.max(currentWeek.high, day.high);
            currentWeek.low = Math.min(currentWeek.low, day.low);
            currentWeek.close = day.close;
            currentWeek.volume += day.volume || 0;
            currentWeek.date = day.date;
        }
    }

    if (currentWeek) {
        weeklyData.push(createWeeklyCandle(currentWeek));
    }

    return weeklyData;
}

function getWeekKey(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const mondayDate = new Date(d);
    mondayDate.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    return mondayDate.toISOString().split('T')[0];
}

function createWeeklyCandle(week) {
    return {
        date: week.date,
        open: week.open,
        high: week.high,
        low: week.low,
        close: week.close,
        volume: week.volume,
    };
}

function calcWeeklyKdj(weeklyData, period = 9) {
    if (!weeklyData || weeklyData.length < period) return [];

    const kdj = [];

    for (let i = period - 1; i < weeklyData.length; i++) {
        const periodData = weeklyData.slice(i - period + 1, i + 1);
        const highest = Math.max(...periodData.map(d => d.high));
        const lowest = Math.min(...periodData.map(d => d.low));
        const close = weeklyData[i].close;

        const rsv = lowest === highest ? 50 : ((close - lowest) / (highest - lowest)) * 100;

        let k, d, j;
        if (i === period - 1) {
            k = d = rsv;
        } else {
            const prevKDJ = kdj[kdj.length - 1];
            k = (2 * prevKDJ.k + rsv) / 3;
            d = (2 * prevKDJ.d + k) / 3;
        }
        j = 3 * k - 2 * d;

        kdj.push({
            date: weeklyData[i].date,
            k: Number(k.toFixed(2)),
            d: Number(d.toFixed(2)),
            j: Number(j.toFixed(2)),
        });
    }

    return kdj;
}

function calcWeeklyRsi(weeklyData, period = 14) {
    if (!weeklyData || weeklyData.length < period + 1) return [];

    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < weeklyData.length; i++) {
        const change = weeklyData[i].close - weeklyData[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
        const periodGains = gains.slice(i - period + 1, i + 1);
        const periodLosses = losses.slice(i - period + 1, i + 1);

        const avgGain = periodGains.reduce((sum, gain) => sum + gain, 0) / period;
        const avgLoss = periodLosses.reduce((sum, loss) => sum + loss, 0) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - 100 / (1 + rs);

        rsi.push({
            date: weeklyData[i + 1].date,
            rsi: Number(rsiValue.toFixed(2)),
        });
    }

    return rsi;
}

// Worker 方法映射
const workerMethods = {
    processPolicy: async function (params) {
        try {
            const { dailyData, ...options } = params;

            if (!dailyData || dailyData.length === 0) {
                throw new Error('日線資料為空');
            }

            // 轉換為週線
            const weeklyData = calcWeeklyFromDaily(dailyData);

            if (weeklyData.length === 0) {
                throw new Error('無法產生週線資料，請檢查日線資料格式');
            }

            // 計算技術指標
            const weeklyKdj = calcWeeklyKdj(weeklyData, options.kdjPeriod || 9);
            const weeklyRsi = calcWeeklyRsi(weeklyData, options.rsiPeriod || 14);

            return {
                success: true,
                weekly: weeklyData,
                weeklyKdj,
                weeklyRsi,
                processedAt: new Date().toISOString(),
            };
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

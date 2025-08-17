/**
 * 原生趨勢圖表計算 Worker (不使用 Comlink)
 * 專為 iOS Chrome 相容性設計
 */

// 內建工具函數
function calculateMovingAverage(stockData, period) {
    const result = [];
    
    for (let i = period - 1; i < stockData.length; i++) {
        const slice = stockData.slice(i - period + 1, i + 1);
        // 處理陣列格式: [日期, 開盤, 最高, 最低, 收盤, 成交量]
        const sum = slice.reduce((acc, item) => acc + parseFloat(item[4]), 0); // 收盤價
        const average = sum / period;
        
        result.push({
            date: stockData[i][0], // 日期
            value: Number(average.toFixed(2)),
        });
    }
    
    return result;
}

function calculateBollingerBands(stockData, period = 20, stdDev = 2) {
    const ma = calculateMovingAverage(stockData, period);
    const bands = [];
    
    for (let i = 0; i < ma.length; i++) {
        const dataIndex = i + period - 1;
        const slice = stockData.slice(dataIndex - period + 1, dataIndex + 1);
        
        // 計算標準差
        const prices = slice.map(item => parseFloat(item[4])); // 收盤價
        const mean = ma[i].value;
        const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        bands.push({
            date: ma[i].date,
            upper: Number((mean + (stdDev * standardDeviation)).toFixed(2)),
            middle: mean,
            lower: Number((mean - (stdDev * standardDeviation)).toFixed(2)),
        });
    }
    
    return bands;
}

// Worker 方法映射
const workerMethods = {
    calculateTrend: async function(params) {
        try {
            const { stockData, trendParams = {} } = params;
            
            if (!stockData || stockData.length === 0) {
                throw new Error('股價資料為空');
            }
            
            const { maPeriod = 20, bbPeriod = 20, bbStdDev = 2 } = trendParams;
            
            // 計算移動平均線
            const ma = calculateMovingAverage(stockData, maPeriod);
            
            // 計算布林通道
            const bollingerBands = calculateBollingerBands(stockData, bbPeriod, bbStdDev);
            
            return {
                success: true,
                movingAverage: ma,
                bollingerBands,
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
    
    ping: async function() {
        return 'Trend Worker Pong! ' + new Date().toISOString();
    },
};

// 原生 Worker 訊息處理
self.onmessage = async function(event) {
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

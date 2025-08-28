/**
 * 原生交易計算 Worker (不使用 Comlink)
 * 專為 iOS Chrome 相容性設計
 */

// Worker 方法映射
const workerMethods = {
    calcTrade: async function(params) {
        try {
            const { stockData, tradeParams } = params;
            
            if (!stockData || stockData.length === 0) {
                throw new Error('股價資料為空');
            }
            
            // 處理陣列格式資料: [日期, 開盤, 最高, 最低, 收盤, 成交量]
            const firstData = stockData[0];
            const lastData = stockData[stockData.length - 1];
            
            // 模擬交易計算邏輯
            const result = {
                entryPrice: parseFloat(firstData[4]), // 收盤價
                exitPrice: parseFloat(lastData[4]),   // 收盤價
                trades: stockData.length,
                profit: 0,
                profitRate: 0,
                startDate: firstData[0],
                endDate: lastData[0],
            };
            
            result.profit = result.exitPrice - result.entryPrice;
            result.profitRate = (result.profit / result.entryPrice) * 100;
            
            return {
                success: true,
                result,
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
        return 'Trade Worker Pong! ' + new Date().toISOString();
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

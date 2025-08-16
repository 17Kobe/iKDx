import { defineStore } from 'pinia';
import { ref } from 'vue';
import _ from 'lodash';
import dayjs from 'dayjs';
import { workerPoolManager } from '@/workers/worker-pool';
import { fetchStockPriceByLastDate, getUserStockData } from '@/services/user-stock-data-service';
import {
    getUserStockInfo,
    clearUserStockInfo,
    deleteUserStockInfo,
    putUserStockInfo,
} from '@/services/user-stock-info-service';
import { getAllStocksById, putAllStocks } from '@/services/all-stocks-service';

// 初始化 Worker Pools (使用 CPU 核心數控制併發)
const policyPool = workerPoolManager.getPool(
    'policy',
    new URL('@/workers/calc-weekly-policy-worker.js', import.meta.url)
);
const tradePool = workerPoolManager.getPool(
    'trade',
    new URL('@/workers/calc-trade-worker.js', import.meta.url)
);
const trendPool = workerPoolManager.getPool(
    'trend',
    new URL('@/workers/calc-trend-chart-worker.js', import.meta.url)
);

// 開啟 Worker Pool 狀態監控（開發時使用）
if (import.meta.env.DEV) {
    workerPoolManager.onAllStatusChange((poolName, status, allStatus) => {
        console.log(`[Worker Pool] ${poolName}:`, status);
    });
}

export const useUserStockListStore = defineStore('userStockList', () => {
    // 初始化一些測試資料
    const userStockList = ref([
        // {
        //     id: '2330',
        //     name: '台積電',
        //     code: '2330',
        //     price: 589,
        //     change: 12,
        //     changePercent: 2.08,
        //     weeklyKD: 65,
        //     rsi: 58,
        //     addedAt: new Date().toISOString(),
        // },
        // {
        //     id: '2317',
        //     name: '鴻海',
        //     code: '2317',
        //     price: 102,
        //     change: -2,
        //     changePercent: -1.92,
        //     weeklyKD: 34,
        //     rsi: 42,
        //     addedAt: new Date().toISOString(),
        // },
        // {
        //     id: '2454',
        //     name: '聯發科',
        //     code: '2454',
        //     price: 895,
        //     change: 25,
        //     changePercent: 2.87,
        //     weeklyKD: 78,
        //     rsi: 68,
        //     addedAt: new Date().toISOString(),
        // },
    ]);

    /**
     * 依據股票 id 取得 userStockList 中的股票物件與 index
     * @param {string} stockId - 股票代碼
     * @returns {{ stock: Object|null, index: number }}
     */
    function getStockListStoreById(stockId) {
        const foundStockIndex = userStockList.value.findIndex(s => s.id === stockId);
        return {
            foundStock: foundStockIndex !== -1 ? userStockList.value[foundStockIndex] : null,
            foundStockIndex,
        };
    }

    /**
     * 更新股票價格資料（使用 Worker Pool 自動管理併發）
     * @param {string|string[]|null} stockIds - 股票代碼，null 表示全部
     * @param {Object} options - 設定
     */
    async function updateStockListPrices(stockIds = null, options = {}) {
        const { updateIndexedDB = true } = options;
        let targetStocks = [];
        let targetIndices = [];

        // 決定 targetStocks, targetIndices
        if (stockIds === null) {
            targetStocks = userStockList.value;
            targetIndices = userStockList.value.map((_, index) => index);
        } else if (typeof stockIds === 'string') {
            const { foundStock, foundStockIndex } = getStockListStoreById(stockIds);
            if (!foundStock) {
                console.warn(`找不到股票 ${stockIds}`);
                return;
            }
            targetStocks = [foundStock];
            targetIndices = [foundStockIndex];
        } else if (Array.isArray(stockIds)) {
            targetStocks = [];
            targetIndices = [];
            stockIds.forEach(stockId => {
                const { foundStock, foundStockIndex } = getStockListStoreById(stockId);
                if (foundStock) {
                    targetStocks.push(foundStock);
                    targetIndices.push(foundStockIndex);
                }
            });
        } else {
            console.warn('stockIds 參數格式錯誤');
            return;
        }

        if (targetStocks.length === 0) {
            console.log('無股票需要更新價格');
            return;
        }

        console.log(`開始更新 ${targetStocks.length} 支股票價格...`);

        // 並行處理所有股票（Worker Pool 自動控制併發數）
        const promises = targetStocks.map(async (stock, i) => {
            try {
                // 1. 抓取價格資料
                const newPriceData = await fetchStockPriceByLastDate(stock.id, stock.lastPriceDate);

                if (newPriceData) {
                    const targetIndex = targetIndices[i];

                    // 2. 使用 Worker Pool 進行計算（自動排隊）
                    const workerResult = await processStockWorker(
                        newPriceData,
                        ({ symbol, step, totalSteps, message }) => {
                            console.log(`股票 ${symbol}: ${message} (${step}/${totalSteps})`);
                        }
                    );

                    // // 3. 合併計算結果
                    // if (workerResult) {
                    //     userStockList.value[targetIndex] = {
                    //         ...userStockList.value[targetIndex],
                    //         policyKD: workerResult.indicators?.kd,
                    //         rsi: workerResult.indicators?.rsi,
                    //         ma: workerResult.indicators?.ma,
                    //         trade: workerResult.trade,
                    //         signals: workerResult.signals,
                    //         calculatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    //     };
                    // }

                    // 4. 單筆更新時直接儲存 IndexedDB
                    if (typeof stockIds === 'string' && updateIndexedDB) {
                        const d = JSON.parse(JSON.stringify(userStockList.value[targetIndex]));
                        putUserStockInfo(d).catch(error => {
                            console.error(`儲存股票 ${stock.id} 到 IndexedDB 失敗:`, error);
                        });
                    }

                    // 5. 立即更新價格資料到 Pinia
                    const originalStock = userStockList.value[targetIndex];
                    userStockList.value[targetIndex] = {
                        ...originalStock,
                        fetchedAt: newPriceData.fetchedAt,
                        lastPrice: newPriceData.lastPrice,
                        lastPriceDate: newPriceData.lastPriceDate,
                    };
                }
            } catch (error) {
                console.error(`股票 ${stock.id} 更新失敗:`, error);
            }
        });

        // 等待所有股票處理完成
        await Promise.all(promises);

        // 批量更新時統一儲存 IndexedDB
        if (typeof stockIds !== 'string' && updateIndexedDB) {
            await saveStockListToIndexedDB();
        }

        console.log(`${targetStocks.length} 支股票更新完成`);
    }

    /**
     * 處理單支股票的 Worker 計算（使用 Worker Pool）
     * @param {Object} stock - 股票資料
     * @param {Function} onProgress - 進度回調
     */
    async function processStockWorker(newPriceData, onProgress = () => {}) {
        try {
            onProgress({
                symbol: newPriceData.id,
                step: 1,
                totalSteps: 3,
                message: '計算週線與技術指標...',
            });

            // Step 1 & 2: 週線技術指標和政策報酬率平行計算
            const [policyResult, tradeResult] = await Promise.all([
                policyPool.execute('processPolicy', newPriceData.newDailyData || []),
                tradePool.execute('processTrade', newPriceData.newDailyData || []),
            ]);

            onProgress({
                symbol: newPriceData.id,
                step: 2,
                totalSteps: 3,
                message: '平行計算完成，開始計算訊號...',
            });

            // Step 3: 使用前兩步的結果計算訊號位置
            const signalResult = await trendPool.execute('processSignal', {
                policyResult,
                tradeResult,
            });

            onProgress({ symbol: newPriceData.id, step: 3, totalSteps: 3, message: '計算完成' });

            return {
                stockId: newPriceData.id,
                signals: signalResult.signal,
                // indicators: policyResult.indicators,
                // policyData: policyResult.policyData,
                // trade: tradeResult.trade,
            };
        } catch (error) {
            console.error(`股票 ${newPriceData.id} Worker 計算失敗:`, error);
            return null;
        }
    }

    /**
     * 從 IndexedDB 載入使用者股票清單並更新價格資料
     */
    async function loadUserStockList() {
        try {
            console.log('開始載入使用者股票清單...');
            const stocks = await getUserStockInfo();
            console.log('從 IndexedDB 載入的股票:', stocks);

            // 如果 IndexedDB 中有資料，使用載入的資料；否則保持現有的測試資料
            if (stocks && stocks.length > 0) {
                userStockList.value = stocks;

                // 批量更新所有股票的價格資料
                // await updateStockPrices();
            }
            return userStockList.value;
        } catch (error) {
            console.error('載入使用者股票清單失敗:', error);
            // 發生錯誤時保持現有資料，不要清空
            return userStockList.value;
        }
    }

    /**
     * 新增股票到使用者清單並抓取價格資料
     * @param {Object} stock - 股票資料 { id, name }
     */
    async function addStockToList(stock) {
        // Proxy(Object) {id: '2330', name: '台積電', industryCategory: Array(2), type: 'twse'}
        console.log('開始新增股票:', stock);

        // 檢查是否已存在
        const exists = userStockList.value.find(s => s.id === stock.id);
        if (exists) {
            console.log('股票已存在，取消新增');
            return { success: false, message: '股票已存在於清單中' };
        }

        // newStock，保留原本 stock 物件內容，但 industryCategory 要從 proxy(array) -> array，擴增 addedAt 欄位
        const newStock = {
            ...stock,
            industryCategory: Array.from(stock.industryCategory || []), // industryCategory 從 stock 取出，然後不支援響應
            addedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };

        console.log('新增股票到 Pinia store:', newStock);
        userStockList.value.push(newStock);

        // 儲存到 IndexedDB
        try {
            console.log('準備儲存股票到 user-stock-info:', newStock);
            await putUserStockInfo(newStock);
            console.log('股票已成功儲存到 user-stock-info');
            // 背景抓取該股票的價格資料
            updateStockListPrices(stock.id).catch(error => {
                console.error(`背景更新股票 ${stock.id} 價格失敗:`, error);
            });
            return { success: true, message: '股票已新增至清單' };
        } catch (error) {
            console.error('儲存股票失敗:', error);
            // 如果 IndexedDB 失敗，從 Pinia 中移除
            userStockList.value = userStockList.value.filter(s => s.id !== stock.id);
            return { success: false, message: '新增失敗，請稍後再試' };
        }
    }

    /**
     * 從使用者清單移除股票
     * @param {string} stockId - 股票代碼
     */
    async function removeStockFromList(stockId) {
        try {
            // 從 IndexedDB 移除
            await deleteUserStockInfo(stockId);
            // 從 Pinia store 移除
            userStockList.value = userStockList.value.filter(s => s.id !== stockId);
            return { success: true, message: '股票已從清單中移除' };
        } catch (error) {
            console.error('移除股票失敗:', error);
            return { success: false, message: '移除失敗，請稍後再試' };
        }
    }

    /**
     * 檢查股票是否已在使用者清單中
     * @param {string} stockId - 股票代碼
     */
    function isStockInList(stockId) {
        return userStockList.value.some(s => s.id === stockId);
    }

    /**
     * 重新排序股票列表（支援拖拽排序）
     * @param {Array} newOrder - 重新排序後的股票陣列
     */
    async function reorderStockList(newOrder) {
        userStockList.value = newOrder;
        await saveStockListToIndexedDB();
    }

    /**
     * 將所有股票資料儲存到 IndexedDB
     */
    async function saveStockListToIndexedDB() {
        try {
            await clearUserStockInfo();
            for (const stock of userStockList.value) {
                // 只存純資料欄位
                const d = JSON.parse(JSON.stringify(stock));
                // const info = {
                //     id: stock.id,
                //     name: stock.name,
                //     industryCategory: Array.from(stock.industryCategory || []),
                //     type: stock.type,
                //     addedAt: stock.addedAt,
                // };
                await putUserStockInfo(d);
            }
        } catch (error) {
            console.error('儲存股票排序失敗:', error);
        }
    }

    /**
     * 根據 ID 從 IndexedDB 獲取單一股票資料
     * @param {string} id - 股票代碼
     */
    async function loadStockToList(id) {
        const stock = await getAllStocksById(id);
        if (stock) {
            const exists = userStockList.value.find(s => s.id === stock.id);
            if (!exists) {
                userStockList.value.push(stock);
            }
        }
    }

    /**
     * 將單一股票資料儲存至 IndexedDB
     * @param {string} id - 股票代碼
     */
    async function saveStockToList(id) {
        const stock = userStockList.value.find(s => s.id === id);
        if (stock) {
            await putAllStocks(stock);
        }
    }

    return {
        userStockList,
        loadUserStockList,
        addStockToList,
        removeStockFromList,
        isStockInList,
        reorderStockList,
        loadStockToList,
        saveStockToList,
        updateStockListPrices,
    };
});

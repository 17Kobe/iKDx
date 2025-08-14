import { defineStore } from 'pinia';
import { ref } from 'vue';
import _ from 'lodash';
import dayjs from 'dayjs';
import { wrap } from 'comlink';
import {
    fetchUserStockPriceByBaseInfo,
    getUserStockData,
} from '@/services/user-stock-data-service';
import {
    getUserStockInfo,
    clearUserStockInfo,
    deleteUserStockInfo,
    putUserStockInfo,
} from '@/services/user-stock-info-service';
import { getAllStocksById, putAllStocks } from '@/services/all-stocks-service';

// 初始化 Workers (使用 module 模式支援 import)
const calcWeeklyWorker = new Worker(new URL('@/workers/calc-weekly-worker.js', import.meta.url), { type: 'module' });
const worker2 = new Worker(new URL('@/workers/worker2.js', import.meta.url), { type: 'module' });
const worker3 = new Worker(new URL('@/workers/worker3.js', import.meta.url), { type: 'module' });

const calcWeeklyAPI = wrap(calcWeeklyWorker);
const w2API = wrap(worker2);
const w3API = wrap(worker3);

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
     * 處理單支股票的 Worker 計算
     * @param {Object} stock - 股票資料
     * @param {Function} onProgress - 進度回調
     * @param {Object} progressTracker - 整體進度追蹤
     */
    async function processSingleStock(stock, onProgress, progressTracker) {
        const totalSteps = 3;
        let step = 0;

        const updateProgress = () => {
            // 單檔股票進度
            onProgress({
                symbol: stock.id,
                step,
                totalSteps,
                percent: (step / totalSteps) * 100,
                overallPercent: (progressTracker.completed / progressTracker.total) * 100,
            });
        };

        try {
            // --- Step 1: 週線計算與技術指標計算 ---
            const weeklyResult = await calcWeeklyAPI.processWeeklyCalculation(stock.dailyData || []);
            step++;
            progressTracker.completed++;
            updateProgress();

            // --- Step 2: 報酬率計算 ---
            const profit = await w2API.processProfit(weeklyResult);
            step++;
            progressTracker.completed++;
            updateProgress();

            // --- Step 3: 訊號位置計算 ---
            const signals = await w3API.processSignal(profit);
            step++;
            progressTracker.completed++;
            updateProgress();

            return {
                stockId: stock.id,
                signals,
                indicators: weeklyResult.indicators,
                weeklyData: weeklyResult.weeklyData,
                profit: profit.profit,
            };
        } catch (error) {
            console.error(`股票 ${stock.id} Worker 計算失敗:`, error);
            return null;
        }
    }

    /**
     * 批量處理多支股票的 Worker 計算
     * @param {Array} stockList - 股票清單
     * @param {Function} onProgress - 進度回調
     */
    async function processMultipleStocks(stockList, onProgress) {
        const progressTracker = {
            total: stockList.length * 3, // 每檔股票 3 個步驟
            completed: 0,
        };

        const promises = stockList.map(stock =>
            processSingleStock(stock, onProgress, progressTracker)
        );

        return Promise.all(promises);
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
                const info = {
                    id: stock.id,
                    name: stock.name,
                    industryCategory: Array.from(stock.industryCategory || []),
                    type: stock.type,
                    addedAt: stock.addedAt,
                };
                await putUserStockInfo(info);
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

    /**
     * 更新股票價格資料（支援單筆或批量）
     * @param {string|string[]|null} stockIds - 股票代碼，null 表示更新所有股票
     * @param {Object} options - 選項設定
     * @param {number} options.concurrency - 批量更新時的併發數（預設 3）
     * @param {boolean} options.updateIndexedDB - 是否同步更新 IndexedDB（預設 true）
     */
    /**
     * 更新股票價格資料（每支股票 fetch 完就立即更新與 worker 計算，不互等）
     * @param {string|string[]|null} stockIds - 股票代碼，null 表示全部
     * @param {Object} options - 設定
     */
    async function updateStockListPrices(stockIds = null, options = {}) {
        const { concurrency = 3, updateIndexedDB = true } = options;
        let targetStocks = [];
        let targetIndices = [];

        // 決定 targetStocks, targetIndices（同原本邏輯）
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

        // 控制同時併發數量
        let running = 0;
        let idx = 0;

        function next() {
            while (running < concurrency && idx < targetStocks.length) {
                const i = idx++;
                running++;
                (async () => {
                    try {
                        // 1. fetch 資料
                        const updatedData = await fetchUserStockPriceByBaseInfo(
                            targetStocks[i].id || targetStocks[i].code,
                            targetStocks[i]
                        );
                        if (updatedData) {
                            // 2. 立即更新 userStockList
                            const targetIndex = targetIndices[i];
                            const originalStock = userStockList.value[targetIndex];
                            userStockList.value[targetIndex] = {
                                ...originalStock,
                                fetchedAt: updatedData.fetchedAt,
                                lastPrice: updatedData.lastPrice,
                                lastDate: updatedData.lastDate,
                            };
                            // 3. 立即啟動 worker 計算
                            // 單支股票獨立 progressTracker
                            const progressTracker = {
                                total: 3,
                                completed: 0,
                            };
                            const workerResult = await processSingleStock(
                                userStockList.value[targetIndex],
                                ({ symbol, step, totalSteps, percent, overallPercent }) => {
                                    // 進度回報：可在這裡更新 UI 或 Pinia 狀態
                                    console.log(
                                        `股票 ${symbol} Worker 進度: ${percent.toFixed(1)}% (${step}/${totalSteps})`
                                    );
                                    console.log(`整體 Worker 進度: ${overallPercent.toFixed(1)}%`);
                                },
                                progressTracker
                            );
                            if (workerResult) {
                                userStockList.value[targetIndex] = {
                                    ...userStockList.value[targetIndex],
                                    weeklyKD: workerResult.indicators?.kd,
                                    rsi: workerResult.indicators?.rsi,
                                    ma: workerResult.indicators?.ma,
                                    profit: workerResult.profit,
                                    signals: workerResult.signals,
                                    calculatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                                };
                            }
                            // 4. 單筆更新 IndexedDB
                            if (typeof stockIds === 'string' && updateIndexedDB) {
                                const dataToSave = JSON.parse(JSON.stringify(updatedData));
                                putUserStockInfo(dataToSave).catch(error => {
                                    console.error(`儲存股票 ${updatedData.id} 到 IndexedDB 失敗:`, error);
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`股票 ${targetStocks[i].id} 更新失敗:`, error);
                    } finally {
                        running--;
                        next(); // 啟動下一個任務
                    }
                })();
            }
        }
        next();

        // 等待全部任務結束
        while (running > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 批量更新 IndexedDB
        if (typeof stockIds !== 'string' && updateIndexedDB) {
            await saveStockListToIndexedDB();
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

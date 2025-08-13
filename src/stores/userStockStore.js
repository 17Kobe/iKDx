import { defineStore } from 'pinia';
import { ref } from 'vue';
import _ from 'lodash';
import { fetchUserStockPriceByBaseInfo, getUserStockData } from '@/services/userStockDataService';
import {
    getUserStockInfo,
    clearUserStockInfo,
    deleteUserStockInfo,
    putUserStockInfo,
} from '@/services/userStockInfoService';
import { getAllStocksById, putAllStocks } from '@/services/allStocksService';

export const useUserStockStore = defineStore('userStock', () => {
    // 初始化一些測試資料
    const userStocks = ref([
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
     * 依據股票 id 取得 userStocks 中的股票物件與 index
     * @param {string} stockId - 股票代碼
     * @returns {{ stock: Object|null, index: number }}
     */
    function getStockStoreById(stockId) {
        const foundStockIndex = userStocks.value.findIndex(s => s.id === stockId);
        return {
            foundStock: foundStockIndex !== -1 ? userStocks.value[foundStockIndex] : null,
            foundStockIndex,
        };
    }

    /**
     * 從 IndexedDB 載入使用者股票清單並更新價格資料
     */
    async function loadUserStocks() {
        try {
            console.log('開始載入使用者股票清單...');
            const stocks = await getUserStockInfo();
            console.log('從 IndexedDB 載入的股票:', stocks);

            // 如果 IndexedDB 中有資料，使用載入的資料；否則保持現有的測試資料
            if (stocks && stocks.length > 0) {
                userStocks.value = stocks;

                // 批量更新所有股票的價格資料
                // await updateStockPrices();
            }
            return userStocks.value;
        } catch (error) {
            console.error('載入使用者股票清單失敗:', error);
            // 發生錯誤時保持現有資料，不要清空
            return userStocks.value;
        }
    }

    /**
     * 新增股票到使用者清單並抓取價格資料
     * @param {Object} stock - 股票資料 { id, name }
     */
    async function addStock(stock) {
        // Proxy(Object) {id: '2330', name: '台積電', industryCategory: Array(2), type: 'twse'}
        console.log('開始新增股票:', stock);

        // 檢查是否已存在
        const exists = userStocks.value.find(s => s.id === stock.id);
        if (exists) {
            console.log('股票已存在，取消新增');
            return { success: false, message: '股票已存在於清單中' };
        }

        // newStock，保留原本 stock 物件內容，但 industryCategory 要從 proxy(array) -> array，擴增 addedAt 欄位
        const newStock = {
            ...stock,
            industryCategory: Array.from(stock.industryCategory || []), // industryCategory 從 stock 取出，然後不支援響應
            addedAt: new Date().toISOString(),
        };

        console.log('新增股票到 Pinia store:', newStock);
        userStocks.value.push(newStock);

        // 儲存到 IndexedDB
        try {
            console.log('準備儲存股票到 user-stock-info:', newStock);
            await putUserStockInfo(newStock);
            console.log('股票已成功儲存到 user-stock-info');
            // 背景抓取該股票的價格資料
            updateStockPrices(stock.id).catch(error => {
                console.error(`背景更新股票 ${stock.id} 價格失敗:`, error);
            });
            return { success: true, message: '股票已新增至清單' };
        } catch (error) {
            console.error('儲存股票失敗:', error);
            // 如果 IndexedDB 失敗，從 Pinia 中移除
            userStocks.value = userStocks.value.filter(s => s.id !== stock.id);
            return { success: false, message: '新增失敗，請稍後再試' };
        }
    }

    /**
     * 從使用者清單移除股票
     * @param {string} stockId - 股票代碼
     */
    async function removeStock(stockId) {
        try {
            // 從 IndexedDB 移除
            await deleteUserStockInfo(stockId);
            // 從 Pinia store 移除
            userStocks.value = userStocks.value.filter(s => s.id !== stockId);
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
    function isStockAdded(stockId) {
        return userStocks.value.some(s => s.id === stockId);
    }

    /**
     * 重新排序股票列表（支援拖拽排序）
     * @param {Array} newOrder - 重新排序後的股票陣列
     */
    async function reorderStocks(newOrder) {
        userStocks.value = newOrder;
        await saveToIndexedDB();
    }

    /**
     * 將所有股票資料儲存到 IndexedDB
     */
    async function saveToIndexedDB() {
        try {
            await clearUserStockInfo();
            for (const stock of userStocks.value) {
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
    async function loadStock(id) {
        const stock = await getAllStocksById(id);
        if (stock) {
            const exists = userStocks.value.find(s => s.id === stock.id);
            if (!exists) {
                userStocks.value.push(stock);
            }
        }
    }

    /**
     * 將單一股票資料儲存至 IndexedDB
     * @param {string} id - 股票代碼
     */
    async function saveStock(id) {
        const stock = userStocks.value.find(s => s.id === id);
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
    async function updateStockPrices(stockIds = null, options = {}) {
        const { concurrency = 3, updateIndexedDB = true } = options;

        // 決定要更新的股票清單
        let targetStocks;
        let targetIndices;

        if (stockIds === null) {
            // 更新所有股票
            targetStocks = userStocks.value;
            targetIndices = userStocks.value.map((_, index) => index);
        } else if (typeof stockIds === 'string') {
            // 更新單一股票
            const { foundStock, foundStockIndex } = getStockStoreById(stockIds);
            if (!foundStock) {
                console.warn(`找不到股票 ${stockIds}`);
                return;
            }
            targetStocks = [foundStock];
            targetIndices = [foundStockIndex];
        } else if (Array.isArray(stockIds)) {
            // 更新指定股票清單
            targetStocks = [];
            targetIndices = [];
            stockIds.forEach(stockId => {
                const { foundStock, foundStockIndex } = getStockStoreById(stockId);
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

        try {
            // 批量抓取股票資料
            const updatedStockDataList = await Promise.all(
                targetStocks.map(async stock => {
                    try {
                        const updatedData = await fetchUserStockPriceByBaseInfo(
                            stock.id || stock.code,
                            stock
                        );
                        return updatedData;
                    } catch (error) {
                        console.error(`更新股票 ${stock.id} 價格失敗:`, error);
                        return null;
                    }
                })
            );

            // 更新 userStocks 中的價格資料
            updatedStockDataList.forEach((updatedData, index) => {
                if (updatedData) {
                    console.log('updatedData', updatedData);

                    const targetIndex = targetIndices[index];
                    const originalStock = userStocks.value[targetIndex];

                    // 更新 pinia 股票資料
                    userStocks.value[targetIndex] = {
                        ...originalStock,
                        fetchedAt: updatedData.fetchedAt,
                        lastPrice: updatedData.lastPrice,
                        lastDate: updatedData.lastDate,
                    };

                    // 如果是單筆更新，直接儲存到 IndexedDB
                    if (typeof stockIds === 'string' && updateIndexedDB) {
                        // 確保所有 Proxy Array 轉換為純陣列，避免 IndexedDB DataCloneError
                        // const dataToSave = {
                        //     ...updatedData,
                        //     industryCategory: Array.from(updatedData.industryCategory || []),
                        // };
                        // const dataToSave = _.cloneDeep(updatedData);
                        const dataToSave = JSON.parse(JSON.stringify(updatedData));
                        putUserStockInfo(dataToSave).catch(error => {
                            console.error(`儲存股票 ${updatedData.id} 到 IndexedDB 失敗:`, error);
                        });
                    }
                }
            });

            // 批量更新時才統一更新 IndexedDB
            if (typeof stockIds !== 'string' && updateIndexedDB) {
                await saveToIndexedDB();
            }

            console.log(`${targetStocks.length} 支股票價格更新完成`);
        } catch (error) {
            console.error('更新股票價格失敗:', error);
        }
    }

    return {
        userStocks,
        loadUserStocks,
        addStock,
        removeStock,
        isStockAdded,
        reorderStocks,
        loadStock,
        saveStock,
        updateStockPrices,
    };
});

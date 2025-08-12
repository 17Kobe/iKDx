import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    fetchUserStockPriceByBaseInfo,
    getUserStockData,
} from '@/services/userStockDataService';
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
                // await updateAllStockPrices();
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
            updateSingleStockPrice(stock.id).catch(error => {
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
     * 批量更新所有使用者股票的價格資料
     */
    async function updateAllStockPrices() {
        if (userStocks.value.length === 0) {
            console.log('無股票需要更新價格');
            return;
        }

        console.log(`開始批量更新 ${userStocks.value.length} 支股票價格...`);

        try {
            // 提取所有股票代碼
            const stockCodes = userStocks.value.map(stock => stock.id || stock.code);

            // 批量抓取股票資料（併發數設為 3，避免過多請求）
            const updatedStockDataList = await Promise.all(
                userStocks.value.map(async stock => {
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
                    // 保留原有資料，只更新價格相關欄位
                    const originalStock = userStocks.value[index];
                    userStocks.value[index] = {
                        ...originalStock,
                        price: updatedData.price,
                        change: updatedData.change,
                        changePercent: updatedData.changePercent,
                        weeklyKD: updatedData.weeklyKD,
                        rsi: updatedData.rsi,
                        lastUpdated: updatedData.lastUpdated,
                    };
                }
            });

            // 批量更新到 IndexedDB
            await saveToIndexedDB();

            console.log('所有股票價格更新完成');
        } catch (error) {
            console.error('批量更新股票價格失敗:', error);
        }
    }

    /**
     * 更新單一股票的價格資料
     * @param {string} stockId - 股票代碼
     */
    async function updateSingleStockPrice(stockId) {
        const { foundStock, foundStockIndex } = getStockStoreById(stockId);
        if (!foundStock) {
            console.warn(`找不到股票 ${stockId}`);
            return;
        }

        console.log(`開始更新股票 ${stockId} 價格...`);

        try {
            const updatedData = await fetchUserStockPriceByBaseInfo(stockId, foundStock);

            if (updatedData) {
                // 更新股票資料
                userStocks.value[foundStockIndex] = {
                    ...foundStock,
                    latestPrice: updatedData.price,
                    change: updatedData.change,
                    changePercent: updatedData.changePercent,
                    weeklyKD: updatedData.weeklyKD,
                    rsi: updatedData.rsi,
                    lastUpdated: updatedData.lastUpdated,
                };

                // 取得 user-stock-data 的最後一筆 daily 資料
                let lastDate = null;
                let lastValue = null;
                try {
                    const stockData = await getUserStockData(stockId);
                    if (stockData && Array.isArray(stockData.daily) && stockData.daily.length > 0) {
                        const last = stockData.daily[stockData.daily.length - 1];
                        // 假設格式為 [date, value, ...] 或 {date, value}
                        if (Array.isArray(last)) {
                            lastDate = last[0];
                            lastValue = last[1];
                        } else if (typeof last === 'object') {
                            lastDate = last.date || last.Date || last.日期 || null;
                            lastValue = last.value || last.close || last.price || null;
                        }
                    }
                } catch (e) {
                    console.warn('取得 user-stock-data 最後一筆失敗', e);
                }

                // 只存純資料欄位，並加上 lastDate, lastValue
                const info = {
                    id: stock.id,
                    name: stock.name,
                    industryCategory: Array.from(stock.industryCategory || []),
                    type: stock.type,
                    addedAt: stock.addedAt,
                    lastDate,
                    lastValue,
                };
                console.log(`[user-stock-info] set`, info);
                await putUserStockInfo(info);
                console.log(`股票 ${stockId} 價格更新完成`);
            }
        } catch (error) {
            console.error(`更新股票 ${stockId} 價格失敗:`, error);
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
        updateAllStockPrices,
        updateSingleStockPrice,
    };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getAllFromStore, putToStore, clearStore, getStock, setStock } from '@/lib/idb';

export const useStockStore = defineStore('stock', () => {
    const userStocks = ref([]);

    /**
     * 從 IndexedDB 載入使用者股票清單
     */
    async function loadUserStocks() {
        try {
            console.log('開始載入使用者股票清單...');
            const stocks = await getAllFromStore('user-stocks');
            console.log('從 IndexedDB 載入的股票:', stocks);
            userStocks.value = stocks;
            return stocks;
        } catch (error) {
            console.error('載入使用者股票清單失敗:', error);
            userStocks.value = [];
            return [];
        }
    }

    /**
     * 新增股票到使用者清單
     * @param {Object} stock - 股票資料 { id, name }
     */
    async function addStock(stock) {
        console.log('開始新增股票:', stock);

        // 檢查是否已存在
        const exists = userStocks.value.find(s => s.id === stock.id);
        if (exists) {
            console.log('股票已存在，取消新增');
            return { success: false, message: '股票已存在於清單中' };
        }

        // 添加到 Pinia store
        const newStock = {
            ...stock,
            addedAt: new Date().toISOString(),
        };
        console.log('新增股票到 Pinia store:', newStock);
        userStocks.value.push(newStock);

        // 儲存到 IndexedDB
        try {
            console.log('準備儲存股票到 IndexedDB:', newStock);
            await putToStore('user-stocks', newStock);
            console.log('股票已成功儲存到 IndexedDB');
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
            const db = await dbPromise;
            // 檢查 object store 是否存在
            if (db.objectStoreNames.contains('user-stocks')) {
                await db.delete('user-stocks', stockId);
            }
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
            await clearStore('user-stocks');
            for (const stock of userStocks.value) {
                await putToStore('user-stocks', stock);
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
        const stock = await getStock(id);
        if (stock) {
            const exists = userStocks.value.find(s => s.id === stock.id);
            if (!exists) {
                userStocks.value.push(stock);
            }
        }
    }

    /**
     * 將單一股票資料儲存至 IndexedDB
     */
    async function saveStock() {
        const stock = userStocks.value.find(s => s.id === id);
        if (stock) {
            await setStock(stock);
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
    };
});

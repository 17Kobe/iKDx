/**
 * user-stock-info 資料表專用 service
 * 集中所有 user-stock-info CRUD 操作
 */
import {
    getAllFromStore,
    putToStoreSimple,
    deleteFromStore,
    getFromStore,
    clearStore,
} from '@/lib/idb';

/**
 * 取得所有 user-stock-info 資料
 * @returns {Promise<Array>} 股票清單
 */
export async function getAllUserStockInfo() {
    return await getAllFromStore('user-stock-info');
}

/**
 * 新增或更新單一 user-stock-info
 * @param {Object} info
 */
export async function putUserStockInfo(info) {
    return await putToStoreSimple('user-stock-info', info);
}

/**
 * 清空所有 user-stock-info
 */
export async function clearAllUserStockInfo() {
    return await clearStore('user-stock-info');
}

/**
 * 刪除單一 user-stock-info
 * @param {string} stockId
 */
export async function deleteUserStockInfo(stockId) {
    return await deleteFromStore('user-stock-info', stockId);
}

/**
 * user-stock-info 資料表專用 service
 * 集中所有 user-stock-info CRUD 操作
 */
import { getAllFromStore, getAllFromStoreOrdered, putToStore, putListToStore, deleteFromStore, clearStore } from '@/lib/idb';

/**
 * 取得所有 user-stock-info 資料（依 order 排序）
 * @returns {Promise<Array>} 股票清單
 */
export async function getUserStockInfo() {
    return await getAllFromStoreOrdered('user-stock-info');
}

/**
 * 新增或更新單一 user-stock-info
 * @param {Object} info
 */
export async function putUserStockInfo(info) {
    return await putToStore('user-stock-info', info);
}

export async function putUserStockInfoList(stockList) {
    // 使用 idb 批次寫入工具
    return await putListToStore('user-stock-info', stockList);
}

/**
 * 刪除單一 user-stock-info
 * @param {string} stockId
 */
export async function deleteUserStockInfo(stockId) {
    return await deleteFromStore('user-stock-info', stockId);
}

/**
 * 清空所有 user-stock-info
 */
export async function clearUserStockInfo() {
    return await clearStore('user-stock-info');
}

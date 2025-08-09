import { openDB } from 'idb';
import axios from './axios';

let db = null;

// 初始化資料庫
// 取得全域唯一 DB 實例
export async function initDB() {
    if (!db) {
        db = await openDB('ikdx-db', 1, {
            upgrade(db, oldVersion, newVersion) {
                // 第一版包含 all-stocks、user-stock-info、user-stock-data
                if (oldVersion < 1) {
                    db.createObjectStore('all-stocks', { keyPath: 'id' });
                    db.createObjectStore('user-stock-info', { keyPath: 'id' });
                    db.createObjectStore('user-stock-data', { keyPath: 'id' });
                }
            },
        });
    }
    return db;
}

// 也可以導出 getDB()，就直接回傳 dbPromise
export function getDB() {
    return initDB();
}

// 確保指定的 Object Store 存在
export async function ensureStoreExists(storeName) {
    const localDb = await getDB();

    if (!localDb.objectStoreNames.contains(storeName)) {
        console.warn(`${storeName} store 不存在，開始建立`);
        const version = localDb.version + 1;
        localDb.close();
        const newDb = await openDB('ikdx-db', version, {
            upgrade(upgradeDb) {
                upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
            },
        });
        db = newDb;
        console.log(`${storeName} store 已建立`);
    }
}

// 取得所有資料
export async function getAllFromStore(storeName) {
    const localDb = await getDB();
    return localDb.getAll(storeName);
}

// 新增或更新資料
export async function putToStore(storeName, data) {
    const localDb = await getDB();
    const tx = localDb.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(data);
    await tx.done;
}

// 清除資料
export async function clearStore(storeName) {
    const localDb = await getDB();
    const tx = localDb.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
}

// 取得 all-stocks 中的股票資料
export async function getStocksFromDB() {
    console.log('開始執行 getStocksFromDB');

    const localDb = await getDB();

    // 確認 all-stocks store 是否存在
    if (!localDb.objectStoreNames.contains('all-stocks')) {
        console.warn('all-stocks store 不存在，返回空陣列');
        return [];
    }

    const count = await localDb.count('all-stocks');
    console.log('all-stocks store 中的資料數量:', count);
    if (count > 0) {
        const stocks = await getAllFromStore('all-stocks');
        console.log('從 IndexedDB 獲取的股票資料:', stocks);
        return stocks;
    } else {
        console.log('all-stocks store 無資料，開始從 stock_list.json 獲取');
        const res = await axios.get('stocks/stock_list.json');
        const stocks = res.data;
        for (const stock of stocks) {
            await putToStore('all-stocks', stock);
        }
        console.log('股票資料已快取到 IndexedDB:', stocks);
        return stocks;
    }
}

// 通用 CRUD
export async function getFromStore(store, id) {
    const db = await getDB();
    return db.get(store, id);
}

export async function putToStoreSimple(store, data) {
    const db = await getDB();
    return db.put(store, data);
}

export async function deleteFromStore(store, id) {
    const db = await getDB();
    return db.delete(store, id);
}

// 清除整個 IndexedDB 所有資料
export async function clearAllDB() {
    const db = await getDB();
    if (db) {
        db.close();
    }
    await indexedDB.deleteDatabase('ikdx-db');
}

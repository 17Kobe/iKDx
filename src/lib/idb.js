import { openDB } from 'idb';
import axios from './axios';

let db;

// 初始化資料庫
export async function initDB() {
    db = await openDB('ikdx-db', 1, {
        upgrade(db, oldVersion, newVersion) {
            // 第一版包含 all-stocks 和 user-stocks 資料表
            if (oldVersion < 1) {
                db.createObjectStore('all-stocks', { keyPath: 'id' });
                db.createObjectStore('user-stocks', { keyPath: 'id' });
            }
        },
    });
}

// 確保指定的 Object Store 存在
export async function ensureStoreExists(storeName) {
    if (!db) {
        throw new Error('Database is not initialized. Call initDB() first.');
    }

    if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`${storeName} store 不存在，開始建立`);
        const version = db.version + 1;
        db.close();
        db = await openDB('ikdx-db', version, {
            upgrade(upgradeDb) {
                upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
            },
        });
        console.log(`${storeName} store 已建立`);
    }
}

// 取得所有資料
export async function getAllFromStore(storeName) {
    if (!db) {
        throw new Error('Database is not initialized. Call initDB() first.');
    }
    return db.getAll(storeName);
}

// 新增或更新資料
export async function putToStore(storeName, data) {
    if (!db) {
        throw new Error('Database is not initialized. Call initDB() first.');
    }
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(data);
    await tx.done;
}

// 清除資料
export async function clearStore(storeName) {
    if (!db) {
        throw new Error('Database is not initialized. Call initDB() first.');
    }
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
}

// 取得 all-stocks 中的股票資料
export async function getStocksFromDB() {
    console.log('開始執行 getStocksFromDB');

    if (!db) {
        throw new Error('Database is not initialized. Call initDB() first.');
    }

    // 確認 all-stocks store 是否存在
    if (!db.objectStoreNames.contains('all-stocks')) {
        console.warn('all-stocks store 不存在，返回空陣列');
        return [];
    }

    const count = await db.count('all-stocks');
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

// all-stocks 操作
export async function getStock(id) {
    return db.get('all-stocks', id);
}

export async function setStock(stock) {
    return db.put('all-stocks', stock);
}

export async function deleteStock(id) {
    return db.delete('all-stocks', id);
}

// user-stocks 操作
export async function getUserStock(id) {
    return db.get('user-stocks', id);
}

export async function setUserStock(stock) {
    return db.put('user-stocks', stock);
}

export async function deleteUserStock(id) {
    return db.delete('user-stocks', id);
}

// 清除整個 IndexedDB 所有資料
export async function clearAllDB() {
    if (db) {
        db.close();
    }
    await indexedDB.deleteDatabase('ikdx-db');
}

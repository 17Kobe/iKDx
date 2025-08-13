import { openDB } from 'idb';

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

// 取得所有資料
export async function getAllFromStore(storeName) {
    const localDb = await getDB();
    return localDb.getAll(storeName);
}

// 清除資料
export async function clearStore(storeName) {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
}
// 通用 CRUD
export async function getFromStore(storeName, id) {
    const db = await getDB();
    return db.get(storeName, id);
}

export async function putToStore(storeName, data) {
    const db = await getDB();
    return db.put(storeName, data);
}

export async function deleteFromStore(storeName, id) {
    const db = await getDB();
    return db.delete(storeName, id);
}

// 清除整個 IndexedDB 所有資料
export async function clearAllDB() {
    const db = await getDB();
    if (db) {
        db.close();
    }
    await indexedDB.deleteDatabase('ikdx-db');
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

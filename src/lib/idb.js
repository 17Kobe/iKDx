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
                    // 建立 user-stock-info 並加 orderIndex
                    const store = db.createObjectStore('user-stock-info', { keyPath: 'id' });
                    store.createIndex('orderIndex', 'order');

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

// 取得所有資料並依 order 排序（針對有 orderIndex 的 store）
export async function getAllFromStoreOrdered(storeName) {
    const localDb = await getDB();
    const tx = localDb.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    // 檢查是否有 orderIndex
    if (store.indexNames.contains('orderIndex')) {
        const index = store.index('orderIndex');
        const result = await index.getAll();
        await tx.done;
        return result;
    } else {
        // 沒有 orderIndex，使用一般 getAll
        const result = await store.getAll();
        await tx.done;
        return result;
    }
}

// 清除資料
export async function clearStore(storeName) {
    console.log("storeName", storeName);
    
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

// 批次寫入多筆資料
export async function putListToStore(storeName, dataList) {
    console.log("123");
    
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    console.log("456");
    console.log("dataList", dataList);
    
    await store.clear();
    for (const data of dataList) {
        console.log("data", data);
        
        store.put(data);
    }
    await tx.done;
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

import { openDB } from 'idb';
import axios from './axios';

// 初始化 IndexedDB，建立通用函式
export const dbPromise = openDB('ikdx-db', 2, {
    upgrade(db, oldVersion, newVersion) {
        console.log(`升級資料庫從版本 ${oldVersion} 到 ${newVersion}`);

        // 建立 all-stocks object store（如果不存在）
        if (!db.objectStoreNames.contains('all-stocks')) {
            db.createObjectStore('all-stocks', { keyPath: 'id' });
            console.log('建立 all-stocks object store');
        }

        // 建立 user-stocks object store（如果不存在）
        if (!db.objectStoreNames.contains('user-stocks')) {
            db.createObjectStore('user-stocks', { keyPath: 'id' });
            console.log('建立 user-stocks object store');
        }
    },
    blocked() {
        console.error('資料庫升級被阻擋，請關閉所有其他使用此應用程式的頁面，然後重新載入此頁面。');
    },
    blocking() {
        console.warn('新版本等待中，建議關閉其他頁面');
    },
});

export async function getAllFromStore(storeName) {
    const db = await dbPromise;
    return db.getAll(storeName);
}

export async function putToStore(storeName, data) {
    const db = await dbPromise;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(data);
    await tx.done;
}

export async function clearStore(storeName) {
    const db = await dbPromise;
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
}

export async function getStocksFromDB() {
    console.log('開始執行 getStocksFromDB');
    const db = await dbPromise;

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
        console.log('all-stocks store 無資料，開始從 stocks.json 獲取');
        const res = await axios.get('stocks/stocks.json');
        const stocks = res.data;
        for (const stock of stocks) {
            await putToStore('all-stocks', stock);
        }
        console.log('股票資料已快取到 IndexedDB:', stocks);
        return stocks;
    }
}

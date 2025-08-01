import { openDB } from 'idb';

// 初始化 IndexedDB，建立 stocks store
const dbPromise = openDB('stock-db', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('stocks')) {
            db.createObjectStore('stocks', { keyPath: 'id' });
        }
    },
});

/**
 * 從 IndexedDB 取得所有股票，若無則 fetch 並快取
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getStocksFromDB() {
    const db = await dbPromise;
    const count = await db.count('stocks');
    if (count > 0) {
        return await db.getAll('stocks');
    } else {
        // 使用 base 路徑，支援 GitHub Pages 與 Cloudflare Pages
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(base + 'stocks/stocks.json');
        const stocks = await res.json();
        const tx = db.transaction('stocks', 'readwrite');
        const store = tx.objectStore('stocks');
        for (const stock of stocks) {
            await store.put(stock);
        }
        await tx.done;
        return stocks;
    }
}

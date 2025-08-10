import { getAllFromStore, putToStore, clearStore } from '../src/lib/idb';

// 這裡用 jest.mock 模擬 idb 套件，避免真的操作 IndexedDB
jest.mock('idb', () => ({
    openDB: jest.fn(() => ({
        getAll: jest.fn(() => [{ id: 'AAPL', price: 100 }, { id: 'TSLA', price: 200 }]),
        transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
                put: jest.fn(),
                clear: jest.fn(),
            })),
            done: Promise.resolve(),
        })),
        close: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        objectStoreNames: { contains: jest.fn(() => true) },
        version: 1,
    })),
}));

describe('idb CRUD', () => {
    it('getAllFromStore 應取得所有資料', async () => {
        const result = await getAllFromStore('user-stock-data');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0].id).toBe('AAPL');
    });

    it('putToStore 應可執行不報錯', async () => {
        await expect(putToStore('user-stock-data', { id: 'AAPL', price: 123 })).resolves.toBeUndefined();
    });

    it('clearStore 應可執行不報錯', async () => {
        await expect(clearStore('user-stock-data')).resolves.toBeUndefined();
    });
});

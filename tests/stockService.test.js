const { getStocksFromDB } = require('../src/lib/idb');

// Mock idb and axios
jest.mock('idb', () => ({
    openDB: jest.fn(() => ({
        count: jest.fn(() => Promise.resolve(1)),
        getAll: jest.fn(() => Promise.resolve([{ id: '2330', name: '台積電' }])),
        transaction: jest.fn(),
        objectStore: jest.fn(),
    })),
}));
jest.mock('../src/lib/axios', () => ({
    default: {
        get: jest.fn(() => Promise.resolve({ data: [{ id: '2330', name: '台積電' }] })),
    },
}));
jest.mock('../src/lib/idb', () => {
    let dbMock;

    return {
        initDB: jest.fn(() => {
            dbMock = {
                count: jest.fn(() => Promise.resolve(1)),
                getAll: jest.fn(() => Promise.resolve([{ id: '2330', name: '台積電' }])),
                transaction: jest.fn(),
                objectStoreNames: { contains: jest.fn(() => true) },
            };
        }),
        getStocksFromDB: jest.fn(() => {
            if (!dbMock) {
                throw new Error('Database is not initialized. Call initDB() first.');
            }
            return dbMock.getAll('all-stocks');
        }),
    };
});

beforeAll(async () => {
    await require('../src/lib/idb').initDB();
});

describe('getStocksFromDB', () => {
    it('should return stocks from IndexedDB if exists', async () => {
        const stocks = await getStocksFromDB();
        expect(Array.isArray(stocks)).toBe(true);
        expect(stocks[0]).toHaveProperty('id', '2330');
        expect(stocks[0]).toHaveProperty('name', '台積電');
    });
});

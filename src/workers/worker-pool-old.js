/**
 * 原生 Worker Pool 管理器
 * 專為 iOS Chrome 相容性設計，不使用 Comlink
 * 支援 JS 模組引用和併發數量控制
 */
export class WorkerPool {
    constructor(workerFactory, maxWorkers = navigator.hardwareConcurrency || 4) {
        this.workerFactory = workerFactory; // Worker 工廠函數
        this.maxWorkers = Math.min(maxWorkers, 8); // iOS 限制最多8個
        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
        this.activeJobs = 0;
        this.statusCallbacks = new Set();
        this.messageId = 0;
        this.pendingMessages = new Map(); // 追蹤待處理的訊息

        console.log(`🔧 初始化原生 Worker Pool: ${this.maxWorkers} workers`);
        this.initializeWorkers();
    }

    /**
     * 初始化 Workers
     */
    async initializeWorkers() {
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                // 使用工廠函數創建 Worker
                const worker = this.workerFactory();
                
                // 設定 Worker 訊息處理
                worker.onmessage = (event) => this.handleWorkerMessage(i, event);
                worker.onerror = (error) => this.handleWorkerError(i, error);
                
                this.workers.push({
                    worker,
                    busy: false,
                    index: i,
                    lastUsed: Date.now(),
                });
                this.availableWorkers.push(i);
                
                console.log(`✅ Worker ${i} 初始化成功`);
            } catch (error) {
                console.error(`❌ Worker ${i} 初始化失敗:`, error);
            }
        }
        
        console.log(`🎯 Worker Pool 初始化完成: ${this.workers.length}/${this.maxWorkers}`);
        this.notifyStatusChange();
    }

    /**
     * 處理 Worker 訊息
     */
    handleWorkerMessage(workerIndex, event) {
        const { messageId, result, error } = event.data;
        
        if (this.pendingMessages.has(messageId)) {
            const { resolve, reject } = this.pendingMessages.get(messageId);
            this.pendingMessages.delete(messageId);
            
            if (error) {
                reject(new Error(error));
            } else {
                resolve(result);
            }
            
            // 釋放 Worker
            this.releaseWorker(workerIndex);
        }
    }

    /**
     * 處理 Worker 錯誤
     */
    handleWorkerError(workerIndex, error) {
        console.error(`❌ Worker ${workerIndex} 發生錯誤:`, error);
        
        // 釋放 Worker
        this.releaseWorker(workerIndex);
        
        // 重新創建 Worker (iOS 穩定性考量)
        this.recreateWorker(workerIndex);
    }

    /**
     * 重新創建 Worker (iOS 穩定性考量)
     */
    async recreateWorker(workerIndex) {
        try {
            const oldWorker = this.workers[workerIndex].worker;
            oldWorker.terminate();
            
            // 創建新的 Worker
            const newWorker = this.workerFactory();
            newWorker.onmessage = (event) => this.handleWorkerMessage(workerIndex, event);
            newWorker.onerror = (error) => this.handleWorkerError(workerIndex, error);
            
            this.workers[workerIndex] = {
                worker: newWorker,
                busy: false,
                index: workerIndex,
                lastUsed: Date.now(),
            };
            
            console.log(`🔄 Worker ${workerIndex} 重新創建成功`);
        } catch (error) {
            console.error(`❌ Worker ${workerIndex} 重新創建失敗:`, error);
        }
    }

    /**
     * 執行任務
     */
    async executeTask(method, params = {}, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const task = {
                method,
                params,
                resolve,
                reject,
                timeout,
                createdAt: Date.now(),
            };

            if (this.availableWorkers.length > 0) {
                this.processTask(task);
            } else {
                this.queue.push(task);
                console.log(`⏳ 任務加入佇列: ${this.queue.length} pending`);
            }
        });
    }

    /**
     * 處理任務
     */
    async processTask(task) {
        const workerIndex = this.availableWorkers.shift();
        const workerObj = this.workers[workerIndex];
        
        if (!workerObj || workerObj.busy) {
            // Worker 不可用，重新加入佇列
            this.queue.unshift(task);
            return;
        }

        workerObj.busy = true;
        workerObj.lastUsed = Date.now();
        this.activeJobs++;
        this.notifyStatusChange();

        // 生成唯一訊息 ID
        const messageId = ++this.messageId;
        
        // 設定超時處理
        const timeoutId = setTimeout(() => {
            if (this.pendingMessages.has(messageId)) {
                this.pendingMessages.delete(messageId);
                task.reject(new Error(`Worker 任務超時 (${task.timeout}ms)`));
                this.releaseWorker(workerIndex);
            }
        }, task.timeout);

        // 儲存 Promise resolver
        this.pendingMessages.set(messageId, {
            resolve: (result) => {
                clearTimeout(timeoutId);
                task.resolve(result);
            },
            reject: (error) => {
                clearTimeout(timeoutId);
                task.reject(error);
            },
        });

        // 發送任務到 Worker
        try {
            workerObj.worker.postMessage({
                messageId,
                method: task.method,
                params: task.params,
            });
        } catch (error) {
            this.pendingMessages.delete(messageId);
            clearTimeout(timeoutId);
            task.reject(error);
            this.releaseWorker(workerIndex);
        }
    }

    /**
     * 釋放 Worker
     */
    releaseWorker(workerIndex) {
        const workerObj = this.workers[workerIndex];
        if (workerObj && workerObj.busy) {
            workerObj.busy = false;
            this.availableWorkers.push(workerIndex);
            this.activeJobs--;
            this.notifyStatusChange();

            // 處理佇列中的下一個任務
            if (this.queue.length > 0) {
                const nextTask = this.queue.shift();
                setTimeout(() => this.processTask(nextTask), 0);
            }
        }
    }

    /**
     * 訂閱狀態變更通知
     */
    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
        callback(this.getStatus()); // 立即回傳目前狀態
        return () => this.statusCallbacks.delete(callback); // 返回取消訂閱函數
    }

    /**
     * 通知狀態變更
     */
    notifyStatusChange() {
        const status = this.getStatus();
        for (const callback of this.statusCallbacks) {
            try {
                callback(status);
            } catch (error) {
                console.error('狀態回調執行錯誤:', error);
            }
        }
    }

    /**
     * 取得目前 Pool 狀態
     */
    getStatus() {
        return {
            totalWorkers: this.workers.length,
            availableWorkers: this.availableWorkers.length,
            busyWorkers: this.workers.filter(w => w.busy).length,
            queuedTasks: this.queue.length,
            activeJobs: this.activeJobs,
            pendingMessages: this.pendingMessages.size,
        };
    }

    /**
     * 終止所有 Workers
     */
    async terminate() {
        console.log('🔴 終止 Worker Pool...');
        
        // 清除所有待處理的訊息
        for (const [messageId, { reject }] of this.pendingMessages) {
            reject(new Error('Worker Pool 正在終止'));
        }
        this.pendingMessages.clear();
        
        // 終止所有 Workers
        for (const workerObj of this.workers) {
            try {
                workerObj.worker.terminate();
            } catch (error) {
                console.error('終止 Worker 時發生錯誤:', error);
            }
        }
        
        // 清空所有狀態
        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
        this.activeJobs = 0;
        this.statusCallbacks.clear();
        
        console.log('✅ Worker Pool 已終止');
    }
}

/**
 * Worker Pool 管理器 - 全局單例
 */
class WorkerPoolManager {
    constructor() {
        this.pools = new Map();
        this.globalStatusCallbacks = new Set();
    }

    /**
     * 取得或創建 Worker Pool
     */
    getPool(name, workerFactory, maxWorkers) {
        if (!this.pools.has(name)) {
            const pool = new WorkerPool(workerFactory, maxWorkers);
            this.pools.set(name, pool);
            
            // 監聽 Pool 狀態變更
            pool.onStatusChange((status) => {
                this.notifyGlobalStatusChange(name, status);
            });
            
            console.log(`📦 創建新的 Worker Pool: ${name}`);
        }
        return this.pools.get(name);
    }

    /**
     * 監聽所有 Pool 的狀態變更
     */
    onAllStatusChange(callback) {
        this.globalStatusCallbacks.add(callback);
        
        // 立即回傳目前所有 Pool 的狀態
        const allStatus = {};
        for (const [name, pool] of this.pools) {
            allStatus[name] = pool.getStatus();
        }
        callback(null, null, allStatus);
        
        return () => this.globalStatusCallbacks.delete(callback);
    }

    /**
     * 通知全局狀態變更
     */
    notifyGlobalStatusChange(poolName, status) {
        const allStatus = {};
        for (const [name, pool] of this.pools) {
            allStatus[name] = pool.getStatus();
        }

        for (const callback of this.globalStatusCallbacks) {
            try {
                callback(poolName, status, allStatus);
            } catch (error) {
                console.error('全局狀態回調執行錯誤:', error);
            }
        }
    }

    /**
     * 終止所有 Worker Pools
     */
    async terminateAll() {
        const promises = [];
        for (const [name, pool] of this.pools) {
            console.log(`🔴 終止 Worker Pool: ${name}`);
            promises.push(pool.terminate());
        }
        
        await Promise.all(promises);
        this.pools.clear();
        this.globalStatusCallbacks.clear();
        
        console.log('✅ 所有 Worker Pools 已終止');
    }

    /**
     * 取得所有 Pool 的狀態摘要
     */
    getAllStatus() {
        const status = {};
        for (const [name, pool] of this.pools) {
            status[name] = pool.getStatus();
        }
        return status;
    }
}

// 匯出全局單例
export const workerPoolManager = new WorkerPoolManager();
            availableWorkers: this.availableWorkers.length,
            busyWorkers: this.maxWorkers - this.availableWorkers.length,
            queuedTasks: this.queue.length,
            activeJobs: this.activeJobs,
            utilization: ((this.maxWorkers - this.availableWorkers.length) / this.maxWorkers * 100).toFixed(1),
        };
    }

    /**
     * 通知狀態變更
     */
    notifyStatusChange() {
        const status = this.getStatus();
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Worker Pool 狀態回調錯誤:', error);
            }
        });
    }

    /**
     * 執行 Worker 任務
     * @param {string} method - 要呼叫的方法名稱
     * @param {...any} args - 方法參數
     * @returns {Promise} Worker 執行結果
     */
    async execute(method, ...args) {
        return new Promise((resolve, reject) => {
            this.queue.push({ method, args, resolve, reject });
            this.notifyStatusChange(); // 通知狀態變更
            this.processQueue();
        });
    }

    /**
     * 處理任務佇列
     */
    processQueue() {
        if (this.queue.length === 0 || this.availableWorkers.length === 0) {
            return;
        }

        const workerIndex = this.availableWorkers.shift();
        const workerInfo = this.workers[workerIndex];
        const { method, args, resolve, reject } = this.queue.shift();

        workerInfo.busy = true;
        this.activeJobs++;
        this.notifyStatusChange(); // 通知狀態變更

        workerInfo.api[method](...args)
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            })
            .finally(() => {
                workerInfo.busy = false;
                this.availableWorkers.push(workerIndex);
                this.activeJobs--;
                this.notifyStatusChange(); // 通知狀態變更
                this.processQueue(); // 繼續處理下一個任務
            });
    }

    /**
     * 等待所有任務完成
     */
    async waitForAll() {
        while (this.activeJobs > 0 || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    /**
     * 銷毀所有 Worker
     */
    destroy() {
        this.statusCallbacks.clear(); // 清除所有回調
        this.workers.forEach(({ worker }) => {
            worker.terminate();
        });
        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
        this.activeJobs = 0;
    }
}

/**
 * 全域 Worker Pool 管理器
 */
class GlobalWorkerPoolManager {
    constructor() {
        this.pools = new Map();
    }

    /**
     * 取得或建立 Worker Pool
     * @param {string} name - Pool 名稱
     * @param {string} workerUrl - Worker 檔案路徑
     * @param {number} maxWorkers - 最大 Worker 數量
     */
    getPool(name, workerUrl, maxWorkers) {
        if (!this.pools.has(name)) {
            this.pools.set(name, new WorkerPool(workerUrl, maxWorkers));
        }
        return this.pools.get(name);
    }

    /**
     * 取得所有 Pool 的狀態
     * @returns {Object} 所有 Pool 的狀態資訊
     */
    getAllStatus() {
        const status = {};
        this.pools.forEach((pool, name) => {
            status[name] = pool.getStatus();
        });
        return status;
    }

    /**
     * 訂閱所有 Pool 的狀態變更
     * @param {Function} callback - 狀態變更回調函式
     */
    onAllStatusChange(callback) {
        this.pools.forEach((pool, name) => {
            pool.onStatusChange((poolStatus) => {
                callback(name, poolStatus, this.getAllStatus());
            });
        });
    }

    /**
     * 取得特定 Pool 的狀態
     * @param {string} name - Pool 名稱
     * @returns {Object|null} Pool 狀態或 null
     */
    getPoolStatus(name) {
        const pool = this.pools.get(name);
        return pool ? pool.getStatus() : null;
    }

    /**
     * 銷毀指定 Pool
     */
    destroyPool(name) {
        if (this.pools.has(name)) {
            this.pools.get(name).destroy();
            this.pools.delete(name);
        }
    }

    /**
     * 銷毀所有 Pool
     */
    destroyAll() {
        this.pools.forEach(pool => pool.destroy());
        this.pools.clear();
    }
}

// 全域實例
export const workerPoolManager = new GlobalWorkerPoolManager();

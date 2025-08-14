import { wrap } from 'comlink';

/**
 * Worker Pool 管理器
 * 自動管理 Worker 併發數量，避免超過 CPU 核心數
 */
export class WorkerPool {
    constructor(workerUrl, maxWorkers = navigator.hardwareConcurrency || 4) {
        this.workerUrl = workerUrl;
        this.maxWorkers = maxWorkers;
        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
        this.activeJobs = 0;
        this.statusCallbacks = new Set(); // 狀態變更回調

        // 初始化 Worker Pool
        for (let i = 0; i < maxWorkers; i++) {
            const worker = new Worker(workerUrl, { type: 'module' });
            const workerAPI = wrap(worker);
            this.workers.push({ worker, api: workerAPI, busy: false });
            this.availableWorkers.push(i);
        }
    }

    /**
     * 訂閱狀態變更通知
     * @param {Function} callback - 狀態變更回調函式
     */
    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
        // 立即回傳目前狀態
        callback(this.getStatus());
    }

    /**
     * 取消訂閱狀態變更通知
     * @param {Function} callback - 要移除的回調函式
     */
    offStatusChange(callback) {
        this.statusCallbacks.delete(callback);
    }

    /**
     * 取得目前 Pool 狀態
     * @returns {Object} 狀態資訊
     */
    getStatus() {
        return {
            totalWorkers: this.maxWorkers,
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

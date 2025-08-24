<template>
    <div class="worker-monitor">
        <div class="monitor-header">
            <h3>Worker Pool 監控</h3>
            <span class="total-cpu">CPU 核心數: {{ cpuCores }}</span>
        </div>

        <div class="pool-stats">
            <div
                v-for="(status, poolName) in poolStatus"
                :key="poolName"
                class="pool-card"
                :class="{ 'pool-busy': status.busyWorkers > 0 }"
            >
                <div class="pool-name">{{ poolName }}</div>
                <div class="pool-info">
                    <div class="stat-item">
                        <span class="label">可用:</span>
                        <span class="value"
                            >{{ status.availableWorkers }}/{{ status.totalWorkers }}</span
                        >
                    </div>
                    <div class="stat-item">
                        <span class="label">使用中:</span>
                        <span class="value busy">{{ status.busyWorkers }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">排隊:</span>
                        <span class="value queue">{{ status.queuedTasks }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">使用率:</span>
                        <span class="value utilization">{{ status.utilization }}%</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: status.utilization + '%' }"></div>
                </div>
            </div>
        </div>

        <div class="overall-stats">
            <div class="stat-box">
                <div class="stat-value">{{ totalBusyWorkers }}</div>
                <div class="stat-label">總使用中</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ totalQueuedTasks }}</div>
                <div class="stat-label">總排隊</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ overallUtilization }}%</div>
                <div class="stat-label">整體使用率</div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue';
    import { workerPoolManager } from '@/workers/worker-pool';

    const poolStatus = ref({});
    const cpuCores = ref(navigator.hardwareConcurrency || 4);

    // 計算總統計
    const totalBusyWorkers = computed(() => {
        return Object.values(poolStatus.value).reduce((sum, status) => sum + status.busyWorkers, 0);
    });

    const totalQueuedTasks = computed(() => {
        return Object.values(poolStatus.value).reduce((sum, status) => sum + status.queuedTasks, 0);
    });

    const overallUtilization = computed(() => {
        const pools = Object.values(poolStatus.value);
        if (pools.length === 0) return '0.0';

        const totalUtilization = pools.reduce((sum, status) => {
            const utilization = parseFloat(status.utilization) || 0;
            return sum + utilization;
        }, 0);

        const avgUtilization = totalUtilization / pools.length;
        return avgUtilization.toFixed(1);
    });

    // 狀態更新回調
    const handleStatusUpdate = (poolName, status, allStatus) => {
        poolStatus.value = { ...allStatus };
    };

    onMounted(() => {
        // 訂閱所有 Pool 的狀態變更
        workerPoolManager.onAllStatusChange(handleStatusUpdate);

        // 初始化狀態
        poolStatus.value = workerPoolManager.getAllStatus();
    });

    onUnmounted(() => {
        // 這裡可以取消訂閱，但因為是全域管理器，通常不需要
    });
</script>

<style scoped>
    .worker-monitor {
        padding: 16px;
        background: #eff3f6;
        border-radius: 8px;
        font-family: monospace;
    }

    .monitor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .monitor-header h3 {
        margin: 0;
        color: #333;
    }

    .total-cpu {
        color: #666;
        font-size: 14px;
    }

    .pool-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
    }

    .pool-card {
        background: white;
        border-radius: 6px;
        padding: 12px;
        border: 2px solid #e0e0e0;
        transition: all 0.3s ease;
    }

    .pool-card.pool-busy {
        border-color: #4caf50;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
    }

    .pool-name {
        font-weight: bold;
        color: #333;
        margin-bottom: 8px;
        text-transform: capitalize;
    }

    .pool-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 8px;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
    }

    .label {
        color: #666;
    }

    .value {
        font-weight: bold;
    }

    .value.busy {
        color: #ff9800;
    }

    .value.queue {
        color: #f44336;
    }

    .value.utilization {
        color: #2196f3;
    }

    .progress-bar {
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4caf50, #8bc34a);
        transition: width 0.3s ease;
    }

    .overall-stats {
        display: flex;
        justify-content: space-around;
        gap: 16px;
    }

    .stat-box {
        text-align: center;
        background: white;
        border-radius: 6px;
        padding: 12px;
        flex: 1;
    }

    .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
    }

    .stat-label {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
    }
</style>

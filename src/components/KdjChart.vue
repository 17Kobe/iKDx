<template>
    <div ref="chartContainer" class="kdj-chart" :style="{ width: '100%', height: '100%' }">
        <canvas ref="chartCanvas" :style="{ width: '100%', height: '100%' }"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed, markRaw } from 'vue';
    import { Chart, registerables } from 'chart.js';
    import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
    import { useUserStockListStore } from '@/stores/user-stock-list-store';
    import dayjs from 'dayjs';

    // 註冊 Chart.js 預設組件
    Chart.register(...registerables);

    // Props 定義
    const props = defineProps({
        stockId: {
            type: String,
            required: true,
        },
        width: {
            type: Number,
            default: 200,
        },
        height: {
            type: Number,
            default: 100,
        },
    });

    // Store
    const userStockListStore = useUserStockListStore();

    // 響應式變數
    const chartContainer = ref(null);
    const chartCanvas = ref(null);
    const chartInstance = ref(null);

    // KDJ 資料 computed
    const kdjData = computed(() => {
        const stock = userStockListStore.userStockList.find(s => s.id === props.stockId);
        if (!stock?.data?.weeklyKdj) return [];

        return stock.data.weeklyKdj
            .filter(item => {
                return (
                    item &&
                    Array.isArray(item) &&
                    item.length >= 4 &&
                    typeof item[1] === 'number' &&
                    !isNaN(item[1]) &&
                    typeof item[2] === 'number' &&
                    !isNaN(item[2]) &&
                    typeof item[3] === 'number' &&
                    !isNaN(item[3])
                );
            })
            .map(item => ({
                x: dayjs(item[0], 'YYYYMMDD').toDate(),
                k: item[1],
                d: item[2],
                j: item[3],
            }));
    });

    // 依據目前 KDJ 資料產生 dataset 陣列
    function buildDatasets() {
        const data = kdjData.value;
        if (!data || data.length === 0) return [];

        const kValues = data.map(item => ({ x: item.x, y: item.k }));
        const dValues = data.map(item => ({ x: item.x, y: item.d }));
        return [
            {
                label: 'K',
                data: kValues,
                borderColor: '#4286f5',
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
            {
                label: 'D',
                data: dValues,
                borderColor: '#e75c9a',
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
        ];
    }

    // 初始化或更新圖表 (避免每次銷毀重建)
    function createOrUpdateChart() {
        if (!chartCanvas.value) return;

        const data = kdjData.value;
        if (!data || data.length === 0) {
            // 無資料時清理圖表
            if (chartInstance.value) {
                chartInstance.value.destroy();
                chartInstance.value = null;
            }
            return;
        }

        const ctx = chartCanvas.value.getContext('2d');
        if (!ctx) return;

        // 銷毀舊圖表，重新建立（簡單且穩定）
        if (chartInstance.value) {
            chartInstance.value.destroy();
            chartInstance.value = null;
        }

        try {
            // 使用 markRaw 避免 Chart.js 實例被 Vue 響應式化
            chartInstance.value = markRaw(
                new Chart(ctx, {
                    type: 'line',
                    data: { datasets: buildDatasets() },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: { unit: 'week', displayFormats: { week: 'MM/DD' } },
                                display: false,
                                grid: { display: false },
                                ticks: { display: false },
                                offset: false,
                                bounds: 'data',
                            },
                            y: {
                                type: 'linear',
                                position: 'right',
                                display: true,
                                min: 0,
                                max: 100,
                                border: { display: false },
                                grid: {
                                    drawTicks: false,
                                    color: ctx => {
                                        const v = ctx.tick.value;
                                        return [0, 20, 50, 80, 100].includes(v)
                                            ? 'rgba(200, 200, 200, 0.3)'
                                            : 'transparent';
                                    },
                                },
                                ticks: {
                                    stepSize: 10,
                                    autoSkip: false,
                                    color: '#888',
                                    font: { size: 12 },
                                    padding: -15,
                                    callback: v => (v === 20 || v === 50 || v === 80 ? v : ''),
                                },
                            },
                        },
                        animation: false,
                    },
                })
            );
        } catch (error) {
            console.error('創建 / 更新 KDJ 圖表失敗:', error);
            showErrorPlaceholder();
        }
    }

    // 初始化
    onMounted(() => {
        nextTick(() => createOrUpdateChart());
    });

    // 顯示錯誤佔位符
    function showErrorPlaceholder() {
        if (chartContainer.value) {
            chartContainer.value.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f0f0f0;
                    color: #666;
                    font-size: 12px;
                    border-radius: 6px;
                ">
                    KDJ 圖表暫不可用
                </div>
            `;
        }
    }

    // 監聽 KDJ 資料變化，更新圖表
    watch(
        kdjData,
        () => {
            nextTick(() => createOrUpdateChart());
        },
        { immediate: false }
    );

    // 組件卸載前清理
    onBeforeUnmount(() => {
        if (chartInstance.value) {
            try {
                chartInstance.value.destroy();
            } catch (error) {
                console.warn('Chart.js 清理失敗:', error);
            }
            chartInstance.value = null;
        }
    });
</script>

<style scoped>
    .kdj-chart {
        background: transparent;
        border-radius: 6px;
        /* box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04); */
        overflow: hidden;
        position: relative;
        padding: 0; /* 移除 padding，讓圖表充滿容器 */
    }
</style>

<template>
    <div ref="chartContainer" class="kdj-chart" :style="{ width: '100%', height: '100%' }">
        <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="error-placeholder">KDJ 圖表暫不可用</div>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { Line } from 'vue-chartjs';
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        TimeScale,
    } from 'chart.js';
    import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
    import { useUserStockListStore } from '@/stores/user-stock-list-store';
    import dayjs from 'dayjs';

    // 註冊 Chart.js 組件
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        TimeScale
    );

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

    // Chart.js 資料格式
    const chartData = computed(() => {
        const data = kdjData.value;
        if (!data || data.length === 0) {
            return { datasets: [] };
        }

        const kValues = data.map(item => ({ x: item.x, y: item.k }));
        const dValues = data.map(item => ({ x: item.x, y: item.d }));

        return {
            datasets: [
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
            ],
        };
    });

    // Chart.js 配置選項
    const chartOptions = {
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
    };
</script>

<style scoped>
    .kdj-chart {
        background: transparent;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        padding: 0;
    }

    .error-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f0f0f0;
        color: #666;
        font-size: 12px;
        border-radius: 6px;
    }
</style>

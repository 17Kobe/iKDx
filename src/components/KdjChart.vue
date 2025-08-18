<template>
    <div ref="chartContainer" class="kdj-chart" :style="{ width: '100%', height: '100%' }">
        <canvas ref="chartCanvas" :style="{ width: '100%', height: '100%' }"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
    import { Chart, registerables } from 'chart.js';
    import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
    import { useUserStockListStore } from '@/stores/user-stock-list-store';
    import dayjs from 'dayjs';

    // 註冊 Chart.js 預設組件
    Chart.register(...registerables);

    // 直接繪製水平參考線 (不使用外掛)
    function drawReferenceLines() {
        if (!chartInstance.value) return;
        const chart = chartInstance.value;
        const yScale = chart.scales.y;
        if (!yScale) return;
        const { left, right } = chart.chartArea;
        const ctx = chart.ctx;
        const levels = [0, 20, 50, 80, 100];
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        levels.forEach(v => {
            const y = yScale.getPixelForValue(v);
            if (isNaN(y)) return;
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();
            if (v === 20 || v === 50 || v === 80) {
                ctx.fillText(String(v), right - 3, y);
            }
        });
        ctx.restore();
    }

    // 在下一個 frame 繪製，確保主圖完成
    function scheduleDrawLines() {
        requestAnimationFrame(() => drawReferenceLines());
    }

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

    // 計算 KDJ 資料 (回傳陣列: { x:Date, k:number, d:number })
    const kdjData = computed(() => {
        const stock = userStockListStore.userStockList.find(s => s.id === props.stockId);
        if (!stock?.data?.weeklyKdj) return [];

        return stock.data.weeklyKdj.map(item => ({
            x: dayjs(item[0], 'YYYYMMDD').toDate(), // 使用 Date 物件for時間軸
            k: item[1],
            d: item[2],
            j: item[3],
        }));
    });

    // 依據目前 KDJ 資料產生 dataset 陣列
    function buildDatasets() {
        const kValues = kdjData.value.map(item => ({ x: item.x, y: item.k }));
        const dValues = kdjData.value.map(item => ({ x: item.x, y: item.d }));
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
        if (kdjData.value.length === 0) return; // 無資料不建立圖表

        const ctx = chartCanvas.value.getContext('2d');
        if (!ctx) return;

        // 若已存在，僅更新資料
        if (chartInstance.value) {
            const updated = buildDatasets();
            chartInstance.value.data.datasets.forEach((ds, idx) => {
                ds.data = updated[idx].data;
            });
            chartInstance.value.update('none');
            scheduleDrawLines();
            return;
        }

        try {
            chartInstance.value = new Chart(ctx, {
                type: 'line',
                data: { datasets: buildDatasets() },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: 'transparent',
                    layout: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                    plugins: { legend: { display: false } },
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
                            display: false,
                            min: 0,
                            max: 100,
                        },
                    },
                    animation: { duration: 0 }, // 關閉動畫提升回應速度
                },
            });
            scheduleDrawLines();
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

    // 監聽資料變化，更新圖表
    watch(
        kdjData,
        () => {
            nextTick(() => createOrUpdateChart());
        },
        { deep: true },
    );

    // 組件卸載前清理
    onBeforeUnmount(() => {
        if (chartInstance.value) {
            try { chartInstance.value.destroy(); } catch (error) { console.warn('Chart.js 清理失敗:', error); }
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

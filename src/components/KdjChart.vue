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

    // 計算 KDJ 資料
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

    onMounted(() => {
        nextTick(() => {
            createChart();
        });
    });

    // 繪製自定義橫線的函數
    function drawCustomLines(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const yScale = chart.scales.y;
        
        // 設定線條樣式
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        
        // 設定文字樣式
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // 需要畫線的數值 (showLabel 表示是否顯示文字)
        const lines = [
            { value: 0, showLabel: false },
            { value: 20, showLabel: true },
            { value: 50, showLabel: true },
            { value: 80, showLabel: true },
            { value: 100, showLabel: false },
        ];

        lines.forEach(({ value, showLabel }) => {
            const yPosition = yScale.getPixelForValue(value);
            if (isNaN(yPosition)) return;

            // 繪製橫線
            ctx.beginPath();
            ctx.moveTo(chartArea.left, yPosition);
            ctx.lineTo(chartArea.right, yPosition);
            ctx.stroke();

            // 顯示 20/50/80 的文字，0/100 不顯示
            if (showLabel) {
                ctx.fillText(String(value), chartArea.right - 3, yPosition);
            }
        });
    }

    // 創建 KDJ 線圖表
    function createChart() {
        if (!chartCanvas.value || kdjData.value.length === 0) return;

        const ctx = chartCanvas.value.getContext('2d');
        if (!ctx) return;

        // 清理現有圖表實例
        if (chartInstance.value) {
            try {
                chartInstance.value.destroy();
            } catch (error) {
                console.warn('清理現有圖表失敗:', error);
            }
            chartInstance.value = null;
        }

        try {
            const kValues = kdjData.value.map(item => ({ x: item.x, y: item.k }));
            const dValues = kdjData.value.map(item => ({ x: item.x, y: item.d }));

            chartInstance.value = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'K',
                            data: kValues,
                            borderColor: '#4286f5', // 更鮮明的藍色
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            fill: false,
                            tension: 0, // 使用直線避免貝茲曲線使視覺終點往內縮
                            pointRadius: 0, // 移除圓點
                            pointHoverRadius: 0, // 移除 hover 圓點
                        },
                        {
                            label: 'D',
                            data: dValues,
                            borderColor: '#e75c9a', // 更鮮明的紅色
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            fill: false,
                            tension: 0, // 同上
                            pointRadius: 0, // 移除圓點
                            pointHoverRadius: 0, // 移除 hover 圓點
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: 'transparent', // Chart.js 背景透明
                    layout: {
                        padding: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0
                        }
                    },
                    plugins: {
                        legend: {
                            display: false, // 移除圖例
                        },
                    },
                    onResize: (chart, size) => {
                        // 重繪自定義線條
                        chart.update('none');
                    },
                    animation: {
                        onComplete: function() {
                            // 在動畫完成後繪製自定義橫線
                            drawCustomLines(this);
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'week',
                                displayFormats: {
                                    week: 'MM/DD'
                                }
                            },
                            display: false, // 完全隱藏 X 軸
                            grid: { 
                                display: false, // 移除 X 軸網格線
                            },
                            ticks: {
                                display: false, // 隱藏 X 軸刻度標籤
                            },
                            offset: false, // 移除偏移，讓線條貼邊
                            bounds: 'data', // 使用資料邊界
                        },
                        y: {
                            type: 'linear',
                            // 完全隱藏軸 (ticks / grid / border) 以釋放右側空間，線條可貼齊畫布
                            display: false,
                            min: 0,
                            max: 100,
                        },
                    },
                },
            });
        } catch (error) {
            console.error('創建 KDJ 圖表失敗:', error);
            showErrorPlaceholder();
        }
    }

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

    // 監聽 KDJ 資料變化，重新渲染圖表
    watch(
        kdjData,
        () => {
            nextTick(() => {
                createChart();
            });
        },
        { deep: true }
    );

    // 組件卸載前清理
    onBeforeUnmount(() => {
        if (chartInstance.value) {
            try {
                chartInstance.value.destroy();
            } catch (error) {
                console.warn('Chart.js 清理失敗:', error);
            }
        }
        chartInstance.value = null;
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

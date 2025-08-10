<template>
    <div ref="chartContainer" class="mini-k-chart" :style="{ width: '100%', height: '100%' }">
        <canvas ref="chartCanvas" :style="{ width: '100%', height: '100%' }"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
    import { Chart, registerables } from 'chart.js';
    import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
    Chart.register(...registerables, CandlestickController, CandlestickElement);

    // Props 定義
    const props = defineProps({
        width: {
            type: Number,
            default: 200,
        },
        height: {
            type: Number,
            default: 100,
        },
        stockData: {
            type: Object,
            required: true,
        },
        stockIndex: {
            type: Number,
            default: 0,
        },
    });

    onMounted(() => {
        nextTick(() => {
            // resizeCanvas();
            // ...繪圖邏輯
        });
        // window.addEventListener('resize', resizeCanvas);
    });

    // function resizeCanvas() {
    //     const canvas = chartCanvas.value;
    //     if (!canvas) return;
    //     const dpr = window.devicePixelRatio || 1;
    //     // 取得父容器實際顯示尺寸
    //     const rect = canvas.parentElement.getBoundingClientRect();
    //     canvas.width = rect.width * dpr;
    //     canvas.height = rect.height * dpr;
    //     canvas.style.width = rect.width + 'px';
    //     canvas.style.height = rect.height + 'px';
    //     const ctx = canvas.getContext('2d');
    //     ctx.setTransform(1, 0, 0, 1, 0, 0); // 重設
    //     ctx.scale(dpr, dpr);
    // }

    // 響應式變數
    const chartContainer = ref(null);
    const chartCanvas = ref(null);
    const chartInstance = ref(null);

    // 使用 Intersection Observer 監控元素是否進入視窗

    // 創建 K 線圖表
    function createChart() {
        if (!chartCanvas.value) return;
        // 銷毀舊圖表
        if (chartInstance.value) {
            chartInstance.value.destroy();
        }
        const candleData = generateKLineData();
        const ctx = chartCanvas.value.getContext('2d');
        chartInstance.value = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [
                    {
                        label: 'K 線圖',
                        data: candleData,
                        color: {
                            up: '#ef5350',
                            down: '#26a69a',
                            unchanged: '#999',
                        },
                        borderColor: '#888',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: { type: 'linear', display: false },
                    y: { display: false },
                },
            },
        });
    }

    // 生成 K 線資料
    function generateKLineData() {
        const candleCount = 6;
        const data = [];
        const basePrice = 30 + props.stockIndex * 2;
        const volatility = 8 + (props.stockIndex % 3) * 2;
        let currentPrice = basePrice;
        for (let i = 0; i < candleCount; i++) {
            const open = currentPrice;
            const priceChange = (Math.random() - 0.5) * volatility;
            const close = open + priceChange;
            const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
            const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
            data.push({
                x: i,
                o: open,
                h: high,
                l: low,
                c: close,
            });
            currentPrice = close;
        }
        return data;
    }

    // 使用 Canvas 繪製 K 線圖

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
                    圖表暫不可用
                </div>
            `;
        }
    }

    // 監聽股票資料變化，重新渲染圖表
    watch(
        () => props.stockData,
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
            chartInstance.value.destroy();
        }
        chartInstance.value = null;
    });
</script>

<style scoped>
    .mini-k-chart {
        /* background: #fff; */
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        position: relative;
    }

    .chart-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        border-radius: 6px;
    }

    .placeholder-content {
        color: #999;
        font-size: 12px;
        text-align: center;
    }
</style>

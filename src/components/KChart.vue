<template>
    <div ref="chartContainer" class="mini-k-chart" :style="{ width: '100%', height: '100%' }">
        <!-- 載入中顯示 -->
        <div v-if="!isVisible" class="chart-placeholder">
            <div class="placeholder-content">圖表載入中...</div>
        </div>
        <!-- Chart.js Canvas -->
        <canvas v-else ref="chartCanvas" :style="{ width: '100%', height: '100%' }"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
    import { useIntersectionObserver } from '@vueuse/core';

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

    // 響應式變數
    const chartContainer = ref(null);
    const chartCanvas = ref(null);
    const isVisible = ref(false);
    const chartInstance = ref(null);

    // 使用 Intersection Observer 監控元素是否進入視窗
    const { stop } = useIntersectionObserver(
        chartContainer,
        ([{ isIntersecting }]) => {
            if (isIntersecting && !isVisible.value) {
                console.log(`股票 ${props.stockData.name} 的圖表進入視窗，開始渲染...`);
                isVisible.value = true;
                nextTick(() => {
                    createChart();
                });
            }
        },
        {
            threshold: 0.1, // 當 10% 的元素進入視窗時觸發
            rootMargin: '50px', // 提前 50px 開始載入
        }
    );

    // 創建 K 線圖表
    function createChart() {
        if (!chartCanvas.value) {
            return;
        }

        try {
            console.log(`正在為股票 ${props.stockData.name} 創建 K 線圖...`);

            // 創建簡單的 Canvas K 線圖
            const ctx = chartCanvas.value.getContext('2d');
            const candleData = generateKLineData();
            drawCandlestickChart(ctx, candleData);

            console.log(`股票 ${props.stockData.name} 的 K 線圖創建成功`);
        } catch (error) {
            console.error(`創建股票 ${props.stockData.name} 的圖表時發生錯誤:`, error);
            showErrorPlaceholder();
        }
    }

    // 生成 K 線資料
    function generateKLineData() {
        const candleCount = 6;
        const data = [];
        const basePrice = 30 + props.stockIndex * 2;
        const volatility = 8 + (props.stockIndex % 3) * 2;
        let currentPrice = basePrice;

        for (let i = 0; i < candleCount; i++) {
            // 生成 OHLC 資料
            const open = currentPrice;
            const priceChange = (Math.random() - 0.5) * volatility;
            const close = open + priceChange;
            const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
            const low = Math.min(open, close) - Math.random() * (volatility * 0.3);

            data.push({
                open: open,
                high: high,
                low: low,
                close: close,
            });
            currentPrice = close;
        }
        return data;
    }

    // 使用 Canvas 繪製 K 線圖
    function drawCandlestickChart(ctx, data) {
        const canvas = chartCanvas.value;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // 設定 canvas 實際大小
        canvas.width = width;
        canvas.height = height;

        // 清除畫布
        ctx.clearRect(0, 0, width, height);

        const padding = 10;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // 計算價格範圍
        const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // 繪製每個 K 棒
        const candleWidth = chartWidth / data.length;
        const bodyWidth = candleWidth * 0.6;

        data.forEach((candle, i) => {
            const x = padding + (i + 0.5) * candleWidth;
            const isRising = candle.close > candle.open;
            const color = isRising ? '#ef5350' : '#26a69a';

            // 計算 Y 座標
            const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
            const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
            const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
            const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;

            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

            // 繪製影線
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // 繪製實體
            ctx.fillStyle = isRising ? color : '#fff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
            ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
        });
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
                    圖表暫不可用
                </div>
            `;
        }
    }

    // 監聽股票資料變化，重新渲染圖表
    watch(
        () => props.stockData,
        () => {
            if (isVisible.value) {
                nextTick(() => {
                    createChart();
                });
            }
        },
        { deep: true }
    );

    // 組件卸載前清理
    onBeforeUnmount(() => {
        stop(); // 停止 Intersection Observer
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

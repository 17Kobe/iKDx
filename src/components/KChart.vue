<template>
    <div 
        ref="chartContainer" 
        class="mini-k-chart"
        :style="{ width: '100%', height: '100%' }"
    >
        <!-- 載入中顯示 -->
        <div v-if="!isVisible" class="chart-placeholder">
            <div class="placeholder-content">圖表載入中...</div>
        </div>
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
        if (!chartContainer.value || chartInstance.value) {
            return;
        }

        try {
            console.log(`正在為股票 ${props.stockData.name} 創建 K 線圖...`);
            
            // 清空容器
            chartContainer.value.innerHTML = '';
            
            // 創建 SVG K 棒圖表
            const svg = createSVGKChart();
            chartContainer.value.appendChild(svg);
            
            chartInstance.value = svg;
            console.log(`股票 ${props.stockData.name} 的 K 線圖創建成功`);
            
        } catch (error) {
            console.error(`創建股票 ${props.stockData.name} 的圖表時發生錯誤:`, error);
            showErrorPlaceholder();
        }
    }

    // 創建 SVG K 棒圖表
    function createSVGKChart() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${props.width} ${props.height}`);

        // 邊界自動依比例縮放
        const padding = Math.max(props.width, props.height) * 0.08;
        const chartW = props.width - padding * 2;
        const chartH = props.height - padding * 2;

        // 產生 K 線資料
        const basePrice = 30 + (props.stockIndex * 2);
        const volatility = 8 + (props.stockIndex % 3) * 2;
        const candleData = generateKLineData(basePrice, volatility);

        // 計算 Y 軸最大最小
        const prices = candleData.flatMap(c => [c.open, c.close, c.high, c.low]);
        const minY = Math.min(...prices);
        const maxY = Math.max(...prices);

        // 畫 Y 軸
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding);
        yAxis.setAttribute('y1', padding);
        yAxis.setAttribute('x2', padding);
        yAxis.setAttribute('y2', props.height - padding);
        yAxis.setAttribute('stroke', '#bbb');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // 畫 X 軸
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding);
        xAxis.setAttribute('y1', props.height - padding);
        xAxis.setAttribute('x2', props.width - padding);
        xAxis.setAttribute('y2', props.height - padding);
        xAxis.setAttribute('stroke', '#bbb');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        // Y 軸刻度
        for (let i = 0; i <= 2; i++) {
            const y = padding + (chartH * i) / 2;
            const price = (maxY - ((maxY - minY) * i) / 2).toFixed(1);
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', padding - 3);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', padding);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#bbb');
            tick.setAttribute('stroke-width', '1');
            svg.appendChild(tick);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', 2);
            label.setAttribute('y', y + 3);
            label.setAttribute('font-size', '8');
            label.setAttribute('fill', '#888');
            label.textContent = price;
            svg.appendChild(label);
        }

        // X 軸刻度
        for (let i = 0; i < candleData.length; i++) {
            const x = padding + (i + 1) * (chartW / (candleData.length + 1));
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', props.height - padding);
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', props.height - padding + 3);
            tick.setAttribute('stroke', '#bbb');
            tick.setAttribute('stroke-width', '1');
            svg.appendChild(tick);
        }

        // 畫 K 棒
        candleData.forEach((candle, i) => {
            const isRising = candle.close > candle.open;
            const color = isRising ? '#ef5350' : '#26a69a';
            // 價格轉換為 SVG Y 座標（Y 軸反向）
            const priceToY = price => padding + ((maxY - price) / (maxY - minY)) * chartH;
            const x = padding + (i + 1) * (chartW / (candleData.length + 1));
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY);

            // 上影線
            if (highY < bodyTop) {
                const upperWick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                upperWick.setAttribute('x1', x);
                upperWick.setAttribute('y1', highY);
                upperWick.setAttribute('x2', x);
                upperWick.setAttribute('y2', bodyTop);
                upperWick.setAttribute('stroke', color);
                upperWick.setAttribute('stroke-width', '1');
                svg.appendChild(upperWick);
            }

            // 下影線
            if (lowY > bodyBottom) {
                const lowerWick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                lowerWick.setAttribute('x1', x);
                lowerWick.setAttribute('y1', bodyBottom);
                lowerWick.setAttribute('x2', x);
                lowerWick.setAttribute('y2', lowY);
                lowerWick.setAttribute('stroke', color);
                lowerWick.setAttribute('stroke-width', '1');
                svg.appendChild(lowerWick);
            }

            // K 棒實體
            const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            body.setAttribute('x', x - 3);
            body.setAttribute('y', bodyTop);
            body.setAttribute('width', '6');
            body.setAttribute('height', Math.max(bodyHeight, 1));
            body.setAttribute('fill', isRising ? color : '#fff');
            body.setAttribute('stroke', color);
            body.setAttribute('stroke-width', '1');
            svg.appendChild(body);
        });

        return svg;
    }

    // 生成 K 線資料
    function generateKLineData(basePrice, volatility) {
        const candleCount = 6;
        const data = [];
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

    // 顯示錯誤佔位符
    function showErrorPlaceholder() {
        if (chartContainer.value) {
            chartContainer.value.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: ${props.height}px;
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
        background: #fff;
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

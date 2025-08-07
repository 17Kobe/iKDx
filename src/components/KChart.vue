<template>
    <div 
        ref="chartContainer" 
        class="mini-k-chart"
        :style="{ width: width + 'px', height: height + 'px' }"
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
            default: 120,
        },
        height: {
            type: Number,
            default: 60,
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
        svg.setAttribute('width', props.width);
        svg.setAttribute('height', props.height);
        svg.setAttribute('viewBox', `0 0 ${props.width} ${props.height}`);
        
        // 根據股票索引生成不同的資料，模擬真實股價走勢
        const basePrice = 30 + (props.stockIndex * 2);
        const volatility = 8 + (props.stockIndex % 3) * 2; // 不同的波動幅度
        
        const candleData = generateKLineData(basePrice, volatility);
        
        // 為每個 K 棒創建圖形
        candleData.forEach(candle => {
            const isRising = candle.close > candle.open;
            const color = isRising ? '#ef5350' : '#26a69a'; // 紅漲綠跌
            const bodyTop = Math.min(candle.open, candle.close);
            const bodyBottom = Math.max(candle.open, candle.close);
            const bodyHeight = Math.abs(candle.close - candle.open);
            
            // 上影線（從最高點到實體上方）
            if (candle.high > bodyTop) {
                const upperWick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                upperWick.setAttribute('x1', candle.x);
                upperWick.setAttribute('y1', candle.high);
                upperWick.setAttribute('x2', candle.x);
                upperWick.setAttribute('y2', bodyTop);
                upperWick.setAttribute('stroke', color);
                upperWick.setAttribute('stroke-width', '1');
                svg.appendChild(upperWick);
            }
            
            // 下影線（從實體下方到最低點）
            if (candle.low < bodyBottom) {
                const lowerWick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                lowerWick.setAttribute('x1', candle.x);
                lowerWick.setAttribute('y1', bodyBottom);
                lowerWick.setAttribute('x2', candle.x);
                lowerWick.setAttribute('y2', candle.low);
                lowerWick.setAttribute('stroke', color);
                lowerWick.setAttribute('stroke-width', '1');
                svg.appendChild(lowerWick);
            }
            
            // K 棒實體
            const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            body.setAttribute('x', candle.x - 3); // 寬度為 6
            body.setAttribute('y', bodyTop);
            body.setAttribute('width', '6');
            body.setAttribute('height', Math.max(bodyHeight, 1)); // 最小高度 1
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
        const candleWidth = props.width / (candleCount + 1);
        const data = [];
        
        let currentPrice = basePrice;
        
        for (let i = 0; i < candleCount; i++) {
            const x = (i + 1) * candleWidth;
            
            // 生成 OHLC 資料
            const open = currentPrice;
            const priceChange = (Math.random() - 0.5) * volatility;
            const close = open + priceChange;
            
            const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
            const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
            
            data.push({
                x: x,
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

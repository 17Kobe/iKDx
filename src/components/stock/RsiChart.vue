<template>
    <div ref="chartContainer" class="rsi-chart" :style="{ width: '100%', height: '100%' }">
        <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="error-placeholder">RSI 圖表暫不可用</div>
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

    // 自定義 RSI 值顯示插件
    const rsiDisplayPlugin = {
        id: 'rsiDisplay',
        afterDatasetsDraw: (chart, args, options) => {
            // 確保我們有正確的插件配置
            const pluginOptions = options?.rsiDisplay || options;

            if (!pluginOptions?.enabled || !pluginOptions?.lastRsi) {
                // 不輸出錯誤日志，因為可能是其他圖表調用
                return;
            }

            const { ctx, chartArea } = chart;
            const { lastRsi } = pluginOptions;

            // 計算 0 軸位置（與 KDJ 保持一致）
            const yScale = chart.scales.y;
            const zeroY = yScale.getPixelForValue(0);

            // 設定 RSI 值顯示位置（右下角，0 軸以下，與 KDJ 一致）
            const xStart = chartArea.right - 59; // 參考 KDJ 的位置設定
            const yRsi = zeroY + 15; // RSI 值位置，在 0 軸以下

            // 繪製文字
            ctx.save();

            // 繪製 RSI 值
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';

            // 根據 RSI 值決定顏色
            const rsiValue = parseFloat(lastRsi.value);
            if (rsiValue > 70) {
                ctx.fillStyle = '#e74c3c'; // 超買紅色
            } else if (rsiValue < 30) {
                ctx.fillStyle = '#27ae60'; // 超賣綠色
            } else {
                ctx.fillStyle = '#3498db'; // 正常藍色
            }

            const rsiText = `RSI: ${lastRsi.value}`;
            ctx.fillText(rsiText, xStart, yRsi);

            ctx.restore();
        },
    };

    // 確保插件只註冊一次
    const pluginId = 'rsiDisplay';
    try {
        // 簡單的重複註冊防護，Chart.js 會自動處理重複註冊
        ChartJS.register(rsiDisplayPlugin);
    } catch (error) {
        // 如果註冊失敗，忽略錯誤（可能已經註冊過）
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

    // Emits 定義
    const emit = defineEmits(['rsiClick']);

    // Store
    const userStockListStore = useUserStockListStore();

    // 響應式變數
    const chartContainer = ref(null);

    // RSI 資料 computed
    const rsiData = computed(() => {
        const stock = userStockListStore.userStockList.find(s => s.id === props.stockId);

        if (!stock?.data?.weeklyRsi) {
            return [];
        }

        return stock.data.weeklyRsi
            .filter(item => {
                return (
                    item &&
                    Array.isArray(item) &&
                    item.length >= 2 &&
                    typeof item[1] === 'number' &&
                    !isNaN(item[1])
                );
            })
            .map(item => ({
                x: dayjs(item[0], 'YYYYMMDD').toDate(),
                rsi: item[1],
            }));
    });

    // 最新 RSI 項目
    const lastRsiItem = computed(() => {
        const data = rsiData.value;
        return data && data.length > 0 ? data[data.length - 1] : null;
    });

    // Chart.js 資料格式
    const chartData = computed(() => {
        const data = rsiData.value;
        if (!data || data.length === 0) {
            return { datasets: [] };
        }

        return {
            labels: data.map(item => item.x),
            datasets: [
                {
                    label: 'RSI',
                    data: data.map(item => ({ x: item.x, y: item.rsi })),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.2,
                },
            ],
        };
    });

    // Chart.js 配置選項
    const chartOptions = computed(() => {
        const lastItem = lastRsiItem.value;

        return {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 4,
                    backgroundColor: '#3498db',
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
                line: {
                    borderWidth: 2,
                    tension: 0.2,
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    callbacks: {
                        title: tooltipItems => {
                            const item = tooltipItems[0];
                            return dayjs(item.parsed.x).format('YYYY/MM/DD');
                        },
                        label: context => {
                            const rsi = context.parsed.y;
                            let status = '正常';
                            if (rsi > 70) status = '超買';
                            else if (rsi < 30) status = '超賣';
                            return [`RSI: ${rsi.toFixed(2)}`, `狀態: ${status}`];
                        },
                    },
                },
                // 自定義 RSI 值顯示插件
                rsiDisplay: {
                    enabled: !!lastItem,
                    lastRsi: lastItem
                        ? {
                              value: lastItem.rsi.toFixed(2),
                              date: dayjs(lastItem.x).format('YYYY/MM/DD'),
                          }
                        : null,
                },
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
                    min: -20, // 設定負值範圍，為 0 軸以下的 RSI 值預留空間
                    max: 100,
                    border: { display: false },
                    grid: {
                        drawTicks: false,
                        color: ctx => {
                            const v = ctx.tick.value;
                            // 只在 0 以上的重要位置顯示網格線
                            return [0, 30, 50, 70, 100].includes(v) && v >= 0
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
                        callback: v => (v === 30 || v === 70 ? v : ''), // 只顯示 30 和 70 的數值
                    },
                },
            },
            animation: false,
            interaction: {
                mode: 'nearest',
                intersect: false,
                includeInvisible: false,
            },
            hover: {
                mode: 'nearest',
                intersect: false,
                animationDuration: 200,
            },
            // Chart.js 事件處理
            onClick: (event, elements, chart) => {
                console.log('RSI Chart onClick triggered');

                // 檢查是否點擊在 RSI 值區域
                const rect = chart.canvas.getBoundingClientRect();

                let x, y;
                if (event.native) {
                    x = event.native.offsetX || event.native.clientX - rect.left;
                    y = event.native.offsetY || event.native.clientY - rect.top;
                } else if (event.offsetX !== undefined) {
                    x = event.offsetX;
                    y = event.offsetY;
                } else if (event.clientX !== undefined) {
                    x = event.clientX - rect.left;
                    y = event.clientY - rect.top;
                } else {
                    console.log('Cannot determine click position');
                    return;
                }

                // 判斷點擊位置是否在右下角 RSI 值區域（0 軸以下）
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;
                const zeroY = yScale.getPixelForValue(0);

                const rsiArea = {
                    left: chartArea.right - 120, // 調整對應新的 xStart 位置
                    right: chartArea.right - 5,
                    top: zeroY + 5,
                    bottom: zeroY + 25,
                };

                if (
                    x >= rsiArea.left &&
                    x <= rsiArea.right &&
                    y >= rsiArea.top &&
                    y <= rsiArea.bottom
                ) {
                    console.log('Clicked in RSI area');
                    const currentItem = lastRsiItem.value;
                    if (currentItem) {
                        console.log('Emitting rsiClick event:', currentItem);
                        let status = '正常';
                        if (currentItem.rsi > 70) status = '超買';
                        else if (currentItem.rsi < 30) status = '超賣';

                        emit('rsiClick', {
                            rsi: currentItem.rsi.toFixed(2),
                            status: status,
                            date: dayjs(currentItem.x).format('YYYY/MM/DD'),
                        });
                    }
                }
            },
        };
    });
</script>

<style scoped>
    .rsi-chart {
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

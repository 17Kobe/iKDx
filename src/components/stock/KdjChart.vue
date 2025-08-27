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

    // 自定義 KD 值顯示插件
    const kdjDisplayPlugin = {
        id: 'kdjDisplay',
        afterDatasetsDraw: (chart, args, options) => {
            if (!options.enabled || !options.lastKdj) return;

            const { ctx, chartArea } = chart;
            const { lastKdj } = options;

            // 計算 0 軸位置
            const yScale = chart.scales.y;
            const zeroY = yScale.getPixelForValue(0);
            
            // 設定 KD 值顯示位置（右下角，0 軸以下，向左移動確保有足夠空間顯示完整數字）
            const xStart = chartArea.right - 97;  // 從85改為100，向左移動15像素
            const yK = zeroY + 15; // K 值位置
            const yD = zeroY + 30; // D 值位置，確保不重疊

            // 繪製文字（不要外框）
            ctx.save();
            
            // 調試信息
            console.log('Drawing KDJ values:', { 
                k: lastKdj.k, 
                d: lastKdj.d,
                xStart,
                yK,
                yD,
                zeroY,
                chartArea
            });
            
            // 繪製 K 值
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#4286f5';
            const kText = `K: ${lastKdj.k}`;
            ctx.fillText(kText, xStart, yK);

            // 計算 K 值文字寬度，讓 D 值緊接在後面同一行
            const kTextWidth = ctx.measureText(kText).width;
            
            // 繪製 D 值在同一行，K 值後面
            ctx.fillStyle = '#e75c9a';
            const dText = ` D: ${lastKdj.d}`;  // 前面加個空格分隔
            const dXPosition = xStart + kTextWidth;
            console.log('Drawing D value:', dText, 'at same line position:', dXPosition, yK);
            ctx.fillText(dText, dXPosition, yK);

            ctx.restore();
        },
    };

    // 註冊自定義插件
    ChartJS.register(kdjDisplayPlugin);

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
    const emit = defineEmits(['kdjClick']);

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
                    backgroundColor: 'rgba(66, 134, 245, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#4286f5',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 2,
                },
                {
                    label: 'D',
                    data: dValues,
                    borderColor: '#e75c9a',
                    backgroundColor: 'rgba(231, 92, 154, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#e75c9a',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 2,
                },
            ],
        };
    });

    // 最新的 KDJ 資料
    const lastKdjItem = computed(() => {
        const data = kdjData.value;
        return data && data.length > 0 ? data[data.length - 1] : null;
    });

    // Chart.js 配置選項
    const chartOptions = computed(() => {
        const lastItem = lastKdjItem.value;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    padding: 8,
                    titleFont: {
                        size: 12,
                        weight: 'bold',
                    },
                    bodyFont: {
                        size: 11,
                    },
                    callbacks: {
                        title: function (context) {
                            // 顯示日期
                            const date = context[0].parsed.x;
                            return dayjs(date).format('YYYY-MM-DD(dd)');
                        },
                        label: function (context) {
                            // 根據資料集顯示 K 或 D 值
                            const label = context.dataset.label;
                            const value = context.parsed.y.toFixed(2);
                            return `${label}: ${value}`;
                        },
                        afterLabel: function (context) {
                            // 在同一個 tooltip 中顯示完整的 KDJ 值
                            const dataIndex = context.dataIndex;
                            const data = kdjData.value;
                            if (data && data[dataIndex]) {
                                const kdj = data[dataIndex];
                                // 只在第一個數據集時顯示完整資訊，避免重複
                                if (context.datasetIndex === 0) {
                                    return [
                                        `K: ${kdj.k.toFixed(2)}`,
                                        `D: ${kdj.d.toFixed(2)}`,
                                        `J: ${kdj.j.toFixed(2)}`,
                                    ];
                                }
                            }
                            return [];
                        },
                    },
                },
                // 自定義 KD 值顯示插件
                kdjDisplay: {
                    enabled: !!lastItem,
                    lastKdj: lastItem
                        ? {
                              k: lastItem.k.toFixed(2),
                              d: lastItem.d.toFixed(2),
                              j: lastItem.j.toFixed(2),
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
                    min: -20,
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
                console.log('Chart onClick triggered');
                console.log('Event object:', event);

                // 檢查是否點擊在 KD 值區域
                const rect = chart.canvas.getBoundingClientRect();

                // 嘗試不同方式獲取點擊位置
                let x, y;
                if (event.native) {
                    // 如果是 Chart.js 包裝的事件
                    x = event.native.offsetX || event.native.clientX - rect.left;
                    y = event.native.offsetY || event.native.clientY - rect.top;
                } else if (event.offsetX !== undefined) {
                    // 直接使用 offset 座標
                    x = event.offsetX;
                    y = event.offsetY;
                } else if (event.clientX !== undefined) {
                    // 使用 client 座標計算
                    x = event.clientX - rect.left;
                    y = event.clientY - rect.top;
                } else {
                    console.log('Cannot determine click position');
                    return;
                }

                console.log('Click position:', { x, y });
                console.log('Canvas rect:', rect);

                // 判斷點擊位置是否在右下角 KD 值區域（0 軸以下，同一行）
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;
                const zeroY = yScale.getPixelForValue(0);
                
                const kdjArea = {
                    left: chartArea.right - 120,  // 調整對應新的xStart位置 (100 + 35預留空間)
                    right: chartArea.right - 5,
                    top: zeroY + 5,
                    bottom: zeroY + 20,  // 減少高度因為只有一行
                };

                console.log('KDJ area:', kdjArea);

                if (
                    x >= kdjArea.left &&
                    x <= kdjArea.right &&
                    y >= kdjArea.top &&
                    y <= kdjArea.bottom
                ) {
                    console.log('Clicked in KDJ area');
                    const currentItem = lastKdjItem.value;
                    if (currentItem) {
                        console.log('Emitting kdjClick event:', currentItem);
                        emit('kdjClick', {
                            k: currentItem.k.toFixed(2),
                            d: currentItem.d.toFixed(2),
                            j: currentItem.j.toFixed(2),
                            date: dayjs(currentItem.x).format('YYYY/MM/DD'),
                        });
                    }
                } else {
                    console.log('Clicked outside KDJ area');
                }
            },
        };
    });
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

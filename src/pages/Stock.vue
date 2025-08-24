<template>
    <div class="stock-page">
        <!-- 股票列表 -->
        <draggable
            v-model="stockList"
            item-key="id"
            :delay="200"
            :animation="200"
            ghost-class="stock-row-ghost"
            @start="onDragStart"
            @end="onDragEnd"
        >
            <template #item="{ element: stock, index }">
                <div class="stock-row" @contextmenu.prevent>
                    <SwipeCell :left-width="200" @click-left="onLeftAction">
                        <template #left>
                            <div class="action-buttons">
                                <Button
                                    type="primary"
                                    size="small"
                                    class="action-btn buy-btn"
                                    @click="onBuyStock(stock)"
                                >
                                    <div>交 易</div>
                                    <div>記 錄</div>
                                </Button>
                                <Button
                                    type="warning"
                                    size="small"
                                    class="action-btn strategy-btn"
                                    @click="onStrategyStock(stock)"
                                    >策 略</Button
                                >
                                <Button
                                    type="default"
                                    size="small"
                                    class="action-btn other-btn"
                                    @click="onOtherAction(stock)"
                                    >更 多</Button
                                >
                            </div>
                        </template>
                        <div class="stock-content">
                            <StockName
                                :name="stock.name"
                                :code="stock.code"
                                :price="stock.price"
                                :change="stock.change"
                                :change-percent="stock.changePercent"
                                :price-class="getPriceClass(stock.change)"
                                :progress="stock.progress"
                                :progress-text="stock.progressText"
                            />
                            <div class="stock-indicator">
                                <Swipe
                                    :show-indicators="false"
                                    :loop="false"
                                    :autoplay="0"
                                    @change="current => onStockIndicatorChange(current, index)"
                                >
                                    <SwipeItem class="indicator-content">
                                        <div class="kd-indicator">
                                            <KdjChart
                                                :width="120"
                                                :height="60"
                                                :stock-id="stock.id"
                                                @kdj-click="onKdjClick"
                                            />
                                        </div>
                                    </SwipeItem>
                                    <SwipeItem class="indicator-content">
                                        <div class="rsi-indicator">
                                            <div class="rsi-value">{{ stock.rsi }}</div>
                                            <div class="rsi-trend" :class="getRSIClass(stock.rsi)">
                                                {{ getRSIStatus(stock.rsi) }}
                                            </div>
                                        </div>
                                    </SwipeItem>
                                </Swipe>
                            </div>
                        </div>
                    </SwipeCell>
                </div>
            </template>
        </draggable>

        <!-- 浮動按鈕 -->
        <FloatingBubble
            axis="xy"
            magnetic="x"
            :gap="{ x: 20, y: 80 }"
            style="
                --van-floating-bubble-size: 56px;
                --van-floating-bubble-background: rgba(255, 224, 102, 0.9);
                --van-floating-bubble-icon-size: 22px;
                --van-floating-bubble-color: #322b0d;
            "
            @click="onBubbleClick"
        >
            <div
                class="bubble-content"
                style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                "
            >
                <Icon name="plus" size="22" color="#322b0d" style="margin-bottom: 2px" />
                <span class="bubble-label" style="color: #322b0d; font-size: 14px">新增</span>
            </div>
        </FloatingBubble>

        <!-- 股票搜尋組件 -->
        <StockSearch />

        <!-- KDJ ActionSheet -->
        <ActionSheet
            v-model:show="showKdjActionSheet"
            :actions="kdjActions"
            cancel-text="取消"
            title="KDJ 指標詳情"
            @select="onKdjActionSelect"
        />
    </div>
</template>

<script setup>
    import { ref, reactive, onMounted, computed, watch } from 'vue';
    import {
        FloatingBubble,
        Swipe,
        SwipeItem,
        SwipeCell,
        Button,
        Icon,
        ActionSheet,
        showToast,
    } from 'vant';
    import StockSearch from '@/components/StockSearch.vue';
    import KdjChart from '@/components/KdjChart.vue';
    import StockName from '@/components/StockName.vue';
    import { useEventBus, useEventListener } from '@vueuse/core';
    import { useUserStockListStore } from '@/stores/user-stock-list-store.js';
    import draggable from 'vuedraggable/src/vuedraggable';
    // import { createChart } from 'lightweight-charts';
    // import { initDB, ensureStoreExists } from '@/lib/idb';

    // 使用 Pinia store
    const userStockListStore = useUserStockListStore();

    // 事件總線
    const bus = useEventBus('stock-search');

    // 響應式數據
    const stockListRef = ref(null);
    const indicatorSwipeRef = ref(null);
    const currentIndicator = ref(0); // 0: 週KD, 1: RSI
    const showKdjActionSheet = ref(false);
    const currentKdjData = ref(null);
    // ...已移除 PullRefresh 相關狀態...

    onMounted(async () => {
        try {
            // await initDB();
            // await ensureStoreExists('all-stocks');
            // await ensureStoreExists('user-stocks');
            userStockListStore.loadUserStockList();
        } catch (error) {
            console.error('初始化資料庫失敗:', error);
        }
    });

    // 計算屬性：取得使用者股票清單
    const stockList = computed({
        get() {
            return userStockListStore.userStockList;
        },
        set(newList) {
            // 支援拖拽排序功能
            userStockListStore.reorderStockList(newList);
        },
    });

    // 浮動按鈕點擊
    function onBubbleClick() {
        bus.emit(true);
    }

    // ...已移除 PullRefresh 相關方法...

    // 指標切換
    function onIndicatorChange(current) {
        currentIndicator.value = current;
    }

    function onStockIndicatorChange(current, stockIndex) {
        // 可以在這裡處理個別股票的指標切換
        console.log(`Stock ${stockIndex} indicator changed to ${current}`);
    }

    // 價格樣式
    function getPriceClass(change) {
        if (change > 0) return 'price-up';
        if (change < 0) return 'price-down';
        return 'price-flat';
    }

    // KD 指標樣式和狀態
    const kdjActions = computed(() => {
        if (!currentKdjData.value) return [];

        return [
            {
                name: `K 值: ${currentKdjData.value.k}`,
                subname: '快線指標 (敏感度高)',
                color: '#4286f5',
            },
            {
                name: `D 值: ${currentKdjData.value.d}`,
                subname: '慢線指標 (敏感度低)',
                color: '#e75c9a',
            },
            {
                name: `J 值: ${currentKdjData.value.j}`,
                subname: '超買超賣指標',
                color: '#666',
            },
            {
                name: `更新時間: ${currentKdjData.value.date}`,
                subname: '週線資料最後更新',
                color: '#999',
            },
        ];
    });

    // KDJ 點擊處理
    function onKdjClick(kdjData) {
        currentKdjData.value = kdjData;
        showKdjActionSheet.value = true;
    }

    // KDJ ActionSheet 選擇處理
    function onKdjActionSelect(action) {
        console.log('KDJ ActionSheet 選擇:', action.name);
        showKdjActionSheet.value = false;

        // 可以在這裡加上更多處理邏輯，比如顯示詳細分析
        if (action.name.includes('K 值')) {
            showToast('K 值反映股價短期波動');
        } else if (action.name.includes('D 值')) {
            showToast('D 值是 K 值的移動平均');
        } else if (action.name.includes('J 值')) {
            showToast('J 值 > 80 超買，< 20 超賣');
        }
    }
    function getKDClass(kd) {
        if (kd > 80) return 'kd-overbought';
        if (kd < 20) return 'kd-oversold';
        return 'kd-normal';
    }

    function getKDStatus(kd) {
        if (kd > 80) return '超買';
        if (kd < 20) return '超賣';
        return '正常';
    }

    // RSI 指標樣式和狀態
    function getRSIClass(rsi) {
        if (rsi > 70) return 'rsi-overbought';
        if (rsi < 30) return 'rsi-oversold';
        return 'rsi-normal';
    }

    function getRSIStatus(rsi) {
        if (rsi > 70) return '超買';
        if (rsi < 30) return '超賣';
        return '正常';
    }

    // 左滑動作
    function onLeftAction() {
        // SwipeCell 的左滑動作
    }

    // 右滑動作
    function onRightAction() {
        // SwipeCell 的右滑動作
    }

    function onBuyStock(stock) {
        showToast(`買賣 ${stock.name}`);
    }

    function onStrategyStock(stock) {
        showToast(`${stock.name} 策略設定`);
    }

    function onOtherAction(stock) {
        showToast(`${stock.name} 其他功能`);
    }

    function onRemoveStock(stock) {
        userStockListStore.removeStock(stock.id).then(result => {
            if (result.success) {
                showToast(result.message);
            } else {
                showToast(result.message);
            }
        });
    }

    // 拖拽事件
    function onDragStart(evt) {
        // 拖曳開始時，複製原 canvas 內容到拖曳中的 clone canvas
        setTimeout(() => {
            // 找到所有拖曳中的列
            const chosen = document.querySelector('.stock-row.sortable-chosen');
            if (chosen) {
                const origCanvas = chosen.querySelector('canvas');
                // 拖曳中的 clone canvas 會有 .sortable-drag
                const drag = document.querySelector('.stock-row.sortable-drag');
                if (origCanvas && drag) {
                    const dragCanvas = drag.querySelector('canvas');
                    if (dragCanvas && origCanvas.width && origCanvas.height) {
                        dragCanvas.width = origCanvas.width;
                        dragCanvas.height = origCanvas.height;
                        const ctx = dragCanvas.getContext('2d');
                        ctx.clearRect(0, 0, dragCanvas.width, dragCanvas.height);
                        ctx.drawImage(origCanvas, 0, 0);
                    }
                }
            }
        }, 0);
    }

    function onDragEnd(evt) {
        console.log('拖曳結束', evt);
    }

    // 使用 VueUse 的 useEventListener 監聽 visibilitychange
    useEventListener(document, 'visibilitychange', () => {
        // if (document.visibilityState === 'visible') {
        //     userStockListStore.loadUserStockList();
        // }
    });

    onMounted(() => {
        // 組件掛載後的初始化
    });
</script>

<style scoped>
    .stock-page {
        background: var(--page-bg, #eff3f6);
        padding: 6px 6px 2px 6px;
    }

    /* vuedraggable ghost 拖曳目標位置效果 */
    .stock-row-ghost {
        background: rgba(210, 210, 210, 0.5) !important;
        border: none;
        box-shadow: none;
        color: transparent;
        /* 隱藏所有內容 */
        pointer-events: none;
        opacity: 0 !important;
    }

    .stock-row.sortable-chosen {
        /* 拖曳中的殘影（跟隨滑鼠） */
        background: rgba(255, 224, 102, 0.8);
        transform: rotate(2deg);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .stock-row.sortable-drag {
        /* 拖曳中的殘影（跟隨滑鼠） */
        transform: rotate(5deg);
        z-index: 1;
        background: rgba(255, 224, 102, 0.8);
        /* box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18); */
    }

    /* 股票列表 */
    /* .stock-list {
        margin-top: 8px;
    } */

    .stock-row {
        max-width: 100%;
        display: flex;
        align-items: center;
        background: white;
        border-radius: 12px;
        margin-bottom: 4px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        cursor: move;
    }

    .stock-content {
        display: flex;
        align-items: stretch; /* 等高關鍵 */
        max-height: 94px; /* 新增最大高度限制 */
        min-height: 80px;
        padding: 5px;
        width: calc(100% - 10px);
    }

    /* 指標欄 - 可滑動，等高 */
    .stock-indicator {
        flex: 1 1 0%;
        min-width: 0;
        width: 100%;
        display: flex; /* 讓內層可吃到 100% 高度 */
        align-items: stretch;
        box-sizing: border-box;
        transition: none !important;
    }

    /* 強制 Vant Swipe 內層填滿高度 */
    :deep(.van-swipe),
    :deep(.van-swipe__track),
    :deep(.van-swipe-item) {
        width: 100% !important;
        min-width: 0 !important;
        height: 100% !important;
    }

    .indicator-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100% !important;
    }

    .kd-indicator,
    .rsi-indicator {
        text-align: center;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* 左滑動作按鈕 */
    .action-buttons {
        display: flex;
        height: 100%;
        width: 200px;
    }

    .action-btn {
        flex: 1;
        height: 100%;
        margin: 0;
        border-radius: 0;
        font-size: 16px;
        font-weight: bold;
    }

    .buy-btn {
        background-color: #e74c3c;
        border-color: #e74c3c;
    }

    .strategy-btn {
        background-color: #f39c12;
        border-color: #f39c12;
    }

    .other-btn {
        background-color: #eee;
        border-color: #ccc;
        color: #666;
    }

    /* 響應式設計 */
    @media (max-width: 480px) {
        .stock-name .name {
            font-size: 14px;
        }

        .stock-name .price {
            font-size: 16px;
        }

        .kd-value,
        .rsi-value {
            font-size: 16px;
        }
    }

    /* 移除背後圓形的樣式 */
    .van-floating-bubble {
        box-shadow: none; /* 移除陰影效果 */
        background: none; /* 秮除背景樣式 */
    }
</style>

<template>
    <div class="stock-page">
        <!-- 標題欄 -->
        <!-- <div class="header">
            <div class="header-title">自選股</div>
            <div class="header-columns">
                <div class="col-name">名稱</div>
                <div class="col-indicator">
                    <Swipe
                        ref="indicatorSwipeRef"
                        :show-indicators="false"
                        :loop="false"
                        :autoplay="0"
                        class="indicator-swipe"
                        @change="onIndicatorChange"
                    >
                        <SwipeItem class="indicator-item">週KD</SwipeItem>
                        <SwipeItem class="indicator-item">RSI</SwipeItem>
                    </Swipe>
                </div>
            </div>
        </div> -->

        <!-- 股票列表 -->
        <div class="stock-list" ref="stockListRef">
            <div
                v-for="(stock, index) in stockList"
                :key="stock.id"
                class="stock-row"
                :class="{ 'is-dragging': dragIndex === index }"
                @touchstart="onTouchStart($event, index)"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
                @contextmenu.prevent
            >
                <SwipeCell :left-width="120" @click-left="onLeftAction">
                    <template #left>
                        <div class="action-buttons">
                            <Button
                                type="primary"
                                size="small"
                                class="action-btn buy-btn"
                                @click="onBuyStock(stock)"
                            >
                                買賣
                            </Button>
                            <Button
                                type="warning"
                                size="small"
                                class="action-btn strategy-btn"
                                @click="onStrategyStock(stock)"
                            >
                                策略
                            </Button>
                        </div>
                    </template>

                    <div class="stock-content">
                        <!-- 固定的名稱欄 -->
                        <div class="stock-name">
                            <div class="name">{{ stock.name }}</div>
                            <div class="code">{{ stock.code }}</div>
                            <div class="price" :class="getPriceClass(stock.change)">
                                {{ stock.price }}
                            </div>
                            <div class="change" :class="getPriceClass(stock.change)">
                                {{ stock.change > 0 ? '+' : '' }}{{ stock.change }} ({{
                                    stock.changePercent
                                }}%)
                            </div>
                        </div>

                        <!-- 可滑動的指標欄 -->
                        <div class="stock-indicator">
                            <Swipe
                                :show-indicators="false"
                                :loop="false"
                                :autoplay="0"
                                @change="current => onStockIndicatorChange(current, index)"
                            >
                                <SwipeItem class="indicator-content">
                                    <div class="kd-indicator">
                                        <div class="kd-value">{{ stock.weeklyKD }}</div>
                                        <div class="kd-trend" :class="getKDClass(stock.weeklyKD)">
                                            {{ getKDStatus(stock.weeklyKD) }}
                                        </div>
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
        </div>

        <!-- 浮動按鈕 -->
        <FloatingBubble
            icon="plus"
            axis="xy"
            magnetic="x"
            :gap="{ x: 24, y: 80 }"
            style="--van-floating-bubble-size: 48px"
            @click="onBubbleClick"
        />

        <!-- 股票搜尋組件 -->
        <StockSearch />
    </div>
</template>

<script setup>
    import { ref, reactive, onMounted } from 'vue';
    import { FloatingBubble, Swipe, SwipeItem, SwipeCell, Button, showToast } from 'vant';
    import StockSearch from '@/components/StockSearch.vue';
    import { useEventBus } from '@vueuse/core';

    // 事件總線
    const bus = useEventBus('stock-search');

    // 響應式數據
    const stockListRef = ref(null);
    const indicatorSwipeRef = ref(null);
    const currentIndicator = ref(0); // 0: 週KD, 1: RSI

    // 拖拽相關
    const dragIndex = ref(-1);
    const dragStartY = ref(0);
    const dragCurrentY = ref(0);
    const isDragging = ref(false);
    const longPressTimer = ref(null);

    // 模擬股票數據
    const stockList = ref([
        {
            id: '2330',
            name: '台積電',
            code: '2330',
            price: 1140.0,
            change: -1.72,
            changePercent: -0.15,
            weeklyKD: 22.6,
            rsi: 45.2,
        },
        {
            id: '2317',
            name: '鴻海',
            code: '2317',
            price: 135.0,
            change: 1.45,
            changePercent: 1.08,
            weeklyKD: 68.5,
            rsi: 62.1,
        },
        {
            id: '2454',
            name: '聯發科',
            code: '2454',
            price: 1350.0,
            change: -18.5,
            changePercent: -1.35,
            weeklyKD: 20.8,
            rsi: 38.9,
        },
        {
            id: '2881',
            name: '富邦金',
            code: '2881',
            price: 31.55,
            change: 0.35,
            changePercent: 1.12,
            weeklyKD: 72.3,
            rsi: 58.7,
        },
        {
            id: '0056',
            name: '元大高股息',
            code: '0056',
            price: 34.81,
            change: 0.02,
            changePercent: 0.06,
            weeklyKD: 55.4,
            rsi: 52.1,
        },
        {
            id: '1215',
            name: '卜蜂',
            code: '1215',
            price: 115.5,
            change: -0.5,
            changePercent: -0.43,
            weeklyKD: 56.87,
            rsi: 71.63,
        },
        {
            id: '2885',
            name: '元大金',
            code: '2885',
            price: 34.81,
            change: 0.06,
            changePercent: 0.17,
            weeklyKD: 73.16,
            rsi: 80.46,
        },
        {
            id: '2646',
            name: '星宇航空',
            code: '2646',
            price: 47.7,
            change: 0.5,
            changePercent: 1.06,
            weeklyKD: 54.87,
            rsi: 58.55,
        },
    ]);

    // 浮動按鈕點擊
    function onBubbleClick() {
        bus.emit(true);
    }

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

    function onBuyStock(stock) {
        showToast(`買賣 ${stock.name}`);
    }

    function onStrategyStock(stock) {
        showToast(`${stock.name} 策略設定`);
    }

    // 觸控事件處理 - 長按拖拽
    function onTouchStart(event, index) {
        const touch = event.touches[0];
        dragStartY.value = touch.clientY;
        dragCurrentY.value = touch.clientY;

        // 設置長按計時器
        longPressTimer.value = setTimeout(() => {
            if (!isDragging.value) {
                startDrag(index);
            }
        }, 500); // 500ms 長按
    }

    function onTouchMove(event) {
        if (longPressTimer.value) {
            const touch = event.touches[0];
            const deltaY = Math.abs(touch.clientY - dragStartY.value);

            // 如果移動超過 10px，取消長按
            if (deltaY > 10) {
                clearTimeout(longPressTimer.value);
                longPressTimer.value = null;
            }
        }

        if (isDragging.value) {
            event.preventDefault();
            const touch = event.touches[0];
            dragCurrentY.value = touch.clientY;

            // 計算新位置
            const deltaY = dragCurrentY.value - dragStartY.value;
            const newIndex = calculateNewIndex(dragIndex.value, deltaY);

            if (
                newIndex !== dragIndex.value &&
                newIndex >= 0 &&
                newIndex < stockList.value.length
            ) {
                // 交換位置
                const item = stockList.value.splice(dragIndex.value, 1)[0];
                stockList.value.splice(newIndex, 0, item);
                dragIndex.value = newIndex;
                dragStartY.value = dragCurrentY.value;
            }
        }
    }

    function onTouchEnd() {
        if (longPressTimer.value) {
            clearTimeout(longPressTimer.value);
            longPressTimer.value = null;
        }

        if (isDragging.value) {
            endDrag();
        }
    }

    function startDrag(index) {
        isDragging.value = true;
        dragIndex.value = index;
        showToast('長按拖拽模式');
    }

    function endDrag() {
        isDragging.value = false;
        dragIndex.value = -1;
        showToast('拖拽結束');
    }

    function calculateNewIndex(currentIndex, deltaY) {
        const rowHeight = 80; // 估算每行高度
        const steps = Math.round(deltaY / rowHeight);
        return Math.max(0, Math.min(stockList.value.length - 1, currentIndex + steps));
    }

    onMounted(() => {
        // 組件掛載後的初始化
    });
</script>

<style scoped>
    .stock-page {
        padding: 16px;
        background-color: #f5f5f5;
        min-height: 100vh;
        padding-bottom: 56px !important;
    }

    /* 標題欄 */
    .header {
        background: white;
        border-radius: 12px;
        margin-bottom: 16px;
        padding: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .header-title {
        font-size: 20px;
        font-weight: bold;
        color: #333;
        margin-bottom: 12px;
        text-align: center;
    }

    .header-columns {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid #eee;
    }

    .col-name {
        flex: 1;
        font-weight: bold;
        color: #666;
        font-size: 14px;
    }

    .col-indicator {
        flex: 1;
        text-align: center;
    }

    .indicator-swipe {
        height: 30px;
        background: #f8f9fa;
        border-radius: 15px;
        overflow: hidden;
    }

    .indicator-item {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #666;
        font-size: 14px;
        height: 100%;
        background: #f8f9fa;
    }

    /* 股票列表 */
    .stock-list {
        margin-top: 8px;
    }

    .stock-row {
        background: white;
        border-radius: 12px;
        margin-bottom: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
    }

    .stock-row.is-dragging {
        transform: scale(1.02);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10;
    }

    .stock-content {
        display: flex;
        align-items: center;
        padding: 16px;
        min-height: 80px;
    }

    /* 股票名稱欄 - 固定不動 */
    .stock-name {
        width: 162px;
        min-width: 162px;
        max-width: 162px;
        /* flex: none; 無論螢幕大小都會保持固定寬度。 */
        flex: none;
        padding-right: 16px;
    }

    .stock-name .name {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 2px;
    }

    .stock-name .code {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
    }

    .stock-name .price {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 2px;
    }

    .stock-name .change {
        font-size: 14px;
    }

    /* 價格顏色 */
    .price-up {
        color: #e74c3c;
    }

    .price-down {
        color: #27ae60;
    }

    .price-flat {
        color: #333;
    }

    /* 指標欄 - 可滑動 */
    .stock-indicator {
        flex: 1;
        height: 60px;
    }

    .indicator-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 8px;
    }

    .kd-indicator,
    .rsi-indicator {
        text-align: center;
        width: 100%;
    }

    .kd-value,
    .rsi-value {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 4px;
    }

    .kd-trend,
    .rsi-trend {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 10px;
        display: inline-block;
    }

    /* KD 指標顏色 */
    .kd-overbought {
        background-color: #fee;
        color: #e74c3c;
    }

    .kd-oversold {
        background-color: #efe;
        color: #27ae60;
    }

    .kd-normal {
        background-color: #f8f9fa;
        color: #666;
    }

    /* RSI 指標顏色 */
    .rsi-overbought {
        background-color: #fee;
        color: #e74c3c;
    }

    .rsi-oversold {
        background-color: #efe;
        color: #27ae60;
    }

    .rsi-normal {
        background-color: #f8f9fa;
        color: #666;
    }

    /* 左滑動作按鈕 */
    .action-buttons {
        display: flex;
        height: 100%;
        width: 120px;
    }

    .action-btn {
        flex: 1;
        height: 100%;
        margin: 0;
        border-radius: 0;
        font-size: 14px;
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

    /* 響應式設計 */
    @media (max-width: 480px) {
        .stock-page {
            padding: 12px;
        }

        .stock-content {
            padding: 12px;
        }

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
</style>

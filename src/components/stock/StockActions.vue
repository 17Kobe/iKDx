<template>
    <div class="stock-actions">
        <!-- 交易記錄 ActionSheet -->
        <ActionSheet
            v-model:show="tradeSheetVisible"
            title="交易記錄"
            cancel-text="關閉"
            class="trade-action-sheet"
        >
            <div class="sheet-content">
                <div class="sheet-header">
                    <h3>{{ stockInfo.name }} ({{ stockInfo.code }})</h3>
                    <p class="current-price">
                        現價：NT$ {{ currentPrice ? currentPrice.toLocaleString() : '--' }}
                    </p>
                </div>

                <!-- 新增交易按鈕 -->
                <div class="add-trade-section">
                    <Button type="primary" block @click="showAddTrade" icon="plus">
                        新增交易記錄
                    </Button>
                </div>

                <!-- 交易記錄列表 -->
                <div class="trade-list">
                    <div
                        v-for="trade in tradeRecords"
                        :key="trade.id"
                        class="trade-item"
                        @click="editTrade(trade)"
                    >
                        <div class="trade-info">
                            <div class="trade-type" :class="trade.type">
                                {{ trade.type === 'buy' ? '買入' : '賣出' }}
                            </div>
                            <div class="trade-details">
                                <p class="trade-date">{{ formatDate(trade.date) }}</p>
                                <p class="trade-amount">
                                    {{ trade.shares }}股 @ NT$ {{ trade.price }}
                                </p>
                            </div>
                        </div>
                        <div class="trade-total">
                            <span class="total-amount"
                                >NT$ {{ (trade.shares * trade.price).toLocaleString() }}</span
                            >
                        </div>
                    </div>

                    <div v-if="tradeRecords.length === 0" class="empty-trades">
                        <p>尚無交易記錄</p>
                        <Button type="primary" @click="showAddTrade">新增第一筆交易</Button>
                    </div>
                </div>

                <!-- 統計資訊 -->
                <div class="trade-summary" v-if="tradeRecords.length > 0">
                    <div class="summary-item">
                        <span class="label">持有股數</span>
                        <span class="value">{{ totalShares }}股</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">平均成本</span>
                        <span class="value">NT$ {{ averageCost.toFixed(2) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">損益</span>
                        <span
                            class="value"
                            :class="{ profit: profitLoss > 0, loss: profitLoss < 0 }"
                        >
                            {{ profitLoss > 0 ? '+' : '' }}NT$
                            {{ Math.abs(profitLoss).toLocaleString() }}
                        </span>
                    </div>
                </div>
            </div>
        </ActionSheet>

        <!-- 策略 ActionSheet -->
        <ActionSheet
            v-model:show="strategySheetVisible"
            title="投資策略"
            cancel-text="關閉"
            class="strategy-action-sheet"
        >
            <div class="sheet-content">
                <div class="sheet-header">
                    <h3>{{ stockInfo.name }} 策略設定</h3>
                </div>

                <!-- 策略列表 -->
                <div class="strategy-list">
                    <div class="strategy-item" @click="setStopLoss">
                        <div class="strategy-icon">🛡️</div>
                        <div class="strategy-info">
                            <h4>停損設定</h4>
                            <p>自動停損保護</p>
                        </div>
                        <div class="strategy-status">
                            <span v-if="strategies.stopLoss.enabled" class="enabled">已啟用</span>
                            <span v-else class="disabled">未設定</span>
                        </div>
                    </div>

                    <div class="strategy-item" @click="setTakeProfit">
                        <div class="strategy-icon">🎯</div>
                        <div class="strategy-info">
                            <h4>停利設定</h4>
                            <p>自動獲利了結</p>
                        </div>
                        <div class="strategy-status">
                            <span v-if="strategies.takeProfit.enabled" class="enabled">已啟用</span>
                            <span v-else class="disabled">未設定</span>
                        </div>
                    </div>

                    <div class="strategy-item" @click="setPriceAlert">
                        <div class="strategy-icon">🔔</div>
                        <div class="strategy-info">
                            <h4>價格提醒</h4>
                            <p>到價通知提醒</p>
                        </div>
                        <div class="strategy-status">
                            <span v-if="strategies.priceAlert.enabled" class="enabled"
                                >{{ strategies.priceAlert.alerts.length }}個提醒</span
                            >
                            <span v-else class="disabled">未設定</span>
                        </div>
                    </div>

                    <div class="strategy-item" @click="setAutoInvest">
                        <div class="strategy-icon">🔄</div>
                        <div class="strategy-info">
                            <h4>定期定額</h4>
                            <p>自動投資計劃</p>
                        </div>
                        <div class="strategy-status">
                            <span v-if="strategies.autoInvest.enabled" class="enabled">已啟用</span>
                            <span v-else class="disabled">未設定</span>
                        </div>
                    </div>
                </div>
            </div>
        </ActionSheet>

        <!-- 更多 ActionSheet -->
        <ActionSheet
            v-model:show="moreSheetVisible"
            title="更多選項"
            cancel-text="關閉"
            class="more-action-sheet"
        >
            <div class="sheet-content">
                <div class="more-list">
                    <div class="more-item" @click="viewAnalysis">
                        <div class="more-icon">📊</div>
                        <div class="more-info">
                            <h4>技術分析</h4>
                            <p>查看技術指標</p>
                        </div>
                    </div>

                    <div class="more-item" @click="viewNews">
                        <div class="more-icon">📰</div>
                        <div class="more-info">
                            <h4>相關新聞</h4>
                            <p>最新財經資訊</p>
                        </div>
                    </div>

                    <div class="more-item" @click="viewFinancials">
                        <div class="more-icon">📈</div>
                        <div class="more-info">
                            <h4>財務報表</h4>
                            <p>財務數據分析</p>
                        </div>
                    </div>

                    <div class="more-item" @click="addToWatchlist">
                        <div class="more-icon">⭐</div>
                        <div class="more-info">
                            <h4>{{ isInWatchlist ? '移除關注' : '加入關注' }}</h4>
                            <p>{{ isInWatchlist ? '從關注清單移除' : '加入自選股' }}</p>
                        </div>
                    </div>

                    <div class="more-item" @click="shareStock">
                        <div class="more-icon">📤</div>
                        <div class="more-info">
                            <h4>分享</h4>
                            <p>分享股票資訊</p>
                        </div>
                    </div>

                    <div class="more-item" @click="exportData">
                        <div class="more-icon">💾</div>
                        <div class="more-info">
                            <h4>匯出資料</h4>
                            <p>匯出交易記錄</p>
                        </div>
                    </div>

                    <div class="more-item danger" @click="deleteStockData">
                        <div class="more-icon">🗑️</div>
                        <div class="more-info">
                            <h4>刪除</h4>
                            <p>清除股票相關數據</p>
                        </div>
                    </div>
                </div>
            </div>
        </ActionSheet>

        <!-- 新增/編輯交易 ActionSheet -->
        <ActionSheet
            v-model:show="addTradeSheetVisible"
            :title="editingTrade ? '編輯交易' : '新增交易記錄'"
            cancel-text="取消"
        >
            <div class="trade-form">
                <Field
                    v-model="tradeForm.type"
                    label="交易類型"
                    readonly
                    @click="showTradeTypeSelector"
                    :placeholder="
                        tradeForm.type === 'buy'
                            ? '買入'
                            : tradeForm.type === 'sell'
                              ? '賣出'
                              : '請選擇'
                    "
                />
                <Field
                    v-model="tradeForm.shares"
                    label="股數"
                    type="number"
                    placeholder="請輸入股數"
                />
                <Field
                    v-model="tradeForm.price"
                    label="價格"
                    type="number"
                    placeholder="請輸入成交價格"
                />
                <Field v-model="tradeForm.date" label="交易日期" type="date" />
                <Field
                    v-model="tradeForm.note"
                    label="備註"
                    placeholder="選填"
                    type="textarea"
                    rows="2"
                />

                <div class="form-actions">
                    <Button type="primary" size="large" block @click="saveTrade" :loading="saving">
                        {{ editingTrade ? '更新' : '新增' }}
                    </Button>
                    <Button
                        v-if="editingTrade"
                        type="danger"
                        size="large"
                        block
                        plain
                        @click="deleteTrade"
                        style="margin-top: 12px"
                    >
                        刪除記錄
                    </Button>
                </div>
            </div>
        </ActionSheet>

        <!-- 交易類型選擇 -->
        <ActionSheet
            v-model:show="tradeTypeSheetVisible"
            title="選擇交易類型"
            :actions="tradeTypeActions"
            cancel-text="取消"
            @select="onTradeTypeSelect"
        />
    </div>
</template>

<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { ActionSheet, Button, Field, showDialog, showToast, showSuccessToast, showFailToast } from 'vant';
    import { useUserStockListStore } from '@/stores/user-stock-list-store.js';
    import { deleteUserStockInfo } from '@/services/user-stock-info-service.js';
    import { getDB } from '@/lib/idb.js';

    // Props
    const props = defineProps({
        stockInfo: {
            type: Object,
            required: true,
        },
    });

    // Store
    const userStockListStore = useUserStockListStore();

    // 響應式數據
    const tradeSheetVisible = ref(false);
    const strategySheetVisible = ref(false);
    const moreSheetVisible = ref(false);
    const addTradeSheetVisible = ref(false);
    const tradeTypeSheetVisible = ref(false);
    const editingTrade = ref(null);
    const saving = ref(false);
    const isInWatchlist = ref(false);

    // 計算當前股價（確保是數字）
    const currentPrice = computed(() => {
        if (!props.stockInfo) return 0;
        const price = props.stockInfo.price;
        if (typeof price === 'string') {
            const parsed = parseFloat(price);
            return isNaN(parsed) ? 0 : parsed;
        }
        return typeof price === 'number' ? price : 0;
    });

    // 表單數據
    const tradeForm = ref({
        type: '',
        shares: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
    });

    // 交易記錄 (根據股票ID獲取)
    const tradeRecords = ref([]);

    // 策略設定 (根據股票ID獲取)
    const strategies = ref({
        stopLoss: {
            enabled: false,
            price: 0,
            percentage: 10,
        },
        takeProfit: {
            enabled: false,
            price: 0,
            percentage: 15,
        },
        priceAlert: {
            enabled: false,
            alerts: [],
        },
        autoInvest: {
            enabled: false,
            amount: 10000,
            frequency: 'monthly',
        },
    });

    // 交易類型選項
    const tradeTypeActions = [
        { name: '買入', value: 'buy' },
        { name: '賣出', value: 'sell' },
    ];

    // 計算屬性
    const totalShares = computed(() => {
        return tradeRecords.value.reduce((total, trade) => {
            return trade.type === 'buy' ? total + trade.shares : total - trade.shares;
        }, 0);
    });

    const averageCost = computed(() => {
        const buyTrades = tradeRecords.value.filter(t => t.type === 'buy');
        const totalCost = buyTrades.reduce((sum, trade) => sum + trade.shares * trade.price, 0);
        const totalBuyShares = buyTrades.reduce((sum, trade) => sum + trade.shares, 0);
        return totalBuyShares > 0 ? totalCost / totalBuyShares : 0;
    });

    const profitLoss = computed(() => {
        if (!currentPrice.value || totalShares.value === 0) return 0;
        const currentValue = totalShares.value * currentPrice.value;
        const buyTrades = tradeRecords.value.filter(t => t.type === 'buy');
        const totalCost = buyTrades.reduce((sum, trade) => sum + trade.shares * trade.price, 0);
        const sellTrades = tradeRecords.value.filter(t => t.type === 'sell');
        const sellRevenue = sellTrades.reduce((sum, trade) => sum + trade.shares * trade.price, 0);
        return currentValue + sellRevenue - totalCost;
    });

    // 根據股票ID載入交易記錄
    function loadTradeRecords() {
        if (!props.stockInfo) return;
        const stockId = props.stockInfo.code || props.stockInfo.id;

        const savedRecords = localStorage.getItem(`tradeRecords_${stockId}`);
        if (savedRecords) {
            tradeRecords.value = JSON.parse(savedRecords);
        } else {
            // 示例數據（只對特定股票顯示）
            if (stockId === '2330') {
                tradeRecords.value = [
                    {
                        id: 1,
                        type: 'buy',
                        shares: 1000,
                        price: 550,
                        date: '2024-01-15',
                        note: '首次買入',
                    },
                    {
                        id: 2,
                        type: 'buy',
                        shares: 500,
                        price: 520,
                        date: '2024-02-10',
                        note: '加碼買入',
                    },
                ];
            } else {
                tradeRecords.value = [];
            }
        }
    }

    // 載入策略設定
    function loadStrategies() {
        if (!props.stockInfo) return;
        const stockId = props.stockInfo.code || props.stockInfo.id;
        const savedStrategies = localStorage.getItem(`strategies_${stockId}`);
        if (savedStrategies) {
            strategies.value = { ...strategies.value, ...JSON.parse(savedStrategies) };
        }
    }

    // 保存交易記錄到本地存儲
    function saveTradeRecords() {
        if (!props.stockInfo) return;
        const stockId = props.stockInfo.code || props.stockInfo.id;
        localStorage.setItem(`tradeRecords_${stockId}`, JSON.stringify(tradeRecords.value));
    }

    // 保存策略設定
    function saveStrategies() {
        if (!props.stockInfo) return;
        const stockId = props.stockInfo.code || props.stockInfo.id;
        localStorage.setItem(`strategies_${stockId}`, JSON.stringify(strategies.value));
    }

    // 格式化日期
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('zh-TW');
    }

    // 顯示交易記錄
    function showTradeSheet() {
        loadTradeRecords();
        tradeSheetVisible.value = true;
    }

    // 顯示策略設定
    function showStrategySheet() {
        loadStrategies();
        strategySheetVisible.value = true;
    }

    // 顯示更多選項
    function showMoreSheet() {
        moreSheetVisible.value = true;
    }

    // 新增交易
    function showAddTrade() {
        editingTrade.value = null;
        tradeForm.value = {
            type: '',
            shares: '',
            price: currentPrice.value > 0 ? currentPrice.value.toString() : '',
            date: new Date().toISOString().split('T')[0],
            note: '',
        };
        addTradeSheetVisible.value = true;
    }

    // 編輯交易
    function editTrade(trade) {
        editingTrade.value = trade;
        tradeForm.value = {
            type: trade.type,
            shares: trade.shares.toString(),
            price: trade.price.toString(),
            date: trade.date,
            note: trade.note || '',
        };
        tradeSheetVisible.value = false;
        addTradeSheetVisible.value = true;
    }

    // 顯示交易類型選擇器
    function showTradeTypeSelector() {
        tradeTypeSheetVisible.value = true;
    }

    // 選擇交易類型
    function onTradeTypeSelect(action) {
        tradeForm.value.type = action.value;
        tradeTypeSheetVisible.value = false;
    }

    // 儲存交易
    function saveTrade() {
        if (!tradeForm.value.type || !tradeForm.value.shares || !tradeForm.value.price) {
            showFailToast('請填寫必要欄位');
            return;
        }

        saving.value = true;

        try {
            const tradeData = {
                type: tradeForm.value.type,
                shares: parseInt(tradeForm.value.shares),
                price: parseFloat(tradeForm.value.price),
                date: tradeForm.value.date,
                note: tradeForm.value.note,
            };

            if (editingTrade.value) {
                // 更新現有交易
                const index = tradeRecords.value.findIndex(t => t.id === editingTrade.value.id);
                if (index !== -1) {
                    tradeRecords.value[index] = { ...tradeRecords.value[index], ...tradeData };
                }
                showSuccessToast('交易記錄已更新');
            } else {
                // 新增交易
                tradeData.id = Date.now();
                tradeRecords.value.push(tradeData);
                showSuccessToast('交易記錄已新增');
            }

            addTradeSheetVisible.value = false;
            saveTradeRecords(); // 保存到本地存儲
        } catch (error) {
            showFailToast('操作失敗');
        } finally {
            saving.value = false;
        }
    }

    // 刪除交易
    function deleteTrade() {
        showDialog({
            title: '確認刪除',
            message: '確定要刪除這筆交易記錄嗎？',
            showCancelButton: true,
            confirmButtonText: '刪除',
            cancelButtonText: '取消',
        })
            .then(() => {
                const index = tradeRecords.value.findIndex(t => t.id === editingTrade.value.id);
                if (index !== -1) {
                    tradeRecords.value.splice(index, 1);
                    showSuccessToast('交易記錄已刪除');
                    addTradeSheetVisible.value = false;
                    saveTradeRecords(); // 保存到本地存儲
                }
            })
            .catch(() => {
                // 取消刪除
            });
    }

    // 策略設定函數
    function setStopLoss() {
        showToast('停損設定功能開發中');
    }

    function setTakeProfit() {
        showToast('停利設定功能開發中');
    }

    function setPriceAlert() {
        showToast('價格提醒功能開發中');
    }

    function setAutoInvest() {
        showToast('定期定額功能開發中');
    }

    // 更多功能函數
    function viewAnalysis() {
        showToast('技術分析功能開發中');
    }

    function viewNews() {
        showToast('相關新聞功能開發中');
    }

    function viewFinancials() {
        showToast('財務報表功能開發中');
    }

    function addToWatchlist() {
        isInWatchlist.value = !isInWatchlist.value;
        showSuccessToast(isInWatchlist.value ? '已加入關注' : '已移除關注');
        moreSheetVisible.value = false;
    }

    function shareStock() {
        showToast('分享功能開發中');
    }

    function exportData() {
        showToast('匯出功能開發中');
    }

    // 刪除股票相關數據
    async function deleteStockData() {
        if (!props.stockInfo) return;

        const stockId = props.stockInfo.code || props.stockInfo.id;
        const stockName = props.stockInfo.name || stockId;

        // 二次確認對話框
        showDialog({
            title: '確認刪除',
            message: `確定要刪除「${stockName}」的所有相關數據嗎？\n\n此操作將清除：\n• Pinia Store 中的股票資料\n• IndexedDB 中的交易記錄\n• IndexedDB 中的價格數據\n\n此操作無法復原！`,
            showCancelButton: true,
            confirmButtonText: '刪除',
            confirmButtonColor: '#ee0a24',
            cancelButtonText: '取消',
        })
            .then(async () => {
                try {
                    // 1. 從 Pinia Store 中移除股票
                    const result = await userStockListStore.removeStockFromList(stockId);
                    if (!result.success) {
                        showFailToast(`從股票清單移除失敗：${result.message}`);
                        return;
                    }

                    // 2. 從 IndexedDB 中刪除 user-stock-info
                    await deleteUserStockInfo(stockId);

                    // 3. 從 IndexedDB 中刪除 user-stock-data
                    const db = await getDB();
                    await db.delete('user-stock-data', stockId);

                    // 關閉 ActionSheet
                    moreSheetVisible.value = false;

                    showSuccessToast(`已刪除「${stockName}」的所有相關數據`);
                } catch (error) {
                    console.error('刪除股票數據失敗:', error);
                    showFailToast('刪除失敗，請稍後再試');
                }
            })
            .catch(() => {
                // 用戶取消刪除
            });
    }

    // 暴露方法供父組件調用
    defineExpose({
        showTradeSheet,
        showStrategySheet,
        showMoreSheet,
    });

    // 組件掛載時載入資料
    onMounted(() => {
        loadTradeRecords();
        loadStrategies();
    });
</script>

<style scoped>
    /* ActionSheet 內容 */
    .sheet-content {
        padding: 0 20px 20px;
        max-height: 70vh;
        overflow-y: auto;
    }

    .sheet-header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #eee;
    }

    .sheet-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
    }

    .current-price {
        font-size: 16px;
        color: #1976d2;
        font-weight: 600;
        margin: 0;
    }

    /* 新增交易按鈕 */
    .add-trade-section {
        margin-bottom: 20px;
    }

    /* 交易記錄列表 */
    .trade-list {
        margin-bottom: 20px;
    }

    .trade-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .trade-item:hover {
        background: #e9ecef;
    }

    .trade-info {
        display: flex;
        align-items: center;
        flex: 1;
    }

    .trade-type {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
        min-width: 48px;
        text-align: center;
    }

    .trade-type.buy {
        background: #e8f5e8;
        color: #2e7d32;
    }

    .trade-type.sell {
        background: #ffebee;
        color: #c62828;
    }

    .trade-details p {
        margin: 0;
        line-height: 1.4;
    }

    .trade-date {
        font-size: 14px;
        color: #666;
    }

    .trade-amount {
        font-size: 12px;
        color: #999;
    }

    .trade-total {
        text-align: right;
    }

    .total-amount {
        font-size: 16px;
        font-weight: 600;
        color: #333;
    }

    /* 統計資訊 */
    .trade-summary {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .summary-item:last-child {
        margin-bottom: 0;
    }

    .summary-item .label {
        font-size: 14px;
        color: #666;
    }

    .summary-item .value {
        font-size: 16px;
        font-weight: 600;
        color: #333;
    }

    .summary-item .value.profit {
        color: #4caf50;
    }

    .summary-item .value.loss {
        color: #f44336;
    }

    /* 策略列表 */
    .strategy-list,
    .more-list {
        margin-top: 16px;
    }

    .strategy-item,
    .more-item {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .strategy-item:hover,
    .more-item:hover {
        background: #e9ecef;
    }

    .more-item.danger {
        border-top: 1px solid #fee;
        margin-top: 8px;
        padding-top: 20px;
    }

    .more-item.danger:hover {
        background: #ffebee;
    }

    .more-item.danger .more-info h4 {
        color: #f44336;
    }

    .more-item.danger .more-info p {
        color: #f44336;
        opacity: 0.8;
    }

    .strategy-icon,
    .more-icon {
        font-size: 24px;
        margin-right: 12px;
        width: 40px;
        text-align: center;
    }

    .strategy-info,
    .more-info {
        flex: 1;
    }

    .strategy-info h4,
    .more-info h4 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px 0;
    }

    .strategy-info p,
    .more-info p {
        font-size: 12px;
        color: #666;
        margin: 0;
    }

    .strategy-status {
        text-align: right;
    }

    .strategy-status .enabled {
        color: #4caf50;
        font-weight: 600;
        font-size: 12px;
    }

    .strategy-status .disabled {
        color: #999;
        font-size: 12px;
    }

    /* 空狀態 */
    .empty-trades {
        text-align: center;
        padding: 40px 20px;
        color: #999;
    }

    .empty-trades p {
        margin: 0 0 20px 0;
    }

    /* 表單樣式 */
    .trade-form {
        padding: 20px;
    }

    .form-actions {
        margin-top: 20px;
    }
</style>

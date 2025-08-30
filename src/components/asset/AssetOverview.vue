<template>
    <div class="asset-content">
        <!-- 圖表區域 -->
        <div class="charts-section">
            <!-- 第一列：2個圖表 -->
            <div class="chart-row">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>資產分布</h3>
                        <span class="chart-total">NT$ 1,234,567</span>
                    </div>
                    <div class="chart-container">
                        <canvas ref="assetPieChart" class="chart-canvas"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>月度趨勢</h3>
                        <span class="chart-period">近6個月</span>
                    </div>
                    <div class="chart-container">
                        <canvas ref="trendLineChart" class="chart-canvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- 第二列：2個圖表 -->
            <div class="chart-row">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>收支比例</h3>
                        <span class="chart-value">+12.5%</span>
                    </div>
                    <div class="chart-container">
                        <canvas ref="incomeChart" class="chart-canvas"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>投資回報</h3>
                        <span class="chart-return">+8.3%</span>
                    </div>
                    <div class="chart-container">
                        <canvas ref="returnChart" class="chart-canvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 資產列表區域 -->
        <div class="asset-list-section">
            <div class="section-header">
                <h3>我的資產</h3>
                <Button
                    type="primary"
                    size="small"
                    round
                    @click="showAddAsset"
                    icon="plus"
                >
                    新增資產
                </Button>
            </div>

            <!-- 資產卡片列表 -->
            <div class="asset-cards">
                <div
                    v-for="asset in assetList"
                    :key="asset.id"
                    class="asset-card"
                    @click="editAsset(asset)"
                >
                    <div class="asset-icon">
                        <Icon :icon="asset.icon" width="32" height="32" :color="asset.color" />
                    </div>
                    <div class="asset-info">
                        <h4>{{ asset.name }}</h4>
                        <p class="asset-type">{{ asset.type }}</p>
                    </div>
                    <div class="asset-value">
                        <span class="amount">{{ formatCurrency(asset.amount) }}</span>
                        <span class="change" :class="{ positive: asset.change > 0, negative: asset.change < 0 }">
                            {{ asset.change > 0 ? '+' : '' }}{{ asset.change.toFixed(2) }}%
                        </span>
                    </div>
                </div>

                <!-- 空狀態 -->
                <div v-if="assetList.length === 0" class="empty-state">
                    <Icon icon="mdi:wallet-outline" width="60" height="60" color="#ccc" />
                    <p>尚未添加任何資產</p>
                    <Button type="primary" @click="showAddAsset">新增第一個資產</Button>
                </div>
            </div>
        </div>

        <!-- 新增/編輯資產 ActionSheet -->
        <ActionSheet
            v-model:show="assetSheetVisible"
            :title="editingAsset ? '編輯資產' : '新增資產'"
            cancel-text="取消"
        >
            <div class="asset-form">
                <Field
                    v-model="assetForm.name"
                    label="資產名稱"
                    placeholder="請輸入資產名稱"
                    required
                />
                <Field
                    v-model="assetForm.type"
                    label="資產類型"
                    placeholder="請選擇資產類型"
                    readonly
                    @click="showTypeSelector"
                />
                <Field
                    v-model="assetForm.amount"
                    label="金額"
                    placeholder="請輸入金額"
                    type="number"
                />
                <Field
                    v-model="assetForm.description"
                    label="備註"
                    placeholder="選填"
                    type="textarea"
                    rows="2"
                />
                
                <div class="form-actions">
                    <Button
                        type="primary"
                        size="large"
                        block
                        @click="saveAsset"
                        :loading="saving"
                    >
                        {{ editingAsset ? '更新' : '新增' }}
                    </Button>
                    <Button
                        v-if="editingAsset"
                        type="danger"
                        size="large"
                        block
                        plain
                        @click="deleteAsset"
                        style="margin-top: 12px"
                    >
                        刪除資產
                    </Button>
                </div>
            </div>
        </ActionSheet>

        <!-- 資產類型選擇 -->
        <ActionSheet
            v-model:show="typeSheetVisible"
            title="選擇資產類型"
            :actions="assetTypes"
            cancel-text="取消"
            @select="onTypeSelect"
        />
    </div>
</template>

<script setup>
    import { ref, onMounted, nextTick } from 'vue';
    import { Button, ActionSheet, Field, showDialog, showToast } from 'vant';
    import { Icon } from '@iconify/vue';
    import { Chart, registerables } from 'chart.js';

    // 註冊 Chart.js 組件
    Chart.register(...registerables);

    // 響應式數據
    const assetSheetVisible = ref(false);
    const typeSheetVisible = ref(false);
    const editingAsset = ref(null);
    const saving = ref(false);

    // 圖表 refs
    const assetPieChart = ref(null);
    const trendLineChart = ref(null);
    const incomeChart = ref(null);
    const returnChart = ref(null);

    // 圖表實例
    let pieChartInstance = null;
    let lineChartInstance = null;
    let incomeChartInstance = null;
    let returnChartInstance = null;

    // 表單數據
    const assetForm = ref({
        name: '',
        type: '',
        amount: '',
        description: ''
    });

    // 資產列表
    const assetList = ref([
        {
            id: 1,
            name: '台積電',
            type: '股票',
            amount: 500000,
            change: 2.5,
            icon: 'mdi:chart-line',
            color: '#1976d2'
        },
        {
            id: 2,
            name: '富邦台50',
            type: 'ETF',
            amount: 300000,
            change: 1.2,
            icon: 'mdi:trending-up',
            color: '#388e3c'
        },
        {
            id: 3,
            name: '定期存款',
            type: '現金',
            amount: 200000,
            change: 0.8,
            icon: 'mdi:bank',
            color: '#ffa726'
        }
    ]);

    // 資產類型選項
    const assetTypes = [
        { name: '股票', value: '股票', icon: 'mdi:chart-line' },
        { name: 'ETF', value: 'ETF', icon: 'mdi:trending-up' },
        { name: '基金', value: '基金', icon: 'mdi:chart-pie' },
        { name: '債券', value: '債券', icon: 'mdi:chart-bar' },
        { name: '現金', value: '現金', icon: 'mdi:bank' },
        { name: '房地產', value: '房地產', icon: 'mdi:home' },
        { name: '其他', value: '其他', icon: 'mdi:dots-horizontal' }
    ];

    // 格式化貨幣
    function formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // 顯示新增資產
    function showAddAsset() {
        editingAsset.value = null;
        assetForm.value = {
            name: '',
            type: '',
            amount: '',
            description: ''
        };
        assetSheetVisible.value = true;
    }

    // 編輯資產
    function editAsset(asset) {
        editingAsset.value = asset;
        assetForm.value = {
            name: asset.name,
            type: asset.type,
            amount: asset.amount.toString(),
            description: asset.description || ''
        };
        assetSheetVisible.value = true;
    }

    // 顯示類型選擇器
    function showTypeSelector() {
        typeSheetVisible.value = true;
    }

    // 選擇資產類型
    function onTypeSelect(action) {
        assetForm.value.type = action.value;
        typeSheetVisible.value = false;
    }

    // 儲存資產
    async function saveAsset() {
        if (!assetForm.value.name || !assetForm.value.type || !assetForm.value.amount) {
            showToast.fail('請填寫必要欄位');
            return;
        }

        saving.value = true;

        try {
            const assetData = {
                name: assetForm.value.name,
                type: assetForm.value.type,
                amount: parseFloat(assetForm.value.amount),
                description: assetForm.value.description,
                change: Math.random() * 10 - 5, // 模擬變化
                icon: assetTypes.find(t => t.value === assetForm.value.type)?.icon || 'mdi:help',
                color: '#1976d2'
            };

            if (editingAsset.value) {
                // 更新現有資產
                const index = assetList.value.findIndex(a => a.id === editingAsset.value.id);
                if (index !== -1) {
                    assetList.value[index] = { ...assetList.value[index], ...assetData };
                }
                showToast.success('資產已更新');
            } else {
                // 新增資產
                assetData.id = Date.now();
                assetList.value.push(assetData);
                showToast.success('資產已新增');
            }

            assetSheetVisible.value = false;
            
            // 重新渲染圖表
            await nextTick();
            updateCharts();
        } catch (error) {
            showToast.fail('操作失敗');
        } finally {
            saving.value = false;
        }
    }

    // 刪除資產
    function deleteAsset() {
        showDialog({
            title: '確認刪除',
            message: '確定要刪除這個資產嗎？',
            showCancelButton: true,
            confirmButtonText: '刪除',
            cancelButtonText: '取消',
        })
            .then(() => {
                const index = assetList.value.findIndex(a => a.id === editingAsset.value.id);
                if (index !== -1) {
                    assetList.value.splice(index, 1);
                    showToast.success('資產已刪除');
                    assetSheetVisible.value = false;
                    updateCharts();
                }
            })
            .catch(() => {
                // 取消刪除
            });
    }

    // 初始化圖表
    function initCharts() {
        // 資產分布圓餅圖
        if (assetPieChart.value) {
            pieChartInstance = new Chart(assetPieChart.value, {
                type: 'doughnut',
                data: {
                    labels: ['股票', 'ETF', '現金', '其他'],
                    datasets: [{
                        data: [50, 30, 15, 5],
                        backgroundColor: ['#1976d2', '#388e3c', '#ffa726', '#f57c00'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // 趨勢線圖
        if (trendLineChart.value) {
            lineChartInstance = new Chart(trendLineChart.value, {
                type: 'line',
                data: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                    datasets: [{
                        data: [1000000, 1050000, 1020000, 1100000, 1180000, 1234567],
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            display: false
                        }
                    }
                }
            });
        }

        // 收支圓餅圖
        if (incomeChart.value) {
            incomeChartInstance = new Chart(incomeChart.value, {
                type: 'doughnut',
                data: {
                    labels: ['收入', '支出'],
                    datasets: [{
                        data: [60, 40],
                        backgroundColor: ['#4caf50', '#f44336'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // 投資回報柱狀圖
        if (returnChart.value) {
            returnChartInstance = new Chart(returnChart.value, {
                type: 'bar',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                        data: [5.2, 3.8, 8.1, 8.3],
                        backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0'],
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    // 更新圖表
    function updateCharts() {
        // 根據資產列表更新圖表數據
        // 這裡可以加入實際的數據計算邏輯
        console.log('更新圖表數據');
    }

    // 組件掛載後初始化圖表
    onMounted(async () => {
        await nextTick();
        initCharts();
    });
</script>

<style scoped>
    .asset-content {
        padding: 0;
        min-height: 100vh;
        background: #f5f5f5;
    }

    /* 圖表區域 */
    .charts-section {
        padding: 16px;
        background: white;
        margin-bottom: 8px;
    }

    .chart-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
    }

    .chart-row:last-child {
        margin-bottom: 0;
    }

    .chart-card {
        background: #fafafa;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #eee;
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .chart-header h3 {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0;
    }

    .chart-total {
        font-size: 12px;
        font-weight: 600;
        color: #1976d2;
    }

    .chart-period {
        font-size: 10px;
        color: #666;
    }

    .chart-value {
        font-size: 12px;
        font-weight: 600;
        color: #4caf50;
    }

    .chart-return {
        font-size: 12px;
        font-weight: 600;
        color: #ff9800;
    }

    .chart-container {
        height: 120px;
        position: relative;
    }

    .chart-canvas {
        width: 100% !important;
        height: 100% !important;
    }

    /* 資產列表區域 */
    .asset-list-section {
        background: white;
        padding: 16px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .section-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
    }

    .asset-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .asset-card {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #fafafa;
        border-radius: 12px;
        border: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s;
    }

    .asset-card:hover {
        background: #f0f0f0;
        border-color: #ddd;
    }

    .asset-card:active {
        transform: scale(0.98);
    }

    .asset-icon {
        margin-right: 12px;
        flex-shrink: 0;
    }

    .asset-info {
        flex: 1;
        min-width: 0;
    }

    .asset-info h4 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px 0;
    }

    .asset-type {
        font-size: 12px;
        color: #666;
        margin: 0;
    }

    .asset-value {
        text-align: right;
        flex-shrink: 0;
    }

    .amount {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 2px;
    }

    .change {
        font-size: 12px;
        font-weight: 500;
    }

    .change.positive {
        color: #4caf50;
    }

    .change.negative {
        color: #f44336;
    }

    /* 空狀態 */
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #999;
    }

    .empty-state p {
        margin: 16px 0 20px 0;
        font-size: 14px;
    }

    /* 表單樣式 */
    .asset-form {
        padding: 20px;
    }

    .form-actions {
        margin-top: 20px;
    }
</style>

<template>
  <div class="price-diff-page">
    <!-- 獲利損失表格 -->
    <div class="profit-table-section">
      <VantTable 
        :columns="tableColumns"
        :data="stockProfitData"
        :loading="loading"
        height="calc(100vh - 160px)"
        row-key="stockCode"
        @row-click="handleRowClick"
        @sort-change="handleSortChange"
      >
        <!-- 名稱欄位 -->
        <template #name="{ row, value }">
          <div class="stock-name-cell">
            <!-- <div class="stock-code">{{ row.stockCode || '未知代碼' }}</div> -->
            <div class="stock-name">{{ value || '未知股票' }}</div>
          </div>
        </template>

        <!-- 漲跌幅欄位 -->
        <template #changePercent="{ value }">
          <span 
            class="change-percent"
            :class="getChangeClass(value)"
          >
            {{ formatPercent(value) }}
          </span>
        </template>

        <!-- 本金欄位 -->
        <template #principal="{ value }">
          <span class="principal-amount">
            {{ formatCurrency(value) }}
          </span>
        </template>

        <!-- 報酬率欄位 -->
        <template #returnRate="{ value }">
          <span 
            class="return-rate"
            :class="getChangeClass(value)"
          >
            {{ formatPercent(value) }}
          </span>
        </template>

        <!-- 價差欄位 -->
        <template #priceDiff="{ value }">
          <span 
            class="price-diff"
            :class="getChangeClass(value)"
          >
            {{ formatCurrency(value) }}
          </span>
        </template>
      </VantTable>
    </div>

    <!-- 統計摘要 -->
    <div class="summary-section">
      <van-cell-group>
        <van-cell title="總本金" :value="formatCurrency(summary.totalPrincipal)" />
        <van-cell title="總市值" :value="formatCurrency(summary.totalMarketValue)" />
        <van-cell 
          title="總損益" 
          :value="formatCurrency(summary.totalProfitLoss)"
          :class="getChangeClass(summary.totalProfitLoss)"
        />
        <van-cell 
          title="總報酬率" 
          :value="formatPercent(summary.totalReturnRate)"
          :class="getChangeClass(summary.totalReturnRate)"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Cell as VanCell, CellGroup as VanCellGroup } from 'vant';
import { useUserStockListStore } from '../../stores/user-stock-list-store.js';
import VantTable from '../VantTable.vue';

export default {
  name: 'PriceDiff',
  components: {
    VantTable,
    VanCell,
    VanCellGroup,
  },
  setup() {
    const userStockListStore = useUserStockListStore();
    const loading = ref(false);

    // 表格欄位配置
    const tableColumns = [
      {
        key: 'name',
        title: '名稱',
        sortable: true,
        flex: '1.5',
        minWidth: '100px',
      },
      {
        key: 'changePercent',
        title: '漲跌幅',
        sortable: true,
        align: 'right',
        flex: '1',
        minWidth: '80px',
      },
      {
        key: 'principal',
        title: '本金',
        sortable: true,
        align: 'right',
        flex: '1.2',
        minWidth: '90px',
      },
      {
        key: 'returnRate',
        title: '報酬率',
        sortable: true,
        align: 'right',
        flex: '1',
        minWidth: '80px',
      },
      {
        key: 'priceDiff',
        title: '價差',
        sortable: true,
        align: 'right',
        flex: '1.2',
        minWidth: '90px',
      },
    ];

    // 計算股票獲利資料
    const stockProfitData = computed(() => {
      if (!userStockListStore.userStockList?.length) return [];

      return userStockListStore.userStockList.map(stock => {
        // 計算本金（買入價格 × 股數）
        const principal = (stock.buyPrice || 0) * (stock.shares || 0);
        
        // 計算市值（當前價格 × 股數）
        const marketValue = (stock.currentPrice || stock.price || 0) * (stock.shares || 0);
        
        // 計算價差（市值 - 本金）
        const priceDiff = marketValue - principal;
        
        // 計算報酬率
        const returnRate = principal > 0 ? (priceDiff / principal) : 0;
        
        // 計算漲跌幅
        const changePercent = stock.buyPrice > 0 ? 
          ((stock.currentPrice || stock.price || 0) - stock.buyPrice) / stock.buyPrice : 0;

        return {
          stockCode: stock.stockCode,
          name: stock.stockName || stock.name || stock.stockCode || '未知股票',
          changePercent,
          principal,
          returnRate,
          priceDiff,
          // 保留原始股票資料
          ...stock,
        };
      });
    });

    // 計算統計摘要
    const summary = computed(() => {
      const data = stockProfitData.value;
      
      const totalPrincipal = data.reduce((sum, item) => sum + item.principal, 0);
      const totalMarketValue = data.reduce((sum, item) => sum + item.principal + item.priceDiff, 0);
      const totalProfitLoss = data.reduce((sum, item) => sum + item.priceDiff, 0);
      const totalReturnRate = totalPrincipal > 0 ? totalProfitLoss / totalPrincipal : 0;

      return {
        totalPrincipal,
        totalMarketValue,
        totalProfitLoss,
        totalReturnRate,
      };
    });

    // 格式化百分比
    const formatPercent = (value) => {
      if (typeof value !== 'number' || isNaN(value)) return '-';
      return `${(value * 100).toFixed(2)}%`;
    };

    // 格式化貨幣
    const formatCurrency = (value) => {
      if (typeof value !== 'number' || isNaN(value)) return '-';
      return value.toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    // 獲取變化樣式類別
    const getChangeClass = (value) => {
      if (typeof value !== 'number' || isNaN(value)) return '';
      if (value > 0) return 'positive';
      if (value < 0) return 'negative';
      return '';
    };

    // 處理行點擊
    const handleRowClick = (row) => {
      console.log('點擊股票行：', row);
      // 可以在這裡添加導航到股票詳情頁的邏輯
    };

    // 處理排序變化
    const handleSortChange = (sortInfo) => {
      console.log('排序變化：', sortInfo);
    };

    return {
      loading,
      tableColumns,
      stockProfitData,
      summary,
      formatPercent,
      formatCurrency,
      getChangeClass,
      handleRowClick,
      handleSortChange,
    };
  },
};
</script>

<style scoped>
.price-diff-page {
  padding: 16px;
  background: var(--van-background);
  min-height: 100vh;
}

.profit-table-section {
  margin-bottom: 20px;
}

.stock-name-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stock-code {
  font-size: 11px;
  color: var(--van-text-color-2);
  font-weight: 500;
  line-height: 1.1;
}

.stock-name {
  font-size: 12px;
  color: var(--van-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}

.change-percent,
.return-rate,
.price-diff {
  font-weight: 500;
}

.principal-amount {
  font-weight: 500;
  color: var(--van-text-color);
}

.positive {
  color: #ee4f4f !important;
}

.negative {
  color: #07c160 !important;
}

.summary-section {
  margin-top: 20px;
}

.summary-section :deep(.van-cell__value.positive) {
  color: #ee4f4f;
}

.summary-section :deep(.van-cell__value.negative) {
  color: #07c160;
}

/* 行動裝置優化 */
@media (max-width: 768px) {
  .price-diff-page {
    padding: 12px;
  }

  .stock-code {
    font-size: 11px;
  }

  .stock-name {
    font-size: 12px;
  }
}
</style>

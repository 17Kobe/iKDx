<template>
    <div class="vant-table-wrapper">
        <!-- 固定表頭 -->
        <div class="table-header">
            <div class="header-row">
                <div 
                    v-for="column in columns" 
                    :key="column.key"
                    class="header-cell"
                    :style="{ 
                        width: column.width, 
                        minWidth: column.minWidth,
                        flexBasis: column.flex || 'auto'
                    }"
                    @click="handleSort(column)"
                >
                    <span class="cell-content">{{ column.title }}</span>
                    <van-icon 
                        v-if="column.sortable"
                        :name="getSortIcon(column.key)"
                        class="sort-icon"
                        :class="{ active: sortKey === column.key }"
                    />
                </div>
            </div>
        </div>

        <!-- 可滾動表格內容 -->
        <div 
            ref="tableBodyRef"
            class="table-body"
            :style="{ maxHeight: height }"
            @scroll="handleScroll"
        >
            <div 
                v-for="(row, rowIndex) in sortedData" 
                :key="getRowKey(row, rowIndex)"
                class="table-row"
                @click="handleRowClick(row, rowIndex)"
            >
                <div 
                    v-for="column in columns"
                    :key="column.key"
                    class="body-cell"
                    :style="{ 
                        width: column.width, 
                        minWidth: column.minWidth,
                        flexBasis: column.flex || 'auto'
                    }"
                    :class="column.align ? `text-${column.align}` : ''"
                >
                    <!-- 自定義插槽內容 -->
                    <slot 
                        :name="column.key" 
                        :row="row" 
                        :value="getValue(row, column.key)"
                        :index="rowIndex"
                        :column="column"
                    >
                        <span class="cell-content">
                            {{ formatValue(getValue(row, column.key), column) }}
                        </span>
                    </slot>
                </div>
            </div>

            <!-- 空狀態 -->
            <van-empty 
                v-if="sortedData.length === 0 && !loading"
                description="暫無資料"
                class="table-empty"
            />

            <!-- 載入狀態 -->
            <div v-if="loading" class="table-loading">
                <van-loading size="24px">載入中...</van-loading>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Icon as VanIcon, Empty as VanEmpty, Loading as VanLoading } from 'vant';
import _ from 'lodash';
import dayjs from 'dayjs';

export default {
    name: 'VantTable',
    components: {
        VanIcon,
        VanEmpty,
        VanLoading,
    },
    props: {
        // 表格列配置
        columns: {
            type: Array,
            required: true,
        },
        // 表格資料
        data: {
            type: Array,
            default: () => [],
        },
        // 表格高度
        height: {
            type: String,
            default: '400px',
        },
        // 載入狀態
        loading: {
            type: Boolean,
            default: false,
        },
        // 行鍵值函數
        rowKey: {
            type: [String, Function],
            default: 'id',
        },
    },
    emits: ['row-click', 'sort-change'],
    setup(props, { emit }) {
        const tableBodyRef = ref(null);
        
        // 排序狀態
        const sortKey = ref(null);
        const sortOrder = ref(null); // 'asc' | 'desc' | null

        /**
         * 獲取行鍵值
         */
        const getRowKey = (row, index) => {
            if (typeof props.rowKey === 'function') {
                return props.rowKey(row, index);
            }
            return row[props.rowKey] || index;
        };

        /**
         * 獲取欄位值
         */
        const getValue = (row, key) => {
            return _.get(row, key);
        };

        /**
         * 格式化欄位值
         */
        const formatValue = (value, column) => {
            if (value === null || value === undefined) return '-';
            
            switch (column.type) {
                case 'number':
                    return typeof value === 'number' ? 
                        value.toLocaleString('zh-TW', { minimumFractionDigits: column.decimal || 0 }) : 
                        value;
                case 'percent':
                    return typeof value === 'number' ? 
                        `${(value * 100).toFixed(column.decimal || 2)}%` : 
                        value;
                case 'currency':
                    return typeof value === 'number' ? 
                        `$${value.toLocaleString('zh-TW', { minimumFractionDigits: column.decimal || 0 })}` : 
                        value;
                default:
                    return column.formatter ? column.formatter(value) : value;
            }
        };

        /**
         * 處理排序
         */
        const handleSort = (column) => {
            if (!column.sortable) return;

            if (sortKey.value === column.key) {
                // 同一欄位：asc -> desc -> null
                if (sortOrder.value === 'asc') {
                    sortOrder.value = 'desc';
                } else if (sortOrder.value === 'desc') {
                    sortOrder.value = null;
                    sortKey.value = null;
                } else {
                    sortOrder.value = 'asc';
                }
            } else {
                // 不同欄位：直接設為 asc
                sortKey.value = column.key;
                sortOrder.value = 'asc';
            }

            emit('sort-change', {
                key: sortKey.value,
                order: sortOrder.value,
                column,
            });
        };

        /**
         * 獲取排序圖標
         */
        const getSortIcon = (key) => {
            if (sortKey.value !== key) return 'exchange';
            return sortOrder.value === 'asc' ? 'arrow-up' : 'arrow-down';
        };

        /**
         * 已排序的資料
         */
        const sortedData = computed(() => {
            if (!sortKey.value || !sortOrder.value) {
                return props.data;
            }

            return _.orderBy(props.data, [sortKey.value], [sortOrder.value]);
        });

        /**
         * 處理行點擊
         */
        const handleRowClick = (row, index) => {
            emit('row-click', row, index);
        };

        /**
         * 處理滾動
         */
        const handleScroll = _.throttle(() => {
            // 可以在這裡實現其他滾動相關功能
        }, 16);

        return {
            tableBodyRef,
            sortKey,
            sortOrder,
            sortedData,
            getRowKey,
            getValue,
            formatValue,
            handleSort,
            getSortIcon,
            handleRowClick,
            handleScroll,
        };
    },
};
</script>

<style scoped>
.vant-table-wrapper {
    border: 1px solid var(--van-border-color);
    border-radius: 8px;
    overflow: hidden;
    background: var(--van-background-2);
}

.table-header {
    background: var(--van-background);
    border-bottom: 1px solid var(--van-border-color);
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-row,
.table-row {
    display: flex;
    align-items: center;
}

.header-cell,
.body-cell {
    padding: 6px 4px;
    border-right: 1px solid var(--van-border-color);
    flex-shrink: 0;
    overflow: hidden;
    flex: 1;
}

.header-cell:last-child,
.body-cell:last-child {
    border-right: none;
}

.header-cell {
    font-weight: 600;
    font-size: 12px;
    color: var(--van-text-color);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.3s;
    min-height: 32px;
}

.header-cell:hover {
    background: var(--van-active-color);
}

.sort-icon {
    margin-left: 4px;
    font-size: 12px;
    color: var(--van-text-color-3);
    transition: color 0.3s;
}

.sort-icon.active {
    color: var(--van-primary-color);
}

.table-body {
    overflow-y: auto;
    overflow-x: hidden;
}

.table-row {
    border-bottom: 1px solid var(--van-border-color);
    cursor: pointer;
    transition: background-color 0.3s;
}

.table-row:hover {
    background: var(--van-active-color);
}

.table-row:last-child {
    border-bottom: none;
}

.body-cell {
    font-size: 12px;
    color: var(--van-text-color);
    min-height: 32px;
    display: flex;
    align-items: center;
}

.cell-content {
    word-break: break-all;
    line-height: 1.1;
    width: 100%;
}

/* 文字對齊 */
.text-left { justify-content: flex-start; }
.text-center { justify-content: center; }
.text-right { justify-content: flex-end; }

.table-empty,
.table-loading {
    padding: 40px 20px;
    text-align: center;
}

/* 行動裝置優化 */
@media (max-width: 768px) {
    .header-cell,
    .body-cell {
        padding: 8px 6px;
        font-size: 13px;
    }
    
    .cell-content {
        font-size: 13px;
    }
}
</style>

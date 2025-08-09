<template>
    <!-- 以 showSheet 控制顯示，移除 v-model:show -->
    <ShareSheet
        :show="showSheet"
        @update:show="bus.emit(false)"
        cancel-text="離開"
        :options="[]"
        style="--van-share-sheet-header-padding: 24px 24px 0 24px"
    >
        <template #title>
            <div
                style="
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    text-align: center;
                    margin-top: 0;
                    margin-bottom: 0;
                    color: #222;
                    line-height: 1.2;
                "
            >
                股票搜尋
            </div>
        </template>
        <template #description>
            <div style="display: flex; flex-direction: column; height: 100%; min-height: 60vh">
                <div style="flex: 1 1 auto">
                    <div>
                        <Search
                            ref="searchInputRef"
                            v-model="localSearch"
                            placeholder="請輸入股票名稱或代碼"
                            action-text=""
                            style="--van-search-input-height: 48px; font-size: 18px"
                            @search="onSearch"
                        />
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; margin: 0 0 10px 0">
                            <div
                                style="
                                    margin-left: 16px;
                                    font-size: 16px;
                                    color: #222;
                                    font-weight: bold;
                                    letter-spacing: 1px;
                                "
                            >
                                | 熱門股票
                            </div>
                        </div>
                        <div
                            style="
                                display: flex;
                                gap: 8px;
                                flex-wrap: wrap;
                                justify-content: center;
                                margin-bottom: 24px;
                            "
                        >
                            <span
                                v-for="tag in hotStocks"
                                :key="tag"
                                @click="onHotTagClick(tag)"
                                :style="getTagStyle(tag)"
                                >{{ tag }}</span
                            >
                        </div>
                        <!-- 搜尋結果卡片區塊 -->
                        <div v-if="localSearch && localSearch.length >= 1" style="margin-top: 12px">
                            <div v-if="searchResults.length">
                                <div
                                    v-for="item in searchResults"
                                    :key="item.id"
                                    style="
                                        background: #fff;
                                        border-radius: 12px;
                                        box-shadow: 0 2px 8px #0001;
                                        padding: 16px 20px;
                                        margin-bottom: 12px;
                                        display: flex;
                                        align-items: center;
                                        min-height: 56px;
                                    "
                                >
                                    <div
                                        style="
                                            font-size: 17px;
                                            font-weight: bold;
                                            color: #222;
                                            margin-right: 16px;
                                            min-width: 60px;
                                        "
                                    >
                                        {{ item.id }}
                                    </div>
                                    <div style="font-size: 16px; color: #333; flex: 1">
                                        {{ item.name }}
                                    </div>
                                    <Button
                                        :type="
                                            stockStore.isStockAdded(item.id) ? 'default' : 'primary'
                                        "
                                        size="small"
                                        :disabled="stockStore.isStockAdded(item.id)"
                                        @click="onAddStock(item)"
                                        style="margin-left: 12px; min-width: 60px"
                                    >
                                        {{ stockStore.isStockAdded(item.id) ? '已新增' : '新增' }}
                                    </Button>
                                </div>
                            </div>
                            <div v-else style="color: #999; text-align: center; margin-top: 16px">
                                查無資料
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ShareSheet>
</template>

<script setup>
    import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
    import { ShareSheet, Search, Button, showToast } from 'vant';
    import { getStocksFromDB } from '@/services/allStocksService';
    import { useEventBus } from '@vueuse/core';
    import { useStockStore } from '@/stores/stockStore.js';

    // 使用 Pinia store
    const stockStore = useStockStore();

    // 事件總線：控制顯示狀態
    const bus = useEventBus('stock-search');
    const showSheet = ref(false);

    onMounted(() => {
        bus.on(val => {
            showSheet.value = val;
        });
    });
    onUnmounted(() => {
        bus.reset();
    });

    const searchInputRef = ref();
    const localSearch = ref('');
    const searchResults = ref([]);

    const hotStocks = ['台積電', '鴻海', '聯發科', '長榮', '中鋼'];

    const tagBaseStyle = {
        background: '#fff',
        color: '#878787',
        borderRadius: '16px',
        padding: '4px 16px',
        fontSize: '15px',
        cursor: 'pointer',
        userSelect: 'none',
        fontWeight: '500',
        transition: 'background 0.2s, color 0.2s',
    };
    const tagActiveStyle = {
        background: '#ffe066',
        color: '#222',
        fontWeight: 'bold',
        boxShadow: '0 0 0 2px #ffe06688',
    };

    function getTagStyle(tag) {
        return localSearch.value === tag ? { ...tagBaseStyle, ...tagActiveStyle } : tagBaseStyle;
    }

    function focusSearchInput() {
        nextTick(() => {
            const input = searchInputRef.value?.$el?.querySelector('input');
            if (input) input.focus();
        });
    }

    // showSheet 開啟時自動 focus
    // 300ms 延遲是為了確保 ShareSheet 完全渲染後再 focus，但手機版因安全考量不生效
    watch(
        () => showSheet.value,
        val => {
            if (val) {
                setTimeout(() => {
                    focusSearchInput();
                }, 300);
            }
        }
    );

    // 搜尋股票
    watch(
        () => localSearch.value,
        async val => {
            console.log('localSearch 更新:', val);
            if (!val || val.length < 1) {
                searchResults.value = [];
                return;
            }
            console.log('觸發 getStocksFromDB');
            try {
                const allStocks = await getStocksFromDB();
                console.log('getStocksFromDB 執行成功');
                searchResults.value = allStocks.filter(
                    s => s.name.includes(val) || s.id.includes(val)
                );
                console.log('搜尋結果:', searchResults.value);
            } catch (error) {
                console.error('getStocksFromDB 執行失敗:', error);
            }
        }
    );

    function onSearch(val) {
        // 可選：按下搜尋按鈕時的額外行為
    }

    function onHotTagClick(tag) {
        console.log('點擊熱門標籤:', tag);
        localSearch.value = tag;
    }

    /**
     * 新增股票到使用者清單
     * @param {Object} stock - 股票資料 { id, name }
     */
    async function onAddStock(stock) {
        const result = await stockStore.addStock(stock);
        showToast({
            message: result.message,
            type: result.success ? 'success' : 'fail',
        });
    }
</script>

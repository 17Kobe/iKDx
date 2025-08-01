<template>
    <!-- 以 showSheet 控制顯示，移除 v-model:show -->
    <ShareSheet
        :show="showSheet"
        @update:show="bus.emit(false)"
        :options="[]"
        cancel-text=""
        style="--van-share-sheet-header-padding: 24px 24px 0 24px; min-height: 80vh; height: 80vh"
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
                        :style="{
                            background: localSearch === tag ? '#1976d2' : '#e3eafc',
                            color: localSearch === tag ? '#fff' : '#1976d2',
                            borderRadius: '16px',
                            padding: '4px 12px',
                            fontSize: '15px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontWeight: localSearch === tag ? 'bold' : 'normal',
                            boxShadow: localSearch === tag ? '0 0 0 2px #1976d233' : 'none',
                            transition: 'background 0.2s, color 0.2s',
                        }"
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
                            <div style="font-size: 16px; color: #333; flex: 1">{{ item.name }}</div>
                        </div>
                    </div>
                    <div v-else style="color: #999; text-align: center; margin-top: 16px">
                        查無資料
                    </div>
                </div>
            </div>
        </template>
    </ShareSheet>
</template>

<script setup>
    import { ref, watch, nextTick } from 'vue';
    import { ShareSheet, Search } from 'vant';
    import { getStocksFromDB } from '@/lib/stockService.js';
    import { useEventBus } from '@vueuse/core';

    // 事件總線：控制顯示狀態
    const bus = useEventBus('stock-search');
    const showSheet = ref(false);

    bus.on(val => {
        showSheet.value = val;
    });

    const searchInputRef = ref();
    const localSearch = ref('');
    const searchResults = ref([]);

    const hotStocks = [
        '台積電',
        '鴻海',
        '聯發科',
        '長榮',
        '中鋼',
    ];

    // showSheet 開啟時自動 focus
    watch(
        () => showSheet.value,
        val => {
            if (val) {
                nextTick(() => {
                    const input = searchInputRef.value?.$el?.querySelector('input');
                    if (input) input.focus();
                });
            }
        }
    );

    // 搜尋股票
    watch(
        () => localSearch.value,
        async val => {
            if (!val || val.length < 1) {
                searchResults.value = [];
                return;
            }
            const allStocks = await getStocksFromDB();
            searchResults.value = allStocks.filter(s => s.name.includes(val) || s.id.includes(val));
        }
    );

    function onSearch(val) {
        // 可選：按下搜尋按鈕時的額外行為
    }

    function onHotTagClick(tag) {
        localSearch.value = tag;
        nextTick(() => {
            const input = searchInputRef.value?.$el?.querySelector('input');
            if (input) input.focus();
        });
    }
</script>

<template>
    <div style="padding: 32px">
        自選股頁面324234234234234234324234234234
        <FloatingBubble
            icon="plus"
            axis="xy"
            magnetic="x"
            :gap="{ x: 24, y: 80 }"
            style="--van-floating-bubble-size: 48px"
            @click="showSheet = true"
        />
        <ShareSheet
            v-model:show="showSheet"
            :options="[]"
            cancel-text=""
            style="--van-share-sheet-header-padding: 24px 24px 0 24px; min-height: 60vh"
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
                        v-model="search"
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
                    <!-- 這裡可放熱門股票列表，暫以範例顯示 -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center">
                        <span
                            style="
                                background: #f2f3f5;
                                border-radius: 16px;
                                padding: 4px 12px;
                                font-size: 15px;
                            "
                            >台積電</span
                        >
                        <span
                            style="
                                background: #f2f3f5;
                                border-radius: 16px;
                                padding: 4px 12px;
                                font-size: 15px;
                            "
                            >鴻海</span
                        >
                        <span
                            style="
                                background: #f2f3f5;
                                border-radius: 16px;
                                padding: 4px 12px;
                                font-size: 15px;
                            "
                            >聯發科</span
                        >
                        <span
                            style="
                                background: #f2f3f5;
                                border-radius: 16px;
                                padding: 4px 12px;
                                font-size: 15px;
                            "
                            >長榮</span
                        >
                        <span
                            style="
                                background: #f2f3f5;
                                border-radius: 16px;
                                padding: 4px 12px;
                                font-size: 15px;
                            "
                            >中鋼</span
                        >
                    </div>
                </div>
            </template>
        </ShareSheet>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { FloatingBubble, ShareSheet, Search } from 'vant';

    const showSheet = ref(false);
    const search = ref('');

    function onSearch(val) {
        // 這裡寫搜尋邏輯
        console.log('搜尋', val);
    }
</script>

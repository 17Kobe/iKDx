<template>
    <div class="profit-page">
        <Tabs 
            v-model:active="activeTab" 
            swipeable 
            sticky
            @change="onTabChange"
            class="custom-tabs"
        >
            <Tab title="價差" name="price-diff">
                <PriceDiff />
            </Tab>
            <Tab title="股利" name="dividend">
                <Dividend />
            </Tab>
        </Tabs>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Tab, Tabs } from 'vant';
import PriceDiff from '@/components/profit/PriceDiff.vue';
import Dividend from '@/components/profit/Dividend.vue';

// Tab 狀態管理
const activeTab = ref('price-diff');

// Tab 切換事件
const onTabChange = (name) => {
    console.log('切換到：', name);
};
</script>

<style scoped>
.profit-page {
    height: 100%;
    background: var(--page-bg, #eff3f6);
}

.custom-tabs {
    height: 100%;
}

/* Vant Tabs 樣式自訂 */
:deep(.van-tabs__wrap) {
    position: sticky;
    top: 0;
    z-index: 99;
}
:deep(.van-tabs__nav) {
    background-color: var(--van-background-color);
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: flex-start;
    padding: 0 8px;
}
:deep(.van-tab) {
    min-width: 50px;
    padding: 0;
    font-size: 22px;
    line-height: 22px;
    color: #888;
    font-weight: 500;
    text-align: center;
    flex: none;
}
:deep(.van-tab--active) {
    color: #222;
    font-weight: 700;
}
:deep(.van-tabs__line) {
    background-color: #FFD600;
    height: 3px;
    border-radius: 2px;
    bottom: 6px;
}
</style>

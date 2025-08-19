<template>
    <div class="dividend-page">
        <Tabs 
            v-model:active="activeTab" 
            swipeable 
            sticky
            @change="onTabChange"
            class="custom-tabs"
        >
            <Tab title="資產" name="price-diff">
                <div class="tab-content">
                    <h3>資產內容</h3>
                    <p>這裡是資產相關的內容</p>
                </div>
            </Tab>
            <Tab title="預算" name="dividend">
                <div class="tab-content">
                    <h3>預算內容</h3>
                    <p>這裡是預算相關的內容</p>
                </div>
            </Tab>
        </Tabs>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Tab, Tabs } from 'vant'

// Tab 狀態管理
const activeTab = ref('price-diff')

// Tab 切換事件
const onTabChange = (name) => {
    console.log('切換到：', name)
}
</script>

<style scoped>
.dividend-page {
    height: 100%;
    background-color: var(--van-background-color);
}

.custom-tabs {
    height: 100%;
}

.tab-content {
    padding: 16px;
    min-height: 400px;
}

.tab-content h3 {
    margin: 0 0 16px 0;
    color: var(--van-text-color);
    font-size: 18px;
    font-weight: 600;
}

.tab-content p {
    margin: 0;
    color: var(--van-text-color-2);
    line-height: 1.6;
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

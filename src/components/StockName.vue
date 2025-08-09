<template>
    <div class="stock-name">
        <div class="stock-name-main">
            <div class="stock-name-left">
                <div class="name highlight">{{ name }}</div>
                <div class="code">{{ code }}</div>
                <div class="star-area">
                    <span class="star">★</span>
                </div>
            </div>
            <div class="stock-name-right">
                <div class="price" :class="priceClass">{{ price }}</div>
                <div class="change" :class="priceClass">
                    {{ change > 0 ? '+' : '' }}{{ change }} ({{ changePercent }}%)
                </div>
            </div>
        </div>
        <div class="stock-progress-bar">
            <div class="stock-progress-inner" :style="{ width: (progress || 0) + '%' }">
                <span class="progress-text">{{ progressText || ((progress || 0) + '%') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * 股票名稱區塊元件
 * Props:
 * - name: 股票名稱
 * - code: 股票代號
 * - price: 現價
 * - change: 漲跌
 * - changePercent: 漲跌幅
 * - priceClass: 價格顏色 class
 * - progress: 進度百分比
 * - progressText: 進度條顯示文字
 */
defineProps({
    name: String,
    code: String,
    price: [String, Number],
    change: [String, Number],
    changePercent: [String, Number],
    priceClass: String,
    progress: Number,
    progressText: String,
});
</script>

<style scoped>
.stock-name {
    width: 162px;
    min-width: 162px;
    max-width: 162px;
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 0 2px;
    box-sizing: border-box;
}
.stock-name-main {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    flex: 1;
    width: 100%;
}
.stock-name-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-width: 0;
}
.stock-name-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: 1;
    min-width: 0;
}
.stock-name-left .star-area {
    margin-top: 2px;
    margin-bottom: 0;
    min-height: 18px;
}
.star {
    color: #ffd700;
    font-size: 16px;
    margin-right: 2px;
    vertical-align: middle;
    display: inline-block;
}
.stock-name-left .name,
.stock-name-left .highlight {
    font-size: 16px;
    font-weight: bold;
    background: #1976d2;
    color: #fff;
    border-radius: 4px;
    padding: 0 8px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    letter-spacing: 1px;
}
.stock-name-left .code {
    font-size: 12px;
    color: #999;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.stock-name-right .price {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 2px;
}
.stock-name-right .change {
    font-size: 14px;
}
.stock-progress-bar {
    width: 100%;
    height: 18px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 2px;
    margin-bottom: 0;
    position: relative;
    display: flex;
    align-items: center;
}
.stock-progress-inner {
    height: 100%;
    background: linear-gradient(90deg, #ffe066 0%, #ffd700 100%);
    border-radius: 4px;
    transition: width 0.3s;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 8px;
}
.progress-text {
    color: #333;
    font-size: 13px;
    font-weight: bold;
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    pointer-events: none;
    letter-spacing: 1px;
}
</style>

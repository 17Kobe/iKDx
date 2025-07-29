<template>
    <div class="tabbar-progress-wrap">
        <div class="tabbar-progress-item" v-for="item in progressList" :key="item.label">
            <van-progress
                :percentage="item.percent"
                :color="item.color"
                :show-pivot="false"
                stroke-width="24"
                style="width: 100%"
            />
            <span class="tabbar-progress-label">{{ item.label }}</span>
        </div>
    </div>
</template>

<script setup>
    import { Progress as VanProgress } from 'vant';
    import { computed } from 'vue';

    // 傳入 progress 資訊陣列
    const props = defineProps({
        progressList: {
            type: Array,
            default: () => [
                {
                    percent: 75,
                    label: '75% 極貪婪',
                    color: 'linear-gradient(90deg, #7be495 60%, #bdf7b7 100%)',
                },
                {
                    percent: 100,
                    label: '31分 穩定',
                    color: 'linear-gradient(90deg, #bdf7b7 60%, #7be495 100%)',
                },
            ],
        },
    });
</script>

<style scoped>
    .tabbar-progress-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        margin: 0 8px;
        gap: 4px;
        min-width: 80px;
        max-width: 100px;
    }
    .tabbar-progress-item {
        position: relative;
        width: 100%;
        height: 24px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        padding: 0 0;
        overflow: hidden;
        border-radius: 16px;
        background: none;
    }
    .tabbar-progress-item :deep(.van-progress__track) {
        background: #e6f7e6 !important;
        border-radius: 16px !important;
        height: 24px !important;
    }
    .tabbar-progress-item :deep(.van-progress__portion) {
        border-radius: 16px !important;
        height: 24px !important;
    }
    .tabbar-progress-label {
        position: absolute;
        left: 12px;
        z-index: 2;
        font-size: 13px;
        color: #222;
        font-weight: 500;
        white-space: nowrap;
        margin-left: 2px;
        pointer-events: none;
    }
</style>

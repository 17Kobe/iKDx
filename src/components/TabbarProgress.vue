<template>
    <div class="tabbar-progress-wrap">
        <div class="tabbar-progress-item">
            <van-progress
                :percentage="progressList[0].percent"
                color="#ffe066"
                :show-pivot="false"
                stroke-width="24"
                style="width: 100%; height: 32px"
            />
            <span class="tabbar-progress-label">{{ progressList[0].label }}</span>
        </div>
    </div>
</template>

<script setup>
    import { Progress as VanProgress } from 'vant';
    import { useEventBus } from '@vueuse/core';
    import { ref, onMounted, onUnmounted } from 'vue';

    // 監聽 event bus
    const progressList = ref([
        {
            percent: 75,
            label: '75% 極貪婪',
        },
    ]);
    const progressBus = useEventBus('tabbar-progress');

    // 註冊監聽
    onMounted(() => {
        progressBus.on(val => {
            if (Array.isArray(val)) progressList.value = val;
        });
    });
    onUnmounted(() => {
        progressBus.reset();
    });
</script>

<style scoped>
    .tabbar-progress-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        margin: 0 8px;
        min-width: 80px;
        max-width: 100px;
    }
    .tabbar-progress-item {
        position: relative;
        width: 100%;
        height: 32px;
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: 16px;
        background: none;
    }
    .tabbar-progress-item :deep(.van-progress__track) {
        background: #ffe066 !important;
        border-radius: 16px !important;
        height: 32px !important;
    }
    .tabbar-progress-item :deep(.van-progress__portion) {
        border-radius: 16px !important;
        height: 32px !important;
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

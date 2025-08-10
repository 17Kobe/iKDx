<template>
    <div class="tabbar-progress-wrap">
        <div class="tabbar-progress-item" @click="handleProgressClick">
            <van-progress
                :percentage="percent"
                color="linear-gradient(90deg, #fff9c4 0%, #ffe066 100%)"
                :show-pivot="false"
                stroke-width="24"
                style="width: 100%; height: 32px"
            />
            <span class="tabbar-progress-label">{{ label }}</span>
        </div>
    </div>
</template>

<script setup>
    import { Progress as VanProgress, showToast, closeToast } from 'vant';
    import { ref, computed, onMounted } from 'vue';
    import { useGlobalStore } from '@/stores/globalStore.js';

    /**
     * percent: CNN 指數百分比
     * label: CNN 指數標籤
     * toastVisible: Toast 顯示狀態
     */

    // 取得 globalStore
    const globalStore = useGlobalStore();
    const percent = computed(() => globalStore.cnnIndex);
    const label = computed(() => globalStore.cnnLabel || 'N/A');
    let toastInstance = null;
    const toastVisible = ref(false);

    /**
     * 點擊 progress 顯示/關閉 CNN 指數說明 Toast
     */
    function handleProgressClick() {
        if (toastVisible.value) {
            closeToast();
            toastVisible.value = false;
            return;
        }
        showToast({
            message:
                'CNN 恐慌與貪婪指數說明\n' +
                `更新時間：${globalStore.cnnUpdateTimeLabel}\n` +
                '--------------------------------------\n' +
                '0～24　→　極恐慌：市場極度悲觀\n' +
                '25～44　→　恐懼：市場偏向保守\n' +
                '45～54　→　中性：市場情緒均衡\n' +
                '55～74　→　貪婪：市場較樂觀\n' +
                '75～100　→　極貪婪：市場可能過熱',
            duration: 0,
            overlay: true,
            closeOnClick: true,
            closeOnClickOverlay: true,
            className: 'cnn-toast',
            wordBreak: 'break-all',
            overlayStyle: { background: 'rgba(0,0,0,0)' },
            onClose: () => {
                toastVisible.value = false;
            },
        });
        toastVisible.value = true;
    }

    // 不再 fetchGlobal，資料由 App.vue 注入
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
        border: 1px solid #e0e0e0;
    }
    .tabbar-progress-item :deep(.van-progress__track) {
        background: linear-gradient(90deg, #fffde7 0%, #fff9c4 60%, #ffe066 100%) !important;
        border-radius: 16px !important;
        height: 32px !important;
    }
    .tabbar-progress-item :deep(.van-progress__portion) {
        border-radius: 16px !important;
        height: 32px !important;
    }
    .tabbar-progress-label {
        position: absolute;
        z-index: 2;
        font-size: 13px;
        color: #222;
        font-weight: 500;
        white-space: nowrap;
        margin-left: 6px;
        pointer-events: none;
    }
</style>

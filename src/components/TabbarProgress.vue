<template>
    <div class="tabbar-progress-wrap">
        <div class="tabbar-progress-item">
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
import { Progress as VanProgress } from 'vant';
import { ref, onMounted } from 'vue';
import axios from 'axios';

    const percent = ref(0);
    const label = ref('');

    async function fetchGlobal() {
        try {
            const base = import.meta.env.BASE_URL || '/';
            const url = base.endsWith('/') ? `${base}data/global.json` : `${base}/data/global.json`;
            const res = await axios.get(url);
            const data = res.data;
            percent.value = Math.round(Number(data.cnnIndex) || 0);
            let fearLevel = '';
            if (percent.value <= 24) {
                fearLevel = '極恐慌';
            } else if (percent.value <= 44) {
                fearLevel = '恐懼';
            } else if (percent.value <= 54) {
                fearLevel = '中性';
            } else if (percent.value <= 74) {
                fearLevel = '貪婪';
            } else {
                fearLevel = '極貪婪';
            }
            label.value = `${percent.value}% ${fearLevel}`;
        } catch (e) {
            percent.value = 0;
            label.value = 'N/A';
        }
    }

    onMounted(() => {
        fetchGlobal();
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

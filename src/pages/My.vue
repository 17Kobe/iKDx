<template>
    <div class="my-page" style="padding: 32px">
        <h2>我的頁面</h2>
        <div style="margin-bottom: 16px">
            <RadioGroup v-model="themeStore.mode" direction="horizontal">
                <Radio :name="0">跟隨系統</Radio>
                <Radio :name="1">亮</Radio>
                <Radio :name="2">暗</Radio>
            </RadioGroup>
        </div>
        <div style="margin-bottom: 24px">
            目前主題：<b>{{ themeStore.isDark ? '暗' : '亮' }}</b>
        </div>
        
        <!-- Worker Pool 監控組件 -->
        <WorkerMonitor />
    </div>
</template>

<script setup>
    import { useThemeStore } from '../stores/theme';
    import { RadioGroup, Radio } from 'vant';
    import WorkerMonitor from '../components/WorkerMonitor.vue';

    const themeStore = useThemeStore();
</script>

    <style scoped>
    .my-page {
        background: var(--page-bg, #eff3f6);
        min-height: 100%;
        box-sizing: border-box;
    }
    </style>

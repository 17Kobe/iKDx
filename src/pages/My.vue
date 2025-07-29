<template>
    <div style="padding: 32px">
        <h2>我的頁面</h2>
        <div style="margin-bottom: 16px">
            <RadioGroup v-model="themeStore.mode" direction="horizontal">
                <Radio :name="0">跟隨系統</Radio>
                <Radio :name="1">亮</Radio>
                <Radio :name="2">暗</Radio>
            </RadioGroup>
        </div>
        <div>
            目前主題：<b>{{ themeStore.isDark ? '暗' : '亮' }}</b>
        </div>
    </div>
</template>

<script setup>
    import { useThemeStore } from '../stores/theme';
    import { RadioGroup, Radio } from 'vant';
    const themeStore = useThemeStore();
</script>

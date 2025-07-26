<template>
    <router-view />
    <Tabbar v-model="active" @change="onTabChange">
        <TabbarItem icon="home-o">自選股</TabbarItem>
        <TabbarItem icon="search">價差股利</TabbarItem>
        <TabbarItem icon="friends-o">資產表</TabbarItem>
        <TabbarItem icon="plus">新增</TabbarItem>
    </Tabbar>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem } from 'vant';
    import { usePreferredDark } from '@vueuse/core';

    const router = useRouter();
    const route = useRoute();
    const active = ref(0);

    const tabRoutes = ['/', '/dividend', '/asset', '/add'];

    // 亮暗主題自動切換
    const isDark = usePreferredDark();
    watch(
        isDark,
        val => {
            document.body.classList.toggle('dark', val);
        },
        { immediate: true }
    );

    // 根據路由自動切換 active tab
    watch(
        () => route.path,
        val => {
            const idx = tabRoutes.indexOf(val);
            if (idx !== -1) active.value = idx;
        },
        { immediate: true }
    );

    function onTabChange(idx) {
        router.push(tabRoutes[idx]);
    }
</script>

<style scoped>
    html,
    body,
    #app {
        height: 100%;
        margin: 0;
        padding: 0;
    }
    body.dark {
        background: #18181c;
        color: #f6f6f6;
    }
    .van-tabbar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
    }
    .van-tabbar {
        background: #222 !important;
        border-top: 1px solid #333 !important;
    }
    .van-tabbar-item {
        color: #aaa !important;
    }
    .van-tabbar-item--active {
        color: #ffd700 !important;
    }
    body.dark .van-tabbar-item {
        background: #222 !important;
        color: #aaa !important;
    }
    body.dark .van-tabbar-item--active {
        color: #ffd700 !important;
    }
    body.dark .van-radio-group {
        background: #222 !important;
    }
    body.dark .van-radio {
        color: #ffd700 !important;
    }
</style>

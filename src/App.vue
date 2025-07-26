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

    const router = useRouter();
    const route = useRoute();
    const active = ref(0);

    const tabRoutes = ['/', '/dividend', '/asset', '/add'];

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
    .van-tabbar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>

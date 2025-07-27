<template>
    <div :class="{ dark: isDark }" style="min-height: 100vh">
        <router-view />
        <Tabbar v-model="active" @change="onTabChange">
            <TabbarItem icon="home-o">自選股</TabbarItem>
            <TabbarItem icon="search">價差股利</TabbarItem>
            <TabbarItem icon="friends-o">資產表</TabbarItem>
            <TabbarItem icon="plus">新增</TabbarItem>
        </Tabbar>
    </div>
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

    const isDark = usePreferredDark();

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

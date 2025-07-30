<template>
    <div :class="{ dark: isDark }" class="app-container">
        <div class="main-content">
            <router-view v-slot="{ Component, route }">
                <transition name="slide-left">
                    <component :is="Component" :key="route.path" />
                </transition>
            </router-view>
        </div>
        <FloatingBubble
            v-if="showFloatingBubble"
            icon="plus"
            axis="xy"
            magnetic="x"
            :gap="{ x: 24, y: 70 }"
            style="--van-floating-bubble-size: 48px"
            @click="onBubbleClick"
        />
        <Tabbar v-model="active" @change="onTabChange">
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="active === 0 ? 'flowbite:star-solid' : 'flowbite:star-outline'"
                        width="26"
                        height="26"
                    />
                    <span>自選股</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="
                            active === 1
                                ? 'ri:money-dollar-circle-fill'
                                : 'ri:money-dollar-circle-line'
                        "
                        width="26"
                        height="26"
                    />
                    <span>價差股利</span>
                </div>
            </TabbarItem>
            <!-- Progress Bar 區塊（已封裝元件） -->
            <TabbarProgress :progress-list="progressList" />
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="
                            active === 2
                                ? 'basil:chart-pie-alt-solid'
                                : 'basil:chart-pie-alt-outline'
                        "
                        width="26"
                        height="26"
                    />
                    <span>資產表</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="
                            active === 3 ? 'fluent:person-24-filled' : 'fluent:person-24-regular'
                        "
                        width="26"
                        height="26"
                    />
                    <span>我的</span>
                </div>
            </TabbarItem>
        </Tabbar>
    </div>
</template>

<script setup>
    import { ref, watch, computed } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem, FloatingBubble } from 'vant';
    import TabbarProgress from '@/components/TabbarProgress.vue';
    // 進度條資料，可依需求調整
    const progressList = [
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
    ];
    import { Icon } from '@iconify/vue';
    import { usePreferredDark } from '@vueuse/core';

    const router = useRouter();
    const route = useRoute();
    const active = ref(0);

    const tabRoutes = ['/', '/dividend', '/asset', '/my'];

    const isDark = usePreferredDark();

    // 計算是否顯示 FloatingBubble - 只在自選股和股利價差頁面顯示
    const showFloatingBubble = computed(() => {
        return route.path === '/' || route.path === '/dividend';
    });

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

    function onBubbleClick() {
        router.push('/add');
    }
</script>

<style scoped>
    .app-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .main-content {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 70px; /* 為 Tabbar 留空間 */
        position: relative; /* 為頁面切換動畫提供定位基準 */
    }

    /* Progress Bar 樣式已移至 TabbarProgress.vue */
    .tabbar-icon-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        line-height: 1;
    }
    .tabbar-icon-wrap span {
        font-size: 14px;
        margin-bottom: 7px;
    }

    /* 頁面切換動畫 - 新頁面從右側滑入，舊頁面向左移出50px，同時進行 */
    .slide-left-enter-active,
    .slide-left-leave-active {
        transition: transform 0.35s ease-in-out;
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        height: 100%;
    }

    .slide-left-enter-from {
        transform: translateX(100%); /* 新頁面從右側進入 */
    }

    .slide-left-leave-to {
        transform: translateX(-100px); /* 舊頁面向左移出100px */
    }

    .slide-left-enter-to,
    .slide-left-leave-from {
        transform: translateX(0);
    }
</style>

<template>
    <div class="app-container" :class="{ dark: isDark }">
        <div class="main-content">
            <router-view v-slot="{ Component, route }">
                <transition :name="firstLoad ? '' : 'slide-left'">
                    <component :is="Component" :key="route.path" />
                </transition>
            </router-view>
        </div>
        <Tabbar v-model="active" @change="onTabChange" class="custom-tabbar">
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="active === 0 ? 'flowbite:star-solid' : 'flowbite:star-outline'"
                        width="28"
                        height="28"
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
                        width="28"
                        height="28"
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
                        width="28"
                        height="28"
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
                        width="28"
                        height="28"
                    />
                    <span>我的</span>
                </div>
            </TabbarItem>
        </Tabbar>
    </div>
</template>

<script setup>
    import { ref, watch, onMounted, onBeforeUnmount, watchEffect } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem } from 'vant';
    import { useWindowSize } from '@vueuse/core';
    import TabbarProgress from '@/components/TabbarProgress.vue';
    // 移除 JS 動態高度，改用 CSS 100dvh

    // const { height } = useWindowSize();
    // onMounted(() => {
    //     watchEffect(() => {
    //         document.documentElement.style.setProperty('--app-height', `${height.value}px`);
    //     });
    // });
    onMounted(() => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    });

    // 進度條資料，可依需求調整
    const progressList = [
        {
            percent: 76,
            label: '76% 極貪婪',
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
    const firstLoad = ref(true);

    const tabRoutes = ['/', '/dividend', '/asset', '/my'];

    const isDark = usePreferredDark();

    let firstWatch = true;
    watch(
        () => route.path,
        val => {
            const idx = tabRoutes.indexOf(val);
            if (idx !== -1) active.value = idx;
            if (firstLoad.value && !firstWatch) firstLoad.value = false;
            firstWatch = false;
        },
        { immediate: true }
    );

    function onTabChange(idx) {
        router.push(tabRoutes[idx]);
    }
</script>

<style scoped>
    html,
    body {
        margin: 0;
        padding: 0;
        height: 100dvh; /* ✅ 確保 wrapper 能拿到正確高度 */
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        /* -webkit-overflow-scrolling: touch; */
    }

    .app-container {
        width: 100%;
        /* min-height: var(--app-height); 用 vueUse 去取得視窗大小，chrome 會有抖動。 */
        /* min-height: 100vh; min-height 讓內容至少撐滿可視區域，但不會超出，工具列可隱藏，100vh 及 100dvh 都會有 chrome 會有抖動。 */
        height: 100dvh; /* 加此tabbar 換頁整個高度會一致不會只有新頁的高(如此會很短)，但加此手機就不隱藏工具列 */
        overflow-x: hidden; /* 避免出現橫向捲軸 */

        /* overflow: hidden; */
        /* min-height: 100dvh; */
        /* overflow: hidden; */
        /* padding-bottom: 60px; */
        /* display: flex;
        flex-direction: column;
        overflow: hidden; */
    }

    .main-content {
        position: relative; /* 讓動畫層不會超出父層。 */
        /* flex: 1; */
        /* overflow-y: auto; */
        /* 為 Tabbar padding-bottom: 60px; 留空間 */
        /* position: relative; 為頁面切換動畫提供定位基準 */
        /* height: 100vh; 設定高度為 100vh */
        /* min-height: 100dvh; 新瀏覽器支援，舊瀏覽器自動 fallback */
        padding-bottom: 60px;
        /* overflow: hidden; */
        /* overflow-y: auto; */
    }

    /* Progress Bar 樣式已移至 TabbarProgress.vue */
    .tabbar-icon-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #959698;
        height: 100%;
        width: 100%;
        line-height: 1;
    }

    .tabbar-icon-wrap span {
        font-size: 14px; /* 從 16px 改為 14px */
        margin-top: 4px; /* 增加圖標與文字的間距 */
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

    /* 自定義 Tabbar 高度 */
    .custom-tabbar {
        height: 60px !important;
        border-top: 1px solid #ebedf0 !important;
        background: rgba(255, 255, 255, 0.95);
        /* backdrop-filter: blur(1px); */
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
        z-index: 100;
        /* position: absolute;
        bottom: 0; */
        /* bottom: 10px; */
    }

    /* 讓 Tabbar 的 active item 也有透明度 */
    .van-tabbar-item--active .tabbar-icon-wrap {
        color: #fae54c !important;
    }
    .van-tabbar-item--active .tabbar-icon-wrap span {
        color: #222 !important;
    }
</style>

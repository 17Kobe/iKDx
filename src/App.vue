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
            <TabbarProgress />
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
                    <span>資產收支</span>
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
    import { useGlobalStore } from '@/stores/global-store.js';
    import axios from '@/lib/axios';
    // 取得 globalStore
    const globalStore = useGlobalStore();

    // 取得 CNN 指數資料
    async function fetchGlobal() {
        try {
            const res = await axios.get('data/global.json');
            globalStore.setGlobal(res.data);
        } catch (e) {
            globalStore.reset();
        }
    }
    // 移除 JS 動態高度，改用 CSS 100dvh

    // const { height } = useWindowSize();
    onMounted(() => {
        fetchGlobal();
    });
    onMounted(() => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    });

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
        position: relative;
        padding-bottom: 60px;
        /* 不再用 padding-bottom 撐高度，避免底部多出空白 */
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

    /* 過場動畫：兩頁並存，但高度/寬度固定不被擠壓 */
    .slide-left-enter-active {
        transition: transform 0.3s ease-in-out;
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 2;
        padding-right: 6px; /* 已加上 padding-right: 6px，確保動畫期間的頁面和正常狀態下有相同的右側 padding，避免 KD 圖寬度跳動。 */
        box-sizing: border-box; /* 已加上 padding-right: 6px，確保動畫期間的頁面和正常狀態下有相同的右側 padding，避免 KD 圖寬度跳動。 */
    }
    .slide-left-leave-active {
        transition: transform 0.3s ease-in-out;
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 1;
        padding-right: 6px; /* 已加上 padding-right: 6px，確保動畫期間的頁面和正常狀態下有相同的右側 padding，避免 KD 圖寬度跳動。 */
        box-sizing: border-box; /* 已加上 padding-right: 6px，確保動畫期間的頁面和正常狀態下有相同的右側 padding，避免 KD 圖寬度跳動。 */
    }

    /* 進入頁：從右側滑入 */
    .slide-left-enter-from {
        transform: translateX(100%);
    }
    .slide-left-enter-to {
        transform: translateX(0);
    }

    /* 離開頁：完全移出視窗，避免殘影和變型 */
    .slide-left-leave-from {
        transform: translateX(0);
    }
    .slide-left-leave-to {
        transform: translateX(-100%);
    }

    /* 自定義 Tabbar 高度 */
    .custom-tabbar {
        height: 60px !important;
        border-top: 1px solid #ebedf0 !important;
        background: rgba(255, 255, 255, 0.97);
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
        z-index: 100;
    }

    /* 讓 Tabbar 的 active item 也有透明度 */
    .van-tabbar-item--active .tabbar-icon-wrap {
        color: #fae54c !important;
    }
    .van-tabbar-item--active .tabbar-icon-wrap span {
        color: #222 !important;
    }
</style>

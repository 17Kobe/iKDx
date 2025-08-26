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
                    <!-- 僅此處改 SVG 寫法 -->
                    <template v-if="active === 0">
                        <!-- active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#fae54c"
                                d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937l-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39l3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36z"
                            />
                        </svg>
                    </template>
                    <template v-else>
                        <!-- 非 active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="none"
                                stroke="#959698"
                                stroke-width="2"
                                d="M11.083 5.104c.35-.8 1.485-.8 1.834 0l1.752 4.022a1 1 0 0 0 .84.597l4.463.342c.9.069 1.255 1.2.556 1.771l-3.33 2.723a1 1 0 0 0-.337 1.016l1.03 4.119c.214.858-.71 1.552-1.474 1.106l-3.913-2.281a1 1 0 0 0-1.008 0L7.583 20.8c-.764.446-1.688-.248-1.474-1.106l1.03-4.119A1 1 0 0 0 6.8 14.56l-3.33-2.723c-.698-.571-.342-1.702.557-1.771l4.462-.342a1 1 0 0 0 .84-.597z"
                            />
                        </svg>
                    </template>
                    <span>自選股</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <!-- 僅此處改 SVG 寫法 -->
                    <template v-if="active === 1">
                        <!-- active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#fae54c"
                                d="M12.005 22.003c-5.523 0-10-4.477-10-10s4.477-10 10-10s10 4.477 10 10s-4.477 10-10 10m-3.5-8v2h2.5v2h2v-2h1a2.5 2.5 0 1 0 0-5h-4a.5.5 0 1 1 0-1h5.5v-2h-2.5v-2h-2v2h-1a2.5 2.5 0 1 0 0 5h4a.5.5 0 0 1 0 1z"
                            />
                        </svg>
                    </template>
                    <template v-else>
                        <!-- 非 active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#959698"
                                d="M12.005 22.003c-5.523 0-10-4.477-10-10s4.477-10 10-10s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m-3.5-6h5.5a.5.5 0 1 0 0-1h-4a2.5 2.5 0 1 1 0-5h1v-2h2v2h2.5v2h-5.5a.5.5 0 0 0 0 1h4a2.5 2.5 0 0 1 0 5h-1v2h-2v-2h-2.5z"
                            />
                        </svg>
                    </template>
                    <span>價差股利</span>
                </div>
            </TabbarItem>
            <!-- Progress Bar 區塊（已封裝元件） -->
            <TabbarProgress />
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <!-- 僅此處改 SVG 寫法 -->
                    <template v-if="active === 2">
                        <!-- active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#fae54c"
                                d="M21.938 10.002a8.004 8.004 0 0 0-6.94-6.94C14.45 2.993 14 3.448 14 4v6.5a.5.5 0 0 0 .5.5H21c.552 0 1.007-.45.938-.998"
                            />
                            <path
                                fill="#fae54c"
                                d="M12 4.5a8.5 8.5 0 1 0 8.5 8.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 1-.5-.5V5a.5.5 0 0 0-.5-.5"
                            />
                        </svg>
                    </template>
                    <template v-else>
                        <!-- 非 active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <g fill="#959698" fill-rule="evenodd" clip-rule="evenodd">
                                <path
                                    d="M11.25 5.788a7.251 7.251 0 1 0 7.962 7.962H12a.75.75 0 0 1-.75-.75zM3.25 13A8.75 8.75 0 0 1 12 4.25a.75.75 0 0 1 .75.75v7.25H20a.75.75 0 0 1 .75.75a8.75 8.75 0 1 1-17.5 0"
                                />
                                <path
                                    d="M15.5 4.674V9.5h4.826A6.51 6.51 0 0 0 15.5 4.674m-.502-1.612c3.62.45 6.49 3.32 6.94 6.94c.069.548-.386.998-.938.998h-6.5a.5.5 0 0 1-.5-.5V4c0-.552.45-1.007.998-.938"
                                />
                            </g>
                        </svg>
                    </template>
                    <span>資產收支</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <!-- 僅此處改 SVG 寫法 -->
                    <template v-if="active === 3">
                        <!-- active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#fae54c"
                                d="M17.755 14a2.25 2.25 0 0 1 2.248 2.25v.918a2.75 2.75 0 0 1-.512 1.598c-1.546 2.164-4.07 3.235-7.49 3.235c-3.422 0-5.945-1.072-7.487-3.236a2.75 2.75 0 0 1-.51-1.596v-.92A2.25 2.25 0 0 1 6.253 14zM12 2.005a5 5 0 1 1 0 10a5 5 0 0 1 0-10"
                            />
                        </svg>
                    </template>
                    <template v-else>
                        <!-- 非 active 狀態 SVG -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28px"
                            height="28px"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#959698"
                                d="M17.755 14a2.25 2.25 0 0 1 2.248 2.25v.575c0 .894-.32 1.759-.9 2.438c-1.57 1.833-3.957 2.738-7.103 2.738s-5.532-.905-7.098-2.74a3.75 3.75 0 0 1-.898-2.434v-.578A2.25 2.25 0 0 1 6.253 14zm0 1.5H6.252a.75.75 0 0 0-.75.75v.577c0 .535.192 1.053.54 1.46c1.253 1.469 3.22 2.214 5.957 2.214c2.739 0 4.706-.745 5.963-2.213a2.25 2.25 0 0 0 .54-1.463v-.576a.75.75 0 0 0-.748-.749M12 2.005a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 1.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7"
                            />
                        </svg>
                    </template>
                    <span>我的</span>
                </div>
            </TabbarItem>
        </Tabbar>
    </div>
</template>

<script setup>
    import { ref, watch, onMounted } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem } from 'vant';
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
            // if (idx !== -1) active.value = idx;
            if (firstLoad.value && !firstWatch) firstLoad.value = false;
            firstWatch = false;
        },
        { immediate: true }
    );

    function onTabChange(idx) {
        active.value = idx; // 立即切換 active 狀態
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

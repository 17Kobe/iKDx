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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28px"
                        height="28px"
                        viewBox="0 0 24 24"
                    >
                        <g transform="scale(0.9,0.9) translate(3,3)">
                            <path
                                :fill="active === 0 ? '#fae54c' : 'none'"
                                stroke= '#959698'
                                stroke-width="1"
                                d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937l-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39l3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36z"
                            />
                        </g>
                    </svg>
                    <span>自選股</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28px"
                        height="28px"
                        viewBox="0 0 24 24"
                    >
                        <g
                            fill="none"
                            stroke= '#959698'
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1"
                            transform="translate(0,2)"
                        >
                            <path
                                :fill="active === 1 ? '#fae54c' : 'none'"
                                d="M9.5 3h5A1.5 1.5 0 0 1 16 4.5A3.5 3.5 0 0 1 12.5 8h-1A3.5 3.5 0 0 1 8 4.5A1.5 1.5 0 0 1 9.5 3"
                            />
                            <path 
                            :fill="active === 1 ? '#fae54c' : 'none'"
                            d="M4 17v-1a8 8 0 1 1 16 0v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4" />
                        </g>
                    </svg>

                    <span>價差股利</span>
                </div>
            </TabbarItem>
            <!-- Progress Bar 區塊（已封裝元件） -->
            <TabbarProgress />
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28px"
                        height="28px"
                        viewBox="0 0 24 24"
                    >
                        <!-- 圓餅底（放大半徑並微調下移） -->
                        <circle
                            cx="12"
                            cy="13"
                            r="9"
                            :fill="active === 2 ? '#fae54c' : 'none'"
                            stroke= '#959698'
                            stroke-width="1"
                        />
                        <!-- 圓餅分割區塊（同步放大並下移） -->
                        <path
                            :fill="active === 2 ? '#fae54c' : 'none'"
                            stroke= '#959698'
                            stroke-width="1"
                            d="M12,13 L12,4 A9,9 0 0,1 21,13 Z"
                        />
                    </svg>
                    <span>資產收支</span>
                </div>
            </TabbarItem>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28px"
                        height="28px"
                        viewBox="0 0 24 24"
                    >
                        <!-- 頭部：偏下且加大 -->
                        <circle
                            cx="12"
                            cy="10"
                            r="6"
                            :fill="active === 3 ? '#fae54c' : 'none'"
                            stroke= '#959698'
                            stroke-width="1"
                        />
                        <!-- 身體：橢圓形，寬高更像人 -->
                        <ellipse
                            cx="12"
                            cy="20"
                            rx="8"
                            ry="3"
                            :fill="active === 3 ? '#fae54c' : 'none'"
                            stroke= '#959698'
                            stroke-width="1"
                        />
                    </svg>
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
    import { useUserStockListStore } from '@/stores/user-stock-list-store.js';
    import axios from '@/lib/axios';
    // 取得 globalStore
    const globalStore = useGlobalStore();
    // 取得 userStockListStore
    const userStockListStore = useUserStockListStore();

    // 取得 CNN 指數資料
    async function fetchGlobal() {
        try {
            const res = await axios.get('data/global.json');
            globalStore.setGlobal(res.data);
        } catch (e) {
            globalStore.reset();
        }
    }

    // 載入使用者股票清單
    async function loadUserStockList() {
        try {
            await userStockListStore.loadUserStockList();
        } catch (error) {
            console.error('載入使用者股票清單失敗:', error);
        }
    }
    // 移除 JS 動態高度，改用 CSS 100dvh

    // const { height } = useWindowSize();
    onMounted(() => {
        fetchGlobal();
        loadUserStockList(); // 從 idb 載入到 pinia
    });

    import { usePreferredDark } from '@vueuse/core';

    const router = useRouter();
    const route = useRoute();
    const active = ref(0);
    const firstLoad = ref(true);

    const tabRoutes = ['/', '/profit', '/asset', '/my'];

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

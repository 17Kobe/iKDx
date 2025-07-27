<template>
    <div :class="{ dark: isDark }" style="min-height: 100vh">
        <router-view />
        <Tabbar v-model="active" @change="onTabChange">
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="active === 0 ? 'flowbite:star-solid' : 'flowbite:star-outline'"
                        width="24"
                        height="24"
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
                        width="24"
                        height="24"
                    />
                    <span>價差股利</span>
                </div>
            </TabbarItem>
            <!-- Progress Bar 區塊 -->
            <div class="tabbar-progress-wrap">
                <div class="tabbar-progress-item">
                    <div class="tabbar-progress-bar" style="width: 75%"></div>
                    <span class="tabbar-progress-label">75% 極貪婪</span>
                </div>
                <div class="tabbar-progress-item">
                    <div class="tabbar-progress-bar" style="width: 100%"></div>
                    <span class="tabbar-progress-label">31分 穩定</span>
                </div>
            </div>
            <TabbarItem>
                <div class="tabbar-icon-wrap">
                    <Icon
                        :icon="
                            active === 2
                                ? 'basil:chart-pie-alt-solid'
                                : 'basil:chart-pie-alt-outline'
                        "
                        width="24"
                        height="24"
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
                        width="24"
                        height="24"
                    />
                    <span>我的</span>
                </div>
            </TabbarItem>
        </Tabbar>
    </div>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem } from 'vant';
    import { Icon } from '@iconify/vue';
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

<style scoped>
    .tabbar-progress-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        margin: 0 8px;
        gap: 4px;
        min-width: 80px;
        max-width: 100px;
    }
    .tabbar-progress-item {
        position: relative;
        width: 100%;
        background: #e6f7e6;
        border-radius: 16px;
        height: 24px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        padding: 0 4px;
    }
    .tabbar-progress-bar {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #7be495 60%, #bdf7b7 100%);
        border-radius: 16px;
        z-index: 1;
    }
    .tabbar-progress-item:nth-child(2) .tabbar-progress-bar {
        background: linear-gradient(90deg, #bdf7b7 60%, #7be495 100%);
    }
    .tabbar-progress-label {
        position: relative;
        z-index: 2;
        font-size: 13px;
        color: #222;
        font-weight: 500;
        white-space: nowrap;
        margin-left: 2px;
    }
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
        font-size: 12px;
        margin-top: 2px;
    }
</style>

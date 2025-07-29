<template>
    <div :class="{ dark: isDark }" style="min-height: 100vh">
        <router-view />
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
    import { ref, watch } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { Tabbar, TabbarItem } from 'vant';
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
</style>

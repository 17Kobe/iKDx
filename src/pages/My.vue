<template>
    <div class="my-page">
        <div class="setting-list">
            <!-- 主題設定 -->
            <div class="setting-item" @click="showThemeSheet">
                <div class="setting-left">
                    <span class="setting-title">主題</span>
                </div>
                <div class="setting-right">
                    <span class="setting-value">{{ currentThemeLabel }}</span>
                    <span class="arrow">></span>
                </div>
            </div>
            
            <!-- 開發者設定 -->
            <div class="setting-item" @click="showDeveloperSheet">
                <div class="setting-left">
                    <span class="setting-title">開發者</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>
        </div>

        <!-- 主題選擇 ActionSheet -->
        <ActionSheet
            v-model:show="themeSheetVisible"
            :actions="themeActions"
            title="選擇主題"
            cancel-text="取消"
            @select="onThemeSelect"
        />

        <!-- 開發者 ActionSheet -->
        <ActionSheet
            v-model:show="developerSheetVisible"
            :actions="developerActions"
            title="開發者選項"
            cancel-text="取消"
            @select="onDeveloperSelect"
        />

        <!-- Worker Monitor 彈窗 -->
        <Popup
            v-model:show="workerMonitorVisible"
            position="bottom"
            :style="{ height: '70%' }"
            round
        >
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold;">
                    Worker Pool 監控
                </div>
                <WorkerMonitor />
            </div>
        </Popup>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useThemeStore } from '../stores/theme';
    import { ActionSheet, Popup } from 'vant';
    import WorkerMonitor from '../components/my/WorkerMonitor.vue';

    const themeStore = useThemeStore();
    
    // ActionSheet 顯示狀態
    const themeSheetVisible = ref(false);
    const developerSheetVisible = ref(false);
    const workerMonitorVisible = ref(false);

    // 當前主題標籤
    const currentThemeLabel = computed(() => {
        switch (themeStore.mode) {
            case 0: return '跟隨系統';
            case 1: return '亮';
            case 2: return '暗';
            default: return '跟隨系統';
        }
    });

    // 主題選項
    const themeActions = [
        { name: '跟隨系統', value: 0 },
        { name: '亮', value: 1 },
        { name: '暗', value: 2 }
    ];

    // 開發者選項
    const developerActions = [
        { name: 'Worker Pool 監控', value: 'worker' },
        { name: '應用資訊', value: 'info' },
        { name: '清除快取', value: 'clear' }
    ];

    // 顯示主題選擇
    function showThemeSheet() {
        themeSheetVisible.value = true;
    }

    // 顯示開發者選項
    function showDeveloperSheet() {
        developerSheetVisible.value = true;
    }

    // 主題選擇
    function onThemeSelect(action) {
        themeStore.mode = action.value;
        themeSheetVisible.value = false;
    }

    // 開發者選項
    function onDeveloperSelect(action) {
        developerSheetVisible.value = false;
        
        switch (action.value) {
            case 'worker':
                workerMonitorVisible.value = true;
                break;
            case 'info':
                // 可以加入應用資訊邏輯
                console.log('顯示應用資訊');
                break;
            case 'clear':
                // 可以加入清除快取邏輯
                console.log('清除快取');
                break;
        }
    }
</script>

    <style scoped>
    .my-page {
        background: var(--page-bg, #eff3f6);
        min-height: 100%;
        box-sizing: border-box;
        padding: 16px;
    }

    .setting-list {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #f5f5f5;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .setting-item:last-child {
        border-bottom: none;
    }

    .setting-item:hover {
        background-color: #f8f9fa;
    }

    .setting-item:active {
        background-color: #f0f1f2;
    }

    .setting-left {
        display: flex;
        align-items: center;
    }

    .setting-title {
        font-size: 16px;
        color: #333;
        font-weight: 500;
    }

    .setting-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .setting-value {
        font-size: 14px;
        color: #666;
    }

    .arrow {
        font-size: 16px;
        color: #c8c9cc;
        font-weight: bold;
    }
    </style>

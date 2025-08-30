<template>
    <div class="my-page">
        <Tabs 
            v-model:active="activeTab" 
            swipeable 
            sticky
            @change="onTabChange"
            class="custom-tabs"
        >
            <Tab title="基本" name="basic">
                <div class="tab-content">
                    <!-- 登入狀態區域 -->
                    <div v-if="!authStore.isAuthenticated" class="auth-section">
                        <div class="login-prompt">
                            <div class="login-icon">
                                <Icon icon="flowbite:user-circle-solid" width="60" height="60" color="#ccc" />
                            </div>
                            <h3>歡迎使用 iKDx</h3>
                            <p>登入後可同步您的股票資料</p>
                            <Button 
                                type="primary" 
                                size="large" 
                                round 
                                block
                                @click="goToLogin"
                                style="margin-top: 16px;"
                            >
                                立即登入
                            </Button>
                        </div>
                    </div>

                    <!-- 已登入用戶資訊 -->
                    <div v-else-if="authStore.isLoggedIn" class="user-section">
                        <div class="user-info">
                            <div class="user-avatar">
                                <img 
                                    v-if="authStore.user?.avatar" 
                                    :src="authStore.user.avatar" 
                                    :alt="authStore.user.name"
                                />
                                <Icon 
                                    v-else 
                                    icon="flowbite:user-circle-solid" 
                                    width="60" 
                                    height="60" 
                                    color="#ccc" 
                                />
                            </div>
                            <div class="user-details">
                                <h3>{{ authStore.user?.name || '用戶' }}</h3>
                                <p>{{ authStore.user?.email }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- 訪客模式提示 -->
                    <div v-else-if="authStore.isGuestMode" class="guest-section">
                        <div class="guest-info">
                            <div class="guest-icon">
                                <Icon icon="flowbite:user-circle-solid" width="60" height="60" color="#999" />
                            </div>
                            <div class="guest-details">
                                <h3>訪客模式</h3>
                                <p>資料僅保存在本地</p>
                                <Button 
                                    type="primary" 
                                    size="small" 
                                    plain
                                    @click="goToLogin"
                                    style="margin-top: 8px;"
                                >
                                    切換到登入
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div class="setting-list">
                        <!-- 登出設定 -->
                        <div v-if="authStore.isLoggedIn" class="setting-item" @click="showLogoutConfirm">
                            <div class="setting-left">
                                <span class="setting-title">登出</span>
                            </div>
                            <div class="setting-right">
                                <span class="arrow">></span>
                            </div>
                        </div>
                        
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
                </div>
            </Tab>
        </Tabs>

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

        <!-- Worker Monitor ActionSheet -->
        <ActionSheet
            v-model:show="workerMonitorVisible"
            title="Worker Pool 監控"
            cancel-text="關閉"
        >
            <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                <WorkerMonitor />
            </div>
        </ActionSheet>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { useThemeStore } from '../stores/theme';
    import { useAuthStore } from '../stores/auth';
    import { ActionSheet, Tab, Tabs, Button, showDialog, showToast } from 'vant';
    import { Icon } from '@iconify/vue';
    import WorkerMonitor from '../components/my/WorkerMonitor.vue';

    const router = useRouter();
    const themeStore = useThemeStore();
    const authStore = useAuthStore();
    
    // Tab 狀態管理
    const activeTab = ref('basic');
    
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

    // 跳轉到登入頁面
    function goToLogin() {
        router.push('/login');
    }

    // 顯示登出確認
    function showLogoutConfirm() {
        showDialog({
            title: '確認登出',
            message: '確定要登出嗎？',
            showCancelButton: true,
            confirmButtonText: '登出',
            cancelButtonText: '取消'
        })
        .then(() => {
            // 執行登出
            authStore.logout();
            showToast.success('已登出');
        })
        .catch(() => {
            // 取消登出
        });
    }

    // Tab 切換事件
    function onTabChange(name) {
        console.log('切換到：', name);
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
        height: 100%;
        background: var(--page-bg, #eff3f6);
    }

    .custom-tabs {
        height: 100%;
    }

    .tab-content {
        padding: 16px;
        min-height: 400px;
    }

    .setting-list {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    /* Vant Tabs 樣式自訂 - 與價差股利頁面一致 */
    :deep(.van-tabs__wrap) {
        position: sticky;
        top: 0;
        z-index: 99;
    }

    :deep(.van-tabs__nav) {
        background-color: var(--van-background-color);
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: flex-start;
        padding: 0 8px;
    }

    :deep(.van-tab) {
        min-width: 50px;
        padding: 0;
        font-size: 22px;
        line-height: 22px;
        color: #888;
        font-weight: 500;
        text-align: center;
        flex: none;
    }

    :deep(.van-tab--active) {
        color: #222;
        font-weight: 700;
    }

    :deep(.van-tabs__line) {
        background-color: #FFD600;
        height: 3px;
        border-radius: 2px;
        bottom: 6px;
    }

    .tab-content {
        padding-bottom: 20px;
    }

    /* 登入狀態區域 */
    .auth-section, .user-section, .guest-section {
        background: white;
        margin: 16px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .login-prompt {
        text-align: center;
        padding: 40px 20px;
    }

    .login-icon {
        margin-bottom: 16px;
    }

    .login-prompt h3 {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
    }

    .login-prompt p {
        color: #666;
        margin: 0 0 16px 0;
        font-size: 14px;
    }

    .user-info {
        display: flex;
        align-items: center;
        padding: 20px;
    }

    .user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 16px;
        flex-shrink: 0;
    }

    .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .user-details h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px 0;
    }

    .user-details p {
        color: #666;
        margin: 0;
        font-size: 14px;
    }

    .guest-info {
        display: flex;
        align-items: center;
        padding: 20px;
    }

    .guest-icon {
        margin-right: 16px;
        flex-shrink: 0;
    }

    .guest-details h3 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px 0;
    }

    .guest-details p {
        color: #666;
        margin: 0;
        font-size: 14px;
    }

    .setting-list {
        background: white;
        margin: 16px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

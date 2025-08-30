<template>
    <div class="my-page">
        <Tabs v-model:active="activeTab" swipeable sticky @change="onTabChange" class="custom-tabs">
            <Tab title="基本" name="basic">
                <div class="tab-content">
                    <!-- 登入狀態區域 -->
                    <div v-if="!authStore.isAuthenticated" class="auth-section">
                        <div class="login-prompt">
                            <div class="login-icon">
                                <Icon
                                    icon="flowbite:user-circle-solid"
                                    width="60"
                                    height="60"
                                    color="#ccc"
                                />
                            </div>
                            <h3>歡迎使用 iKDx</h3>
                            <p>登入後可同步您的股票資料</p>
                            <Button
                                type="primary"
                                size="large"
                                round
                                block
                                @click="showLoginSheet"
                                style="margin-top: 16px"
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
                                <Icon
                                    icon="flowbite:user-circle-solid"
                                    width="60"
                                    height="60"
                                    color="#999"
                                />
                            </div>
                            <div class="guest-details">
                                <h3>訪客模式</h3>
                                <p>資料僅保存在本地</p>
                                <Button
                                    type="primary"
                                    size="small"
                                    plain
                                    @click="showLoginSheet"
                                    style="margin-top: 8px"
                                >
                                    切換到登入
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div class="setting-list">
                        <!-- 登出設定 -->
                        <div
                            v-if="authStore.isLoggedIn"
                            class="setting-item"
                            @click="showLogoutConfirm"
                        >
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
            class="theme-action-sheet"
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
            <div style="padding: 20px; max-height: 70vh; overflow-y: auto">
                <WorkerMonitor />
            </div>
        </ActionSheet>

        <!-- 登入 ActionSheet -->
        <ActionSheet
            v-model:show="loginSheetVisible"
            title="登入 iKDx"
            cancel-text="取消"
            class="login-action-sheet"
        >
            <div class="login-sheet-content">
                <!-- Logo 區域 -->
                <div class="login-logo-section">
                    <div class="app-logo">
                        <Icon icon="flowbite:star-solid" width="50" height="50" color="#FFD600" />
                    </div>
                    <h2 class="app-title">智能股票分析平台</h2>
                    <p class="login-subtitle">登入後可同步您的股票資料到雲端</p>
                </div>

                <!-- 登入按鈕區域 -->
                <div class="login-buttons">
                    <!-- Google 登入 -->
                    <Button
                        class="login-btn google-btn"
                        size="large"
                        block
                        :loading="googleLoading"
                        @click="loginWithGoogle"
                    >
                        <Icon
                            icon="logos:google-icon"
                            width="20"
                            height="20"
                            style="margin-right: 8px"
                        />
                        使用 Google 帳號登入
                    </Button>

                    <!-- Facebook 登入 -->
                    <Button
                        class="login-btn facebook-btn"
                        size="large"
                        block
                        :loading="facebookLoading"
                        @click="loginWithFacebook"
                    >
                        <Icon
                            icon="logos:facebook"
                            width="20"
                            height="20"
                            style="margin-right: 8px"
                        />
                        使用 Facebook 帳號登入
                    </Button>

                    <!-- 分隔線 -->
                    <div class="login-divider">
                        <span>或</span>
                    </div>

                    <!-- 繼續訪客模式 -->
                    <Button
                        class="guest-continue-btn"
                        size="large"
                        block
                        plain
                        @click="continueAsGuest"
                    >
                        繼續使用訪客模式
                    </Button>
                </div>

                <!-- 服務條款 -->
                <div class="login-terms">
                    <p class="terms-text">
                        登入即表示您同意我們的
                        <a href="#" @click.prevent="showTerms">服務條款</a>
                        和
                        <a href="#" @click.prevent="showPrivacy">隱私政策</a>
                    </p>
                </div>
            </div>
        </ActionSheet>

        <!-- 載入中遮罩 -->
        <Overlay v-model:show="isLoading" class="loading-overlay">
            <div class="loading-content">
                <Loading size="24px" vertical>登入中...</Loading>
            </div>
        </Overlay>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useRouter } from 'vue-router';
    import { useThemeStore } from '../stores/theme';
    import { useAuthStore } from '../stores/auth';
    import { ActionSheet, Tab, Tabs, Button, showDialog, showToast, Overlay, Loading } from 'vant';
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
    const loginSheetVisible = ref(false);

    // 登入載入狀態
    const isLoading = ref(false);
    const googleLoading = ref(false);
    const facebookLoading = ref(false);

    // 當前主題標籤
    const currentThemeLabel = computed(() => {
        switch (themeStore.mode) {
            case 0:
                return '跟隨系統';
            case 1:
                return '亮';
            case 2:
                return '暗';
            default:
                return '跟隨系統';
        }
    });

    // 主題選項
    const themeActions = computed(() => [
        { 
            name: '跟隨系統', 
            value: 0,
            color: themeStore.mode === 0 ? '#1989fa' : undefined,
            className: themeStore.mode === 0 ? 'selected-theme' : undefined
        },
        { 
            name: '亮', 
            value: 1,
            color: themeStore.mode === 1 ? '#1989fa' : undefined,
            className: themeStore.mode === 1 ? 'selected-theme' : undefined
        },
        { 
            name: '暗', 
            value: 2,
            color: themeStore.mode === 2 ? '#1989fa' : undefined,
            className: themeStore.mode === 2 ? 'selected-theme' : undefined
        },
    ]);

    // 開發者選項
    const developerActions = [
        { name: 'Worker Pool 監控', value: 'worker' },
        { name: '應用資訊', value: 'info' },
        { name: '清除快取', value: 'clear' },
    ];

    // 顯示主題選擇
    function showThemeSheet() {
        themeSheetVisible.value = true;
    }

    // 顯示開發者選項
    function showDeveloperSheet() {
        developerSheetVisible.value = true;
    }

    // 顯示登入 ActionSheet
    function showLoginSheet() {
        loginSheetVisible.value = true;
    }

    // 跳轉到登入頁面 (保留備用)
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
            cancelButtonText: '取消',
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

    // Google 登入
    async function loginWithGoogle() {
        try {
            googleLoading.value = true;
            isLoading.value = true;

            // 初始化 Google OAuth
            const response = await initGoogleAuth();

            if (response.success) {
                await authStore.loginWithGoogle(response.token);
                showToast.success('Google 登入成功！');
                loginSheetVisible.value = false;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Google 登入失敗:', error);
            showToast.fail('Google 登入失敗，請稍後再試');
        } finally {
            googleLoading.value = false;
            isLoading.value = false;
        }
    }

    // Facebook 登入
    async function loginWithFacebook() {
        try {
            facebookLoading.value = true;
            isLoading.value = true;

            // 初始化 Facebook OAuth
            const response = await initFacebookAuth();

            if (response.success) {
                await authStore.loginWithFacebook(response.token);
                showToast.success('Facebook 登入成功！');
                loginSheetVisible.value = false;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Facebook 登入失敗:', error);
            showToast.fail('Facebook 登入失敗，請稍後再試');
        } finally {
            facebookLoading.value = false;
            isLoading.value = false;
        }
    }

    // 繼續訪客模式
    function continueAsGuest() {
        loginSheetVisible.value = false;
        showToast('繼續使用訪客模式');
    }

    // Google OAuth 初始化 (模擬)
    async function initGoogleAuth() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    token: 'mock-google-token',
                    user: {
                        id: 'google-123',
                        name: '測試用戶',
                        email: 'test@gmail.com',
                        avatar: '',
                    },
                });
            }, 1500);
        });
    }

    // Facebook OAuth 初始化 (模擬)
    async function initFacebookAuth() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    token: 'mock-facebook-token',
                    user: {
                        id: 'fb-123',
                        name: '測試用戶',
                        email: 'test@facebook.com',
                        avatar: '',
                    },
                });
            }, 1500);
        });
    }

    // 顯示服務條款
    function showTerms() {
        showDialog({
            title: '服務條款',
            message: '這裡是服務條款內容...',
            showCancelButton: false,
            confirmButtonText: '我知道了',
        });
    }

    // 顯示隱私政策
    function showPrivacy() {
        showDialog({
            title: '隱私政策',
            message: '這裡是隱私政策內容...',
            showCancelButton: false,
            confirmButtonText: '我知道了',
        });
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
        padding: 0 16px;
        min-height: 400px;
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
        background-color: #ffd600;
        height: 3px;
        border-radius: 2px;
        bottom: 6px;
    }

    /* 登入狀態區域 */
    .auth-section,
    .user-section,
    .guest-section {
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

    /* 登入 ActionSheet 樣式 */
    :deep(.login-action-sheet .van-action-sheet__header) {
        background: linear-gradient(135deg, #fff3cd 0%, #ffb347 100%);
        color: #8b4513;
        font-weight: 600;
    }

    :deep(.login-action-sheet .van-action-sheet__cancel) {
        color: #666;
    }

    .login-sheet-content {
        padding: 20px;
        background: linear-gradient(135deg, #fff3cd 0%, #ffb347 100%);
        min-height: 400px;
    }

    .login-logo-section {
        text-align: center;
        margin-bottom: 30px;
        color: #8b4513;
    }

    .app-logo {
        margin-bottom: 12px;
    }

    .app-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #8b4513;
    }

    .login-subtitle {
        font-size: 14px;
        margin: 0;
        opacity: 0.8;
        color: #8b4513;
    }

    .login-buttons {
        margin-bottom: 20px;
    }

    .login-btn {
        margin-bottom: 12px;
        height: 48px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 500;
    }

    .google-btn {
        background: #fff;
        border: 1px solid #dadce0;
        color: #3c4043;
    }

    .google-btn:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .facebook-btn {
        background: #1877f2;
        border: 1px solid #1877f2;
        color: white;
    }

    .facebook-btn:hover {
        background: #166fe5;
    }

    .login-divider {
        text-align: center;
        margin: 20px 0;
        position: relative;
    }

    .login-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(139, 69, 19, 0.3);
    }

    .login-divider span {
        background: linear-gradient(135deg, #fff3cd 0%, #ffb347 100%);
        padding: 0 16px;
        color: #8b4513;
        font-size: 14px;
    }

    .guest-continue-btn {
        color: #8b4513;
        border-color: rgba(139, 69, 19, 0.4);
        height: 44px;
        border-radius: 12px;
    }

    .guest-continue-btn:hover {
        background: rgba(139, 69, 19, 0.1);
    }

    .login-terms {
        text-align: center;
    }

    .terms-text {
        font-size: 12px;
        color: rgba(139, 69, 19, 0.7);
        line-height: 1.5;
        margin: 0;
    }

    .terms-text a {
        color: #8b4513;
        text-decoration: underline;
        font-weight: 500;
    }

    .loading-overlay {
        background: rgba(0, 0, 0, 0.7);
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
    }

    /* 主題選擇 ActionSheet 樣式 */
    :deep(.theme-action-sheet .van-action-sheet__item) {
        position: relative;
        font-weight: 500;
    }

    /* 選中的主題項目樣式 */
    :deep(.theme-action-sheet .van-action-sheet__item[style*="color: rgb(25, 137, 250)"]) {
        background-color: #f0f8ff;
        font-weight: 600;
        border-left: 3px solid #1989fa;
    }

    /* 選中項目的對勾圖標 */
    :deep(.theme-action-sheet .van-action-sheet__item[style*="color: rgb(25, 137, 250)"])::after {
        content: '✓';
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #1989fa;
        font-weight: bold;
        font-size: 16px;
    }
</style>

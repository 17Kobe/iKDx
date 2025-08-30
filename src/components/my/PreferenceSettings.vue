<template>
    <div class="preference-settings">
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
                    @click="$emit('showLogin')"
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
                        @click="$emit('showLogin')"
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
                @click="$emit('showLogout')"
            >
                <div class="setting-left">
                    <span class="setting-title">登出</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>

            <!-- 主題設定 -->
            <div class="setting-item" @click="$emit('showTheme')">
                <div class="setting-left">
                    <span class="setting-title">主題</span>
                </div>
                <div class="setting-right">
                    <span class="setting-value">{{ currentThemeLabel }}</span>
                    <span class="arrow">></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed } from 'vue';
    import { useThemeStore } from '../../stores/theme';
    import { useAuthStore } from '../../stores/auth';
    import { Button } from 'vant';
    import { Icon } from '@iconify/vue';

    // Stores
    const themeStore = useThemeStore();
    const authStore = useAuthStore();

    // Emits
    defineEmits(['showLogin', 'showLogout', 'showTheme']);

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
</script>

<style scoped>
    .preference-settings {
        padding: 0 16px;
        min-height: 400px;
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
</style>

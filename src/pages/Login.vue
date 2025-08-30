<template>
    <div class="login-page">
        <div class="login-container">
            <!-- Logo 區域 -->
            <div class="logo-section">
                <div class="app-logo">
                    <Icon icon="flowbite:star-solid" width="60" height="60" color="#FFD600" />
                </div>
                <h1 class="app-title">iKDx</h1>
                <p class="app-subtitle">智能股票分析平台</p>
            </div>

            <!-- 登入區域 -->
            <div class="login-section">
                <h2 class="login-title">歡迎登入</h2>
                
                <!-- Google 登入 -->
                <Button
                    class="login-btn google-btn"
                    size="large"
                    block
                    :loading="googleLoading"
                    @click="loginWithGoogle"
                >
                    <Icon icon="logos:google-icon" width="20" height="20" style="margin-right: 8px;" />
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
                    <Icon icon="logos:facebook" width="20" height="20" style="margin-right: 8px;" />
                    使用 Facebook 帳號登入
                </Button>

                <!-- 分隔線 -->
                <div class="divider">
                    <span>或</span>
                </div>

                <!-- 訪客模式 -->
                <Button
                    class="guest-btn"
                    size="large"
                    block
                    plain
                    @click="continueAsGuest"
                >
                    訪客模式繼續
                </Button>
            </div>

            <!-- 服務條款 -->
            <div class="terms-section">
                <p class="terms-text">
                    登入即表示您同意我們的
                    <a href="#" @click.prevent="showTerms">服務條款</a>
                    和
                    <a href="#" @click.prevent="showPrivacy">隱私政策</a>
                </p>
            </div>
        </div>

        <!-- 載入中遮罩 -->
        <Overlay v-model:show="isLoading" class="loading-overlay">
            <div class="loading-content">
                <Loading size="24px" vertical>登入中...</Loading>
            </div>
        </Overlay>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Overlay, Loading, showToast, showDialog } from 'vant';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 載入狀態
const isLoading = ref(false);
const googleLoading = ref(false);
const facebookLoading = ref(false);

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
            router.push('/');
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
            router.push('/');
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

// 訪客模式
function continueAsGuest() {
    authStore.setGuestMode(true);
    router.push('/');
}

// Google OAuth 初始化
async function initGoogleAuth() {
    return new Promise((resolve) => {
        // 這裡會實際整合 Google OAuth API
        // 暫時模擬
        setTimeout(() => {
            resolve({
                success: true,
                token: 'mock-google-token',
                user: {
                    id: 'google-123',
                    name: '測試用戶',
                    email: 'test@gmail.com',
                    avatar: ''
                }
            });
        }, 1500);
    });
}

// Facebook OAuth 初始化
async function initFacebookAuth() {
    return new Promise((resolve) => {
        // 這裡會實際整合 Facebook OAuth API
        // 暫時模擬
        setTimeout(() => {
            resolve({
                success: true,
                token: 'mock-facebook-token',
                user: {
                    id: 'fb-123',
                    name: '測試用戶',
                    email: 'test@facebook.com',
                    avatar: ''
                }
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
        confirmButtonText: '我知道了'
    });
}

// 顯示隱私政策
function showPrivacy() {
    showDialog({
        title: '隱私政策',
        message: '這裡是隱私政策內容...',
        showCancelButton: false,
        confirmButtonText: '我知道了'
    });
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-container {
    background: white;
    border-radius: 20px;
    padding: 40px 30px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.logo-section {
    text-align: center;
    margin-bottom: 40px;
}

.app-logo {
    margin-bottom: 16px;
}

.app-title {
    font-size: 32px;
    font-weight: bold;
    color: #333;
    margin: 0 0 8px 0;
}

.app-subtitle {
    color: #666;
    margin: 0;
    font-size: 14px;
}

.login-section {
    margin-bottom: 30px;
}

.login-title {
    text-align: center;
    font-size: 24px;
    color: #333;
    margin: 0 0 30px 0;
    font-weight: 600;
}

.login-btn {
    margin-bottom: 16px;
    height: 50px;
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

.divider {
    text-align: center;
    margin: 24px 0;
    position: relative;
}

.divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #eee;
}

.divider span {
    background: white;
    padding: 0 16px;
    color: #999;
    font-size: 14px;
}

.guest-btn {
    color: #666;
    border-color: #ddd;
    height: 44px;
    border-radius: 12px;
}

.terms-section {
    text-align: center;
}

.terms-text {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
    margin: 0;
}

.terms-text a {
    color: #1989fa;
    text-decoration: none;
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

/* 響應式設計 */
@media (max-width: 480px) {
    .login-container {
        padding: 30px 20px;
    }
    
    .app-title {
        font-size: 28px;
    }
    
    .login-title {
        font-size: 20px;
    }
}
</style>

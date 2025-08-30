import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
    // 狀態
    const user = ref(null);
    const token = ref(localStorage.getItem('auth_token') || null);
    const isGuestMode = ref(localStorage.getItem('guest_mode') === 'true');
    const isLoading = ref(false);

    // 計算屬性
    const isLoggedIn = computed(() => !!token.value && !isGuestMode.value);
    const isAuthenticated = computed(() => isLoggedIn.value || isGuestMode.value);

    // Google 登入
    async function loginWithGoogle(googleToken) {
        try {
            isLoading.value = true;
            
            const response = await authService.loginWithGoogle(googleToken);
            
            if (response.success) {
                token.value = response.token;
                user.value = response.user;
                
                // 儲存到 localStorage
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                localStorage.removeItem('guest_mode');
                
                isGuestMode.value = false;
                return response;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Google 登入失敗:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // Facebook 登入
    async function loginWithFacebook(facebookToken) {
        try {
            isLoading.value = true;
            
            const response = await authService.loginWithFacebook(facebookToken);
            
            if (response.success) {
                token.value = response.token;
                user.value = response.user;
                
                // 儲存到 localStorage
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                localStorage.removeItem('guest_mode');
                
                isGuestMode.value = false;
                return response;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Facebook 登入失敗:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // 設定訪客模式
    function setGuestMode(guest = true) {
        isGuestMode.value = guest;
        if (guest) {
            localStorage.setItem('guest_mode', 'true');
            // 清除登入資料
            token.value = null;
            user.value = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
        } else {
            localStorage.removeItem('guest_mode');
        }
    }

    // 登出
    function logout() {
        token.value = null;
        user.value = null;
        isGuestMode.value = false;
        
        // 清除 localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('guest_mode');
    }

    // 初始化用戶資料
    function initializeAuth() {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user_data');
        const guestMode = localStorage.getItem('guest_mode');

        if (savedToken && savedUser) {
            token.value = savedToken;
            user.value = JSON.parse(savedUser);
            isGuestMode.value = false;
        } else if (guestMode === 'true') {
            isGuestMode.value = true;
        }
    }

    // 檢查 token 有效性
    async function checkTokenValidity() {
        if (!token.value) return false;
        
        try {
            const response = await authService.verifyToken(token.value);
            
            if (!response.valid) {
                logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Token 驗證失敗:', error);
            logout();
            return false;
        }
    }

    // 取得用戶資料
    async function fetchUserProfile() {
        if (!token.value) return null;
        
        try {
            const response = await authService.getUserProfile(token.value);
            
            if (response.success) {
                user.value = response.user;
                localStorage.setItem('user_data', JSON.stringify(response.user));
            }
            
            return response.user;
        } catch (error) {
            console.error('取得用戶資料失敗:', error);
            return null;
        }
    }

    // 更新用戶資料
    async function updateUserProfile(userData) {
        if (!token.value) return false;
        
        try {
            const response = await authService.updateUserProfile(token.value, userData);
            
            if (response.success) {
                user.value = { ...user.value, ...response.user };
                localStorage.setItem('user_data', JSON.stringify(user.value));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('更新用戶資料失敗:', error);
            return false;
        }
    }

    return {
        // 狀態
        user,
        token,
        isGuestMode,
        isLoading,
        
        // 計算屬性
        isLoggedIn,
        isAuthenticated,
        
        // 方法
        loginWithGoogle,
        loginWithFacebook,
        setGuestMode,
        logout,
        initializeAuth,
        checkTokenValidity,
        fetchUserProfile,
        updateUserProfile
    };
});

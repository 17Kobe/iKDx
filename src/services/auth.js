import axios from '@/lib/axios';

// Cloudflare Workers API 端點
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-worker.your-subdomain.workers.dev';

class AuthService {
    // Google 登入
    async loginWithGoogle(googleToken) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/google`, {
                token: googleToken
            });

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };
        } catch (error) {
            console.error('Google 登入 API 錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '登入失敗'
            };
        }
    }

    // Facebook 登入
    async loginWithFacebook(facebookToken) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/facebook`, {
                token: facebookToken
            });

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };
        } catch (error) {
            console.error('Facebook 登入 API 錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '登入失敗'
            };
        }
    }

    // 驗證 token
    async verifyToken(token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return {
                valid: true,
                user: response.data.user
            };
        } catch (error) {
            console.error('Token 驗證錯誤:', error);
            return {
                valid: false,
                error: error.response?.data?.message || 'Token 無效'
            };
        }
    }

    // 取得用戶資料
    async getUserProfile(token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            console.error('取得用戶資料錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '取得資料失敗'
            };
        }
    }

    // 更新用戶資料
    async updateUserProfile(token, userData) {
        try {
            const response = await axios.put(`${API_BASE_URL}/user/profile`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return {
                success: true,
                user: response.data.user
            };
        } catch (error) {
            console.error('更新用戶資料錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '更新失敗'
            };
        }
    }

    // 登出（可選：通知後端清除 session）
    async logout(token) {
        try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return { success: true };
        } catch (error) {
            console.error('登出 API 錯誤:', error);
            // 即使 API 失敗，本地登出仍然成功
            return { success: true };
        }
    }

    // 刷新 token
    async refreshToken(token) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return {
                success: true,
                token: response.data.token
            };
        } catch (error) {
            console.error('刷新 Token 錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '刷新失敗'
            };
        }
    }

    // 刪除帳號
    async deleteAccount(token) {
        try {
            await axios.delete(`${API_BASE_URL}/user/account`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return { success: true };
        } catch (error) {
            console.error('刪除帳號錯誤:', error);
            return {
                success: false,
                error: error.response?.data?.message || '刪除失敗'
            };
        }
    }
}

export const authService = new AuthService();

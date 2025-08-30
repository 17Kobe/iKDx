import { createRouter, createWebHashHistory } from 'vue-router';
import { initDB, clearAllDB } from './lib/idb';
import { useAuthStore } from './stores/auth';

const routes = [
    {
        path: '/',
        name: 'stock',
        component: () => import('./pages/Stock.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('./pages/Login.vue'),
        meta: { requiresAuth: false, hideForAuth: true }
    },
    {
        path: '/profit',
        name: 'profit',
        component: () => import('./pages/Profit.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/asset',
        name: 'asset',
        component: () => import('./pages/Asset.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/my',
        name: 'my',
        component: () => import('./pages/My.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/clear',
        name: 'clear',
        beforeEnter: async (to, from, next) => {
            try {
                await clearAllDB();
                console.log('IndexedDB 已清除');
                alert('IndexedDB 資料已清除完成！');
                next('/'); // 清除完成後導回首頁
            } catch (error) {
                console.error('清除 IndexedDB 失敗:', error);
                alert('清除失敗：' + error.message);
                next('/');
            }
        },
        component: () => import('./pages/Stock.vue'), // 備用組件，實際不會顯示
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// 路由守衛
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    
    // 初始化認證狀態
    if (!authStore.isAuthenticated && !authStore.isGuestMode) {
        authStore.initializeAuth();
    }
    
    // 檢查是否需要認證
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
        return;
    }
    
    // 如果已登入（非訪客模式）且訪問登入頁面，重導向到首頁
    if (to.meta.hideForAuth && authStore.isLoggedIn) {
        next('/');
        return;
    }
    
    // 對於需要認證的頁面，檢查 token 有效性
    if (authStore.isLoggedIn && to.meta.requiresAuth) {
        try {
            const isValid = await authStore.checkTokenValidity();
            if (!isValid) {
                next('/login');
                return;
            }
        } catch (error) {
            console.error('Token 檢查失敗:', error);
            next('/login');
            return;
        }
    }
    
    next();
});

export default router;

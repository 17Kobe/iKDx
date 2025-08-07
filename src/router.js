import { createRouter, createWebHashHistory } from 'vue-router';
import { initDB, clearAllDB } from './lib/idb';

const routes = [
    {
        path: '/',
        name: 'stock',
        component: () => import('./pages/Stock.vue'),
    },
    {
        path: '/dividend',
        name: 'dividend',
        component: () => import('./pages/Dividend.vue'),
    },
    {
        path: '/asset',
        name: 'asset',
        component: () => import('./pages/Asset.vue'),
    },
    {
        path: '/my',
        name: 'my',
        component: () => import('./pages/My.vue'),
    },
    {
        path: '/add',
        name: 'add',
        component: () => import('./pages/Add.vue'),
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

export default router;

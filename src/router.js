import { createRouter, createWebHashHistory } from 'vue-router';

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
        path: '/add',
        name: 'add',
        component: () => import('./pages/Add.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;

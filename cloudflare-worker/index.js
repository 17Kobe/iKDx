import { Router } from 'itty-router';
import { corsHeaders, handleCors } from './utils/cors';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';

const router = Router();

// CORS 處理
router.all('*', handleCors);

// 健康檢查
router.get('/', () => {
    return new Response(JSON.stringify({ 
        message: 'iKDx Auth API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    }), {
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
});

// 認證路由
router.all('/auth/*', authRouter.handle);

// 用戶路由
router.all('/user/*', userRouter.handle);

// 404 處理
router.all('*', () => {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
});

export default {
    async fetch(request, env, ctx) {
        try {
            return await router.handle(request, env, ctx);
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ 
                error: 'Internal Server Error',
                message: error.message 
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }
};

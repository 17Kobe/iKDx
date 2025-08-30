import { Router } from 'itty-router';
import { corsHeaders } from '../utils/cors';
import { generateToken } from '../utils/auth';

const router = Router({ base: '/auth' });

// Google OAuth 登入
router.post('/google', async (request, env) => {
    try {
        const { token } = await request.json();
        
        // 驗證 Google Token
        const googleUser = await verifyGoogleToken(token);
        if (!googleUser) {
            return new Response(JSON.stringify({ error: 'Invalid Google token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 檢查用戶是否已存在
        let user = await getUserByEmail(env.DB, googleUser.email);
        
        if (!user) {
            // 創建新用戶
            user = await createUser(env.DB, {
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                provider: 'google',
                providerId: googleUser.sub,
                createdAt: new Date().toISOString()
            });
        } else {
            // 更新最後登入時間
            await updateUserLastLogin(env.DB, user.id);
        }

        // 生成 JWT Token
        const jwtToken = await generateToken({
            userId: user.id,
            email: user.email,
            name: user.name
        });

        return new Response(JSON.stringify({
            success: true,
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Google 登入錯誤:', error);
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// Facebook OAuth 登入
router.post('/facebook', async (request, env) => {
    try {
        const { token } = await request.json();
        
        // 驗證 Facebook Token
        const facebookUser = await verifyFacebookToken(token);
        if (!facebookUser) {
            return new Response(JSON.stringify({ error: 'Invalid Facebook token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 檢查用戶是否已存在
        let user = await getUserByEmail(env.DB, facebookUser.email);
        
        if (!user) {
            // 創建新用戶
            user = await createUser(env.DB, {
                email: facebookUser.email,
                name: facebookUser.name,
                avatar: facebookUser.picture?.data?.url || '',
                provider: 'facebook',
                providerId: facebookUser.id,
                createdAt: new Date().toISOString()
            });
        } else {
            // 更新最後登入時間
            await updateUserLastLogin(env.DB, user.id);
        }

        // 生成 JWT Token
        const jwtToken = await generateToken({
            userId: user.id,
            email: user.email,
            name: user.name
        });

        return new Response(JSON.stringify({
            success: true,
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Facebook 登入錯誤:', error);
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// Token 驗證
router.get('/verify', async (request, env) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Token required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const token = authHeader.substring(7);
        const payload = await verifyToken(token);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 取得用戶資料
        const user = await getUserById(env.DB, payload.userId);
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Token 驗證錯誤:', error);
        return new Response(JSON.stringify({ error: 'Verification failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 登出
router.post('/logout', async (request, env) => {
    // 在無狀態 JWT 系統中，登出主要在前端處理
    // 這裡可以記錄登出事件或加入黑名單機制
    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
});

// 刷新 Token
router.post('/refresh', async (request, env) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Token required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const token = authHeader.substring(7);
        const payload = await verifyToken(token);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 生成新的 Token
        const newToken = await generateToken({
            userId: payload.userId,
            email: payload.email,
            name: payload.name
        });

        return new Response(JSON.stringify({
            success: true,
            token: newToken
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('刷新 Token 錯誤:', error);
        return new Response(JSON.stringify({ error: 'Refresh failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 驗證 Google Token
async function verifyGoogleToken(token) {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Google token 驗證失敗:', error);
        return null;
    }
}

// 驗證 Facebook Token
async function verifyFacebookToken(token) {
    try {
        const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Facebook token 驗證失敗:', error);
        return null;
    }
}

// 資料庫操作函數（需要根據你使用的資料庫來實現）
async function getUserByEmail(db, email) {
    // 實現根據 email 查詢用戶
    // 例如使用 D1 資料庫：
    // const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    // return result;
    return null; // 暫時返回 null，需要實際實現
}

async function getUserById(db, id) {
    // 實現根據 id 查詢用戶
    return null; // 暫時返回 null，需要實際實現
}

async function createUser(db, userData) {
    // 實現創建新用戶
    return userData; // 暫時返回用戶資料，需要實際實現
}

async function updateUserLastLogin(db, userId) {
    // 實現更新用戶最後登入時間
    return true; // 暫時返回 true，需要實際實現
}

export { router as authRouter };

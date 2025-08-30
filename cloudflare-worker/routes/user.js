import { Router } from 'itty-router';
import { corsHeaders } from '../utils/cors';
import { requireAuth } from '../utils/auth';

const router = Router({ base: '/user' });

// 取得用戶資料
router.get('/profile', async (request, env) => {
    // 檢查認證
    const authResult = await requireAuth(request, env);
    if (authResult) return authResult;

    try {
        const user = await getUserById(env.DB, request.user.userId);
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('取得用戶資料錯誤:', error);
        return new Response(JSON.stringify({ error: 'Failed to get user profile' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 更新用戶資料
router.put('/profile', async (request, env) => {
    // 檢查認證
    const authResult = await requireAuth(request, env);
    if (authResult) return authResult;

    try {
        const { name, avatar } = await request.json();
        
        // 驗證資料
        if (!name || name.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 更新用戶資料
        const updatedUser = await updateUser(env.DB, request.user.userId, {
            name: name.trim(),
            avatar: avatar || '',
            updatedAt: new Date().toISOString()
        });

        if (!updatedUser) {
            return new Response(JSON.stringify({ error: 'Failed to update user' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                avatar: updatedUser.avatar
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('更新用戶資料錯誤:', error);
        return new Response(JSON.stringify({ error: 'Failed to update user profile' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 刪除帳號
router.delete('/account', async (request, env) => {
    // 檢查認證
    const authResult = await requireAuth(request, env);
    if (authResult) return authResult;

    try {
        const success = await deleteUser(env.DB, request.user.userId);
        
        if (!success) {
            return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('刪除帳號錯誤:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 取得用戶統計資料
router.get('/stats', async (request, env) => {
    // 檢查認證
    const authResult = await requireAuth(request, env);
    if (authResult) return authResult;

    try {
        const stats = await getUserStats(env.DB, request.user.userId);

        return new Response(JSON.stringify({
            success: true,
            stats: stats || {
                totalStocks: 0,
                totalValue: 0,
                todayGain: 0,
                totalGain: 0
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('取得用戶統計錯誤:', error);
        return new Response(JSON.stringify({ error: 'Failed to get user stats' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
});

// 資料庫操作函數（需要根據你使用的資料庫來實現）
async function getUserById(db, id) {
    // 實現根據 id 查詢用戶
    // 例如使用 D1 資料庫：
    // const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    // return result;
    return null; // 暫時返回 null，需要實際實現
}

async function updateUser(db, id, userData) {
    // 實現更新用戶資料
    // 例如使用 D1 資料庫：
    // const result = await db.prepare(
    //     'UPDATE users SET name = ?, avatar = ?, updatedAt = ? WHERE id = ?'
    // ).bind(userData.name, userData.avatar, userData.updatedAt, id).run();
    // return result.success ? userData : null;
    return userData; // 暫時返回用戶資料，需要實際實現
}

async function deleteUser(db, id) {
    // 實現刪除用戶
    // 例如使用 D1 資料庫：
    // const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    // return result.success;
    return true; // 暫時返回 true，需要實際實現
}

async function getUserStats(db, userId) {
    // 實現取得用戶統計資料
    // 這裡可能需要查詢用戶的股票持有、投資組合等資料
    return {
        totalStocks: 0,
        totalValue: 0,
        todayGain: 0,
        totalGain: 0
    }; // 暫時返回空統計，需要實際實現
}

export { router as userRouter };

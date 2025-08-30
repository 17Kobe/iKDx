import jwt from '@tsndr/cloudflare-worker-jwt';

// JWT 密鑰（應該從環境變數取得）
const JWT_SECRET = 'your-super-secret-jwt-key';

// 生成 JWT Token
export async function generateToken(payload, expiresIn = '7d') {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresIn === '7d' ? 7 * 24 * 60 * 60 : 60 * 60); // 7天或1小時

    const token = await jwt.sign({
        ...payload,
        iat: now,
        exp: exp
    }, JWT_SECRET);

    return token;
}

// 驗證 JWT Token
export async function verifyToken(token) {
    try {
        const isValid = await jwt.verify(token, JWT_SECRET);
        if (!isValid) {
            return null;
        }

        const { payload } = jwt.decode(token);
        
        // 檢查是否過期
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token 驗證錯誤:', error);
        return null;
    }
}

// 從 request 中取得 token
export function getTokenFromRequest(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

// 中間件：要求認證
export async function requireAuth(request, env, ctx) {
    const token = getTokenFromRequest(request);
    if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const payload = await verifyToken(token);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 將用戶資訊添加到 request 中
    request.user = payload;
    return null; // 繼續處理
}

import { expose } from 'comlink';

// EPS 計算邏輯（空殼，未來擴充）
async function processEPS(data) {
    // TODO: 實際 EPS 計算邏輯
    return { eps: null };
}

expose({ processEPS });

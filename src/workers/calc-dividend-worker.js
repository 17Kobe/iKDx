import { expose } from 'comlink';

// 股利計算邏輯（空殼，未來擴充）
async function processDividend(data) {
    // TODO: 實際股利計算邏輯
    return { dividend: null };
}

expose({ processDividend });

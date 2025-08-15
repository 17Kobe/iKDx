import { expose } from 'comlink';

function calcSignal(profitData) {
    // TODO: 實際的訊號位置計算邏輯
    return { signal: '訊號位置結果' };
}

async function processSignal(profitData) {
    const signal = calcSignal(profitData);
    return { ...profitData, signal };
}

expose({ processSignal });

import { expose } from 'comlink';

function calcProfit(indicatorsData) {
    // TODO: 實際的報酬率計算邏輯
    return { profit: '報酬率結果' };
}

async function processProfit(indicatorsData) {
    const profit = calcProfit(indicatorsData);
    return { ...indicatorsData, profit };
}

expose({ processProfit });

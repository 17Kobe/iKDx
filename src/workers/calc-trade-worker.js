import { expose } from 'comlink';

function calcTrade(indicatorsData) {
    // TODO: 實際的報酬率計算邏輯
    return { trade: '報酬率結果' };
}

async function processTrade(indicatorsData) {
    const trade = calcTrade(indicatorsData);
    return { ...indicatorsData, trade };
}

expose({ processTrade });

import axios from 'axios';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * 取得 CNN 貪婪與恐懼指數，並寫入 public/data/global.json。
 */
export const fetchCNN = async () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const rootDir = resolve(__dirname, '../../');
    const outDir = resolve(rootDir, 'public/data');
    const outPath = resolve(outDir, 'global.json');

    const res = await axios.get(
        'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
        {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                Referer: 'https://edition.cnn.com/markets/fear-and-greed',
                Origin: 'https://edition.cnn.com',
            },
        }
    );
    const body = res.data;
    let cnnIndex = '';
    let cnnStatus = '';
    let cnnUpdateTime = '';
    if (body.fear_and_greed && typeof body.fear_and_greed === 'object') {
        cnnIndex = body.fear_and_greed.score || '';
        cnnStatus = body.fear_and_greed.rating || '';
        cnnUpdateTime = body.fear_and_greed.timestamp
            ? new Date(body.fear_and_greed.timestamp).toLocaleString('zh-TW', { hour12: false })
            : '';
    }
    // 詳細 log 輸出
    console.log('[CNN 指數資料]', { cnnIndex, cnnStatus, cnnUpdateTime });

    // 確保目錄存在並寫入檔案
    await mkdir(outDir, { recursive: true });
    await writeFile(
        outPath,
        JSON.stringify({ cnnIndex, cnnStatus, cnnUpdateTime }),
        'utf8'
    );
    console.log('CNN 指數已寫入 global.json');
};
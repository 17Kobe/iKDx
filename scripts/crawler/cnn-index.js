import axios from 'axios';
import { writeFileSync } from 'fs';

export const fetchCNN = async () => {
    const res = await axios.get('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            Referer: 'https://edition.cnn.com/markets/fear-and-greed',
            Origin: 'https://edition.cnn.com',
        },
    });
    const body = res.data;
    let index = '';
    let status = '';
    let updateText = '';
    if (body.fear_and_greed && typeof body.fear_and_greed === 'object') {
        index = body.fear_and_greed.score || '';
        status = body.fear_and_greed.rating || '';
        updateText = body.fear_and_greed.timestamp
            ? new Date(body.fear_and_greed.timestamp).toLocaleString('zh-TW', { hour12: false })
            : '';
    }
    writeFileSync(
        '../../public/data/cnn-index.json',
        JSON.stringify({ index, status, updateText })
    );
};

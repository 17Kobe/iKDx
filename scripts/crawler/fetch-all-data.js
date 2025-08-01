import { fetchCNN } from './cnn-index.js';
import { fetchXXX } from './xxx-index.js';

Promise.all([
    fetchCNN(),
    fetchXXX(),
    // 可再加更多 async function
]).then(() => {
    console.log('所有資料已抓取並寫入 JSON');
});

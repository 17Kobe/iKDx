// 全域 axios 設定，支援 GitHub Pages/Cloudflare Pages base 路徑
import axios from 'axios';

const base = import.meta.env.BASE_URL || '/';
axios.defaults.baseURL = base.endsWith('/') ? base : base + '/';

export default axios;

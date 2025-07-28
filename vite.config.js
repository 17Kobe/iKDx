import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/

// 根據部署目標自動切換 base 路徑：
// - 若 DEPLOY_TARGET=github，代表部署到 GitHub Pages，需設 base 為 '/iKDx/'（子目錄）
// - 其他情境（如 Cloudflare Pages）則設 base 為 '/'（根目錄）
// 這樣可讓同一份程式碼同時支援兩平台部署，避免資源路徑錯誤。
const isGitHub = process.env.DEPLOY_TARGET === 'github';

export default defineConfig(async () => ({
    plugins: [vue()],
    // base 路徑自動切換，確保靜態資源載入正確
    base: isGitHub ? '/iKDx/' : '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: 'ws',
                  host,
                  port: 1421,
              }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
        },
    },
}));

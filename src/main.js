import { createApp } from 'vue';
import App from './App.vue';
import 'vant/lib/index.css';
import { createPinia } from 'pinia';
import router from './router';
import '@/styles/main.scss';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

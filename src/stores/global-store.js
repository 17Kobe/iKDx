import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import 'dayjs/locale/zh-tw';
dayjs.extend(weekday);
dayjs.locale('zh-tw');

export const useGlobalStore = defineStore('global', {
    state: () => ({
        cnnIndex: 0,
        cnnLabel: '',
        cnnUpdateTimeLabel: '',
        // raw: null,
    }),
    actions: {
        setGlobal(data) {
            this.cnnIndex = Number(data.cnnIndex) || 0;

            let fearLevel = '';
            if (this.cnnIndex <= 24) {
                fearLevel = '極恐慌';
            } else if (this.cnnIndex <= 44) {
                fearLevel = '恐懼';
            } else if (this.cnnIndex <= 54) {
                fearLevel = '中性';
            } else if (this.cnnIndex <= 74) {
                fearLevel = '貪婪';
            } else {
                fearLevel = '極貪婪';
            }
            this.cnnLabel = `${Math.round(this.cnnIndex)}% ${fearLevel}`;
            // 轉換 cnnUpdateTimeLabel
            if (data.cnnUpdateTime) {
                const d = dayjs(data.cnnUpdateTime.replace(/\//g, '-'));
                const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
                const week = weekMap[d.day()];
                this.cnnUpdateTimeLabel = `${d.format('YYYY/M/D')}(${week}) ${d.format('HH:mm:ss')}`;
            } else {
                this.cnnUpdateTimeLabel = '';
            }
            // this.raw = data;
        },
        reset() {
            this.cnnIndex = 0;
            this.cnnLabel = '';
            this.cnnUpdateTimeLabel = '';
            // this.raw = null;
        },
    },
});

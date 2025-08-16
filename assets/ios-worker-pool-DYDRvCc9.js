function d(a,e=""){const r={context:e,timestamp:new Date().toISOString(),type:a.type||"unknown",message:a.message||"No message",filename:a.filename||"Unknown file",lineno:a.lineno||"Unknown line",colno:a.colno||"Unknown column"};a.error&&(r.errorObject={name:a.error.name||"Unknown",message:a.error.message||"No message",stack:a.error.stack||"No stack trace"});try{r.eventProperties={},["type","message","filename","lineno","colno","timeStamp"].forEach(t=>{t in a&&(r.eventProperties[t]=a[t])})}catch(t){r.serializationError=t.message}return console.error(`🍎 ${e} iOS Worker 錯誤詳情:`,r),r}class w{constructor(e,r=2){this.workerFactory=e,this.maxWorkers=r,this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0,this.initialized=!1,this.initError=null,this.initPromise=this.initializeWorkers()}async initializeWorkers(){console.log("🍎 iOS Worker Pool 初始化開始...");try{for(let e=0;e<this.maxWorkers;e++){console.log(`初始化 iOS Worker ${e}...`);const r=this.workerFactory();r.onerror=t=>{const s=d(t,`iOS Worker ${e} 執行錯誤`);this.initError=new Error(`iOS Worker ${e} 錯誤: ${s.message}`)},r.onmessageerror=t=>{const s=d(t,`iOS Worker ${e} 訊息錯誤`)},this.workers.push({worker:r,busy:!1,messageId:0,pendingMessages:new Map}),this.availableWorkers.push(e)}this.initialized=!0,console.log(`✅ iOS Worker Pool 初始化完成，建立 ${this.workers.length} 個 workers`)}catch(e){console.error("❌ iOS Worker Pool 初始化失敗:",e),this.initError=e}}async waitForInitialization(){this.initPromise&&await this.initPromise}async execute(e,...r){if(await this.waitForInitialization(),this.initError)throw new Error(`iOS Worker Pool 初始化失敗: ${this.initError.message}`);if(!this.initialized)throw new Error("iOS Worker Pool 尚未初始化完成");return new Promise((t,s)=>{const o=setTimeout(()=>{s(new Error(`iOS Worker 任務 ${e} 執行超時`))},15e3);this.queue.push({method:e,args:r,resolve:i=>{clearTimeout(o),t(i)},reject:i=>{clearTimeout(o),s(i)}}),this.processQueue()})}processQueue(){if(this.queue.length===0||this.availableWorkers.length===0)return;const e=this.availableWorkers.shift(),r=this.workers[e],{method:t,args:s,resolve:o,reject:i}=this.queue.shift();r.busy=!0,this.activeJobs++;const n=++r.messageId,k={id:n,method:t,args:s},l=y=>{const{id:h,result:g,error:c}=y.data;h===n&&(r.worker.removeEventListener("message",l),r.busy=!1,this.availableWorkers.push(e),this.activeJobs--,c?i(new Error(c)):o(g),this.processQueue())};r.worker.addEventListener("message",l),r.worker.postMessage(k)}destroy(){this.workers.forEach(({worker:e})=>{e.terminate()}),this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0}}function u(){const a=`
        // iOS Safari 專用的簡化週線計算 Worker
        
        // 簡化的 dayjs 實作（避免模組導入問題）
        function parseDate(dateStr) {
            return new Date(dateStr);
        }
        
        function getWeekStart(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整到週一
            return new Date(d.setDate(diff));
        }
        
        // 簡化的 lodash 功能
        function min(array) {
            return Math.min(...array);
        }
        
        function max(array) {
            return Math.max(...array);
        }
        
        function sum(array) {
            return array.reduce((a, b) => a + b, 0);
        }
        
        function slice(array, start, end) {
            return array.slice(start, end);
        }
        
        /**
         * 從 daily 資料計算週線 OHLC
         */
        function calcWeeklyFromDaily(dailyData) {
            if (!dailyData || dailyData.length === 0) {
                return [];
            }
            
            const resData = [];
            let i = dailyData.length - 1;
            let j = i;
            let firstDayOfWeek = getWeekStart(new Date(dailyData[i][0]));
            
            while (i >= 0) {
                const currentDate = new Date(dailyData[i][0]);
                
                if (currentDate < firstDayOfWeek || i === 0) {
                    const startIndex = i + 1;
                    const endIndex = j;
                    const range2dArray = slice(dailyData, startIndex, endIndex + 1);
                    const rangeHighArray = range2dArray.map(v => v[2]);
                    const rangeLowArray = range2dArray.map(v => v[3]);
                    const rangeTradingVolumeArray = range2dArray.map(v => (v.length >= 6 ? v[5] : 0));
                    
                    const date = dailyData[endIndex][0];
                    const open = dailyData[startIndex][1];
                    const close = dailyData[endIndex][4];
                    const low = min(rangeLowArray);
                    const high = max(rangeHighArray);
                    const tradingVolume = sum(rangeTradingVolumeArray);
                    
                    resData.push([date, open, high, low, close, tradingVolume]);
                    j = startIndex - 1;
                    
                    firstDayOfWeek = getWeekStart(new Date(dailyData[i][0]));
                }
                i -= 1;
            }
            
            return resData.reverse();
        }
        
        /**
         * 簡化的 KDJ 計算
         */
        function calcWeeklyKdj(weeklyData, period = 9) {
            if (!weeklyData || weeklyData.length < period) {
                return { data: [] };
            }
            
            const kdjData = [];
            let k = 50, d = 50;
            
            for (let i = period - 1; i < weeklyData.length; i++) {
                const rangeLow = min(weeklyData.slice(i - period + 1, i + 1).map(v => v[3]));
                const rangeHigh = max(weeklyData.slice(i - period + 1, i + 1).map(v => v[2]));
                const close = weeklyData[i][4];
                
                const rsv = rangeHigh === rangeLow ? 50 : ((close - rangeLow) / (rangeHigh - rangeLow)) * 100;
                
                k = (2/3) * k + (1/3) * rsv;
                d = (2/3) * d + (1/3) * k;
                const j = 3 * k - 2 * d;
                
                kdjData.push([weeklyData[i][0], k, d, j]);
            }
            
            return { data: kdjData };
        }
        
        /**
         * 簡化的 RSI 計算
         */
        function calcWeeklyRsi(weeklyData, period = 14) {
            if (!weeklyData || weeklyData.length < period + 1) {
                return [];
            }
            
            const rsiData = [];
            
            for (let i = period; i < weeklyData.length; i++) {
                let gains = 0, losses = 0;
                
                for (let j = i - period + 1; j <= i; j++) {
                    const change = weeklyData[j][4] - weeklyData[j - 1][4];
                    if (change > 0) {
                        gains += change;
                    } else {
                        losses -= change;
                    }
                }
                
                const avgGain = gains / period;
                const avgLoss = losses / period;
                const rs = avgGain / (avgLoss || 1);
                const rsi = 100 - (100 / (1 + rs));
                
                rsiData.push([weeklyData[i][0], rsi]);
            }
            
            return rsiData;
        }
        
        /**
         * 移動平均線計算
         */
        function calcMA(weeklyData, periods = [5, 10, 20]) {
            const maData = {};
            
            periods.forEach(period => {
                maData['ma' + period] = [];
                
                for (let i = period - 1; i < weeklyData.length; i++) {
                    const sum = weeklyData.slice(i - period + 1, i + 1)
                        .reduce((acc, curr) => acc + curr[4], 0);
                    const avg = sum / period;
                    maData['ma' + period].push([weeklyData[i][0], avg]);
                }
            });
            
            return maData;
        }
        
        /**
         * 處理政策訊息
         */
        function processPolicy(data) {
            const { stockId, dailyData } = data;
            
            try {
                // 計算週線
                const weeklyData = calcWeeklyFromDaily(dailyData);
                
                // 計算技術指標
                const weeklyKdj = calcWeeklyKdj(weeklyData);
                const weeklyRsi = calcWeeklyRsi(weeklyData);
                const ma = calcMA(weeklyData);
                
                return {
                    stockId,
                    weekly: weeklyData.slice(-26),
                    weeklyKdj: weeklyKdj.data.slice(-26),
                    weeklyRsi: weeklyRsi.slice(-26),
                    ma,
                };
            } catch (error) {
                throw new Error('iOS 週線計算失敗: ' + error.message);
            }
        }
        
        /**
         * Worker 訊息處理器
         */
        self.addEventListener('message', function(event) {
            const { id, method, args } = event.data;
            
            try {
                let result;
                
                switch (method) {
                    case 'ping':
                        result = {
                            status: 'ok',
                            timestamp: Date.now(),
                            workerType: 'ios-weekly-policy-worker',
                            platform: 'iOS Safari'
                        };
                        break;
                        
                    case 'processPolicy':
                        result = processPolicy(args[0]);
                        break;
                        
                    default:
                        throw new Error('未知的方法: ' + method);
                }
                
                self.postMessage({ id, result });
                
            } catch (error) {
                self.postMessage({ 
                    id, 
                    error: error.message || 'iOS Worker 執行錯誤' 
                });
            }
        });
        
        console.log('🍎 iOS 週線計算 Worker 已準備就緒');
    `,e=new Blob([a],{type:"application/javascript"});return new Worker(URL.createObjectURL(e))}export{w as IOSWorkerPool,u as createIOSWeeklyPolicyWorker};

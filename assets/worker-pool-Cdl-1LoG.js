import{aL as L}from"./index-DWBRBwG1.js";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */const b=Symbol("Comlink.proxy"),I=Symbol("Comlink.endpoint"),A=Symbol("Comlink.releaseProxy"),w=Symbol("Comlink.finalizer"),y=Symbol("Comlink.thrown"),M=r=>typeof r=="object"&&r!==null||typeof r=="function",F={canHandle:r=>M(r)&&r[b],serialize(r){const{port1:e,port2:t}=new MessageChannel;return E(r,e),[t,[t]]},deserialize(r){return r.start(),O(r)}},N={canHandle:r=>M(r)&&y in r,serialize({value:r}){let e;return r instanceof Error?e={isError:!0,value:{message:r.message,name:r.name,stack:r.stack}}:e={isError:!1,value:r},[e,[]]},deserialize(r){throw r.isError?Object.assign(new Error(r.value.message),r.value):r.value}},v=new Map([["proxy",F],["throw",N]]);function q(r,e){for(const t of r)if(e===t||t==="*"||t instanceof RegExp&&t.test(e))return!0;return!1}function E(r,e=globalThis,t=["*"]){e.addEventListener("message",function o(s){if(!s||!s.data)return;if(!q(t,s.origin)){console.warn(`Invalid origin '${s.origin}' for comlink proxy`);return}const{id:i,type:n,path:l}=Object.assign({path:[]},s.data),a=(s.data.argumentList||[]).map(d);let c;try{const u=l.slice(0,-1).reduce((h,k)=>h[k],r),g=l.reduce((h,k)=>h[k],r);switch(n){case"GET":c=g;break;case"SET":u[l.slice(-1)[0]]=d(s.data.value),c=!0;break;case"APPLY":c=g.apply(u,a);break;case"CONSTRUCT":{const h=new g(...a);c=R(h)}break;case"ENDPOINT":{const{port1:h,port2:k}=new MessageChannel;E(r,k),c=T(h,[h])}break;case"RELEASE":c=void 0;break;default:return}}catch(u){c={value:u,[y]:0}}Promise.resolve(c).catch(u=>({value:u,[y]:0})).then(u=>{const[g,h]=S(u);e.postMessage(Object.assign(Object.assign({},g),{id:i}),h),n==="RELEASE"&&(e.removeEventListener("message",o),C(e),w in r&&typeof r[w]=="function"&&r[w]())}).catch(u=>{const[g,h]=S({value:new TypeError("Unserializable return value"),[y]:0});e.postMessage(Object.assign(Object.assign({},g),{id:i}),h)})}),e.start&&e.start()}function J(r){return r.constructor.name==="MessagePort"}function C(r){J(r)&&r.close()}function O(r,e){const t=new Map;return r.addEventListener("message",function(s){const{data:i}=s;if(!i||!i.id)return;const n=t.get(i.id);if(n)try{n(i)}finally{t.delete(i.id)}}),P(r,t,[],e)}function m(r){if(r)throw new Error("Proxy has been released and is not useable")}function j(r){return f(r,new Map,{type:"RELEASE"}).then(()=>{C(r)})}const p=new WeakMap,W="FinalizationRegistry"in globalThis&&new FinalizationRegistry(r=>{const e=(p.get(r)||0)-1;p.set(r,e),e===0&&j(r)});function _(r,e){const t=(p.get(e)||0)+1;p.set(e,t),W&&W.register(r,e,r)}function H(r){W&&W.unregister(r)}function P(r,e,t=[],o=function(){}){let s=!1;const i=new Proxy(o,{get(n,l){if(m(s),l===A)return()=>{H(i),j(r),e.clear(),s=!0};if(l==="then"){if(t.length===0)return{then:()=>i};const a=f(r,e,{type:"GET",path:t.map(c=>c.toString())}).then(d);return a.then.bind(a)}return P(r,e,[...t,l])},set(n,l,a){m(s);const[c,u]=S(a);return f(r,e,{type:"SET",path:[...t,l].map(g=>g.toString()),value:c},u).then(d)},apply(n,l,a){m(s);const c=t[t.length-1];if(c===I)return f(r,e,{type:"ENDPOINT"}).then(d);if(c==="bind")return P(r,e,t.slice(0,-1));const[u,g]=D(a);return f(r,e,{type:"APPLY",path:t.map(h=>h.toString()),argumentList:u},g).then(d)},construct(n,l){m(s);const[a,c]=D(l);return f(r,e,{type:"CONSTRUCT",path:t.map(u=>u.toString()),argumentList:a},c).then(d)}});return _(i,r),i}function V(r){return Array.prototype.concat.apply([],r)}function D(r){const e=r.map(S);return[e.map(t=>t[0]),V(e.map(t=>t[1]))]}const z=new WeakMap;function T(r,e){return z.set(r,e),r}function R(r){return Object.assign(r,{[b]:!0})}function S(r){for(const[e,t]of v)if(t.canHandle(r)){const[o,s]=t.serialize(r);return[{type:"HANDLER",name:e,value:o},s]}return[{type:"RAW",value:r},z.get(r)||[]]}function d(r){switch(r.type){case"HANDLER":return v.get(r.name).deserialize(r.value);case"RAW":return r.value}}function f(r,e,t,o){return new Promise(s=>{const i=K();e.set(i,s),r.start&&r.start(),r.postMessage(Object.assign({id:i},t),o)})}function K(){return new Array(4).fill(0).map(()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)).join("-")}const ee=Object.freeze(Object.defineProperty({__proto__:null,createEndpoint:I,expose:E,finalizer:w,proxy:R,proxyMarker:b,releaseProxy:A,transfer:T,transferHandlers:v,wrap:O},Symbol.toStringTag,{value:"Module"}));function x(r,e=""){const t={context:e,timestamp:new Date().toISOString(),type:r.type||"unknown",message:r.message||"No message",filename:r.filename||"Unknown file",lineno:r.lineno||"Unknown line",colno:r.colno||"Unknown column"};r.error&&(t.errorObject={name:r.error.name||"Unknown",message:r.error.message||"No message",stack:r.error.stack||"No stack trace"});try{t.eventProperties={},["type","message","filename","lineno","colno","timeStamp"].forEach(o=>{o in r&&(t.eventProperties[o]=r[o])})}catch(o){t.serializationError=o.message}return console.error(`🍎 ${e} iOS Worker 錯誤詳情:`,t),t}class U{constructor(e,t=2){this.workerFactory=e,this.maxWorkers=t,this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0,this.initialized=!1,this.initError=null,this.initPromise=this.initializeWorkers()}async initializeWorkers(){console.log("🍎 iOS Worker Pool 初始化開始...");try{for(let e=0;e<this.maxWorkers;e++){console.log(`初始化 iOS Worker ${e}...`);const t=this.workerFactory();t.onerror=o=>{const s=x(o,`iOS Worker ${e} 執行錯誤`);this.initError=new Error(`iOS Worker ${e} 錯誤: ${s.message}`)},t.onmessageerror=o=>{const s=x(o,`iOS Worker ${e} 訊息錯誤`)},this.workers.push({worker:t,busy:!1,messageId:0,pendingMessages:new Map}),this.availableWorkers.push(e)}this.initialized=!0,console.log(`✅ iOS Worker Pool 初始化完成，建立 ${this.workers.length} 個 workers`)}catch(e){console.error("❌ iOS Worker Pool 初始化失敗:",e),this.initError=e}}async waitForInitialization(){this.initPromise&&await this.initPromise}async execute(e,...t){if(await this.waitForInitialization(),this.initError)throw new Error(`iOS Worker Pool 初始化失敗: ${this.initError.message}`);if(!this.initialized)throw new Error("iOS Worker Pool 尚未初始化完成");return new Promise((o,s)=>{const i=setTimeout(()=>{s(new Error(`iOS Worker 任務 ${e} 執行超時`))},15e3);this.queue.push({method:e,args:t,resolve:n=>{clearTimeout(i),o(n)},reject:n=>{clearTimeout(i),s(n)}}),this.processQueue()})}processQueue(){if(this.queue.length===0||this.availableWorkers.length===0)return;const e=this.availableWorkers.shift(),t=this.workers[e],{method:o,args:s,resolve:i,reject:n}=this.queue.shift();t.busy=!0,this.activeJobs++;const l=++t.messageId,a={id:l,method:o,args:s},c=u=>{const{id:g,result:h,error:k}=u.data;g===l&&(t.worker.removeEventListener("message",c),t.busy=!1,this.availableWorkers.push(e),this.activeJobs--,k?n(new Error(k)):i(h),this.processQueue())};t.worker.addEventListener("message",c),t.worker.postMessage(a)}destroy(){this.workers.forEach(({worker:e})=>{e.terminate()}),this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0}}function $(){const r=`
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
    `,e=new Blob([r],{type:"application/javascript"});return new Worker(URL.createObjectURL(e))}const re=Object.freeze(Object.defineProperty({__proto__:null,IOSWorkerPool:U,createIOSWeeklyPolicyWorker:$},Symbol.toStringTag,{value:"Module"}));function B(){const r=navigator.userAgent;return/iPad|iPhone|iPod/.test(r)}function G(r,e=""){const t={context:e,timestamp:new Date().toISOString(),type:r.type||"unknown",message:r.message||"No message",filename:r.filename||"Unknown file",lineno:r.lineno||"Unknown line",colno:r.colno||"Unknown column"};r.error&&(t.errorObject={name:r.error.name||"Unknown",message:r.error.message||"No message",stack:r.error.stack||"No stack trace"});try{const o=Object.getOwnPropertyNames(r);t.eventProperties={},o.forEach(s=>{try{const i=r[s];typeof i!="function"&&(t.eventProperties[s]=i)}catch(i){t.eventProperties[s]=`[Unable to access: ${i.message}]`}})}catch(o){t.serializationError=o.message}return t.environment={userAgent:navigator.userAgent,isIOS:/iPad|iPhone|iPod/.test(navigator.userAgent),isMobile:/Mobile|Android|iPhone|iPad/.test(navigator.userAgent),language:navigator.language,platform:navigator.platform,onLine:navigator.onLine},t}function Q(r,e=""){const t=G(r,e);return console.error(`🚨 ${e} 詳細錯誤報告:`),console.error("📍 基本資訊:",{類型:t.type,訊息:t.message,檔案:t.filename,行號:t.lineno,列號:t.colno,時間:t.timestamp}),t.errorObject&&console.error("🔍 錯誤物件:",t.errorObject),t.eventProperties&&console.error("📋 事件屬性:",t.eventProperties),console.error("🌐 環境資訊:",t.environment),console.error("📄 完整錯誤 JSON:",JSON.stringify(t,null,2)),t}class Y{constructor(e,t=navigator.hardwareConcurrency||4){this.workerUrl=e,this.maxWorkers=Math.min(t,4),this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0,this.statusCallbacks=new Set,this.initialized=!1,this.initError=null,this.initPromise=null,this.isIOSMode=!1,this.iosPool=null,console.log("Worker Pool 構造函數調試:",{workerUrl:e,workerUrlType:typeof e,workerUrlString:e.toString(),isURL:e instanceof URL}),B()?(console.log("🍎 檢測到 iOS 裝置，啟用原生 Worker Pool 模式"),this.isIOSMode=!0,this.initPromise=this.initializeIOSWorkers()):this.initPromise=this.initializeWorkers()}async initializeIOSWorkers(){console.log("🍎 iOS Safari 專用 Worker Pool 初始化開始...");try{if(this.workerUrl.toString().includes("calc-weekly-policy-worker")){if(this.iosPool=new U($,Math.min(this.maxWorkers,2)),await this.iosPool.waitForInitialization(),this.iosPool.initError)throw this.iosPool.initError;this.initialized=!0,console.log("✅ iOS 週線計算 Worker Pool 初始化完成")}else console.log("⚠️ iOS 模式下暫不支援此 Worker，回退到基本實作"),this.initialized=!0}catch(e){console.error("❌ iOS Worker Pool 初始化失敗:",e),this.initError=e,this.initialized=!1}}async waitForInitialization(){this.initPromise&&await this.initPromise}async initializeWorkers(){console.log(`開始初始化 Worker Pool: ${this.workerUrl}`),console.log("瀏覽器環境診斷:",{userAgent:navigator.userAgent,isIOS:/iPad|iPhone|iPod/.test(navigator.userAgent),isSafari:/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent),workerSupport:typeof Worker<"u",moduleSupport:typeof module<"u",urlSupport:typeof URL<"u",blobSupport:typeof Blob<"u"});try{if(typeof Worker>"u")throw new Error("此瀏覽器不支援 Web Workers");const e=/iPad|iPhone|iPod/.test(navigator.userAgent),t=/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent);if(e){console.log("檢測到 iOS 裝置，進行相容性測試...");try{const o='console.log("test");',s=new Blob([o],{type:"application/javascript"});new Worker(URL.createObjectURL(s)).terminate(),console.log("✅ iOS 基本 Worker 創建測試通過")}catch(o){throw console.error("❌ iOS 基本 Worker 創建失敗:",o),new Error(`iOS Worker 基本測試失敗: ${o.message}`)}try{const o=`
                        import { expose } from 'https://unpkg.com/comlink/dist/esm/comlink.mjs';
                        expose({ test: () => 'ok' });
                    `,s=new Blob([o],{type:"application/javascript"}),i=new Worker(URL.createObjectURL(s),{type:"module"});await new Promise((n,l)=>{const a=setTimeout(()=>{i.terminate(),n()},1e3);i.onerror=c=>{const u=Q(c,"iOS ES Module Worker 測試錯誤");clearTimeout(a),i.terminate(),l(c)}}),console.log("✅ iOS ES Module Worker 測試通過")}catch(o){console.error("❌ iOS ES Module Worker 測試失敗:",o),console.log("嘗試降級到 Classic Worker...")}}for(let o=0;o<this.maxWorkers;o++){console.log(`初始化 Worker ${o}...`);try{let s,i;if(e&&t){console.log("為 iOS Safari 使用特殊初始化策略...");try{s=new Worker(this.workerUrl,{type:"module"}),console.log(`Worker ${o} ES Module 模式創建成功`)}catch(l){console.warn(`Worker ${o} ES Module 模式失敗，嘗試 Classic 模式:`,l);try{s=new Worker(this.workerUrl),console.log(`Worker ${o} Classic 模式創建成功`)}catch(a){throw console.error(`Worker ${o} Classic 模式也失敗:`,a),new Error(`iOS Worker 創建失敗: Module=${l.message}, Classic=${a.message}`)}}}else s=new Worker(this.workerUrl,{type:"module"});const n=`Worker-${o}-${this.workerUrl.toString().split("/").pop()}`;s=L(s,n),i=O(s);try{console.log(`測試 Worker ${o} Comlink 通訊...`);const l=e?2e3:500;if(await new Promise(a=>setTimeout(a,l)),typeof i.ping=="function"){const a=await Promise.race([i.ping(),new Promise((c,u)=>setTimeout(()=>u(new Error("Ping 超時")),5e3))]);console.log(`Worker ${o} ping 測試結果:`,a)}console.log(`✅ Worker ${o} 初始化和通訊測試成功`)}catch(l){if(console.warn(`⚠️ Worker ${o} 通訊測試失敗:`,l),console.warn("但 Worker 已創建，將保留以進行實際任務測試"),!e)throw l}this.workers.push({worker:s,api:i,busy:!1}),this.availableWorkers.push(o)}catch(s){if(console.error(`❌ 建立 Worker ${o} 失敗:`,s),console.error("Worker 錯誤詳細資訊:",{message:s.message,stack:s.stack,name:s.name,cause:s.cause}),this.initError=s,!e)break}}if(this.workers.length>0)this.initialized=!0,console.log(`✅ Worker Pool 初始化完成，成功建立 ${this.workers.length} 個 workers`),e&&console.log("iOS Worker Pool 狀態報告:",{totalRequested:this.maxWorkers,successfullyCreated:this.workers.length,failureRate:((this.maxWorkers-this.workers.length)/this.maxWorkers*100).toFixed(1)+"%"});else throw new Error("無法建立任何 Worker")}catch(e){console.error("❌ Worker Pool 初始化失敗:",e),console.error("初始化失敗詳細資訊:",{message:e.message,stack:e.stack,workerUrl:this.workerUrl,maxWorkers:this.maxWorkers,platform:{isIOS:/iPad|iPhone|iPod/.test(navigator.userAgent),isSafari:/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent),userAgent:navigator.userAgent}}),this.initError=e,this.initialized=!1}}onStatusChange(e){this.statusCallbacks.add(e),e(this.getStatus())}offStatusChange(e){this.statusCallbacks.delete(e)}getStatus(){return this.isIOSMode&&this.iosPool?{mode:"iOS",totalWorkers:this.iosPool.maxWorkers,availableWorkers:this.iosPool.availableWorkers.length,busyWorkers:this.iosPool.maxWorkers-this.iosPool.availableWorkers.length,queuedTasks:this.iosPool.queue.length,activeJobs:this.iosPool.activeJobs,utilization:((this.iosPool.maxWorkers-this.iosPool.availableWorkers.length)/this.iosPool.maxWorkers*100).toFixed(1)}:{mode:"Standard",totalWorkers:this.maxWorkers,availableWorkers:this.availableWorkers.length,busyWorkers:this.maxWorkers-this.availableWorkers.length,queuedTasks:this.queue.length,activeJobs:this.activeJobs,utilization:((this.maxWorkers-this.availableWorkers.length)/this.maxWorkers*100).toFixed(1)}}notifyStatusChange(){const e=this.getStatus();this.statusCallbacks.forEach(t=>{try{t(e)}catch(o){console.error("Worker Pool 狀態回調錯誤:",o)}})}async execute(e,...t){if(await this.waitForInitialization(),this.initError)throw new Error(`Worker Pool 初始化失敗: ${this.initError.message}`);if(!this.initialized)throw new Error("Worker Pool 尚未初始化完成");return this.isIOSMode&&this.iosPool?await this.iosPool.execute(e,...t):new Promise((o,s)=>{const i=setTimeout(()=>{s(new Error(`Worker 任務 ${e} 執行超時`))},3e4);this.queue.push({method:e,args:t,resolve:n=>{clearTimeout(i),o(n)},reject:n=>{clearTimeout(i),s(n)}}),this.notifyStatusChange(),this.processQueue()})}processQueue(){if(this.queue.length===0||this.availableWorkers.length===0)return;const e=this.availableWorkers.shift(),t=this.workers[e],{method:o,args:s,resolve:i,reject:n}=this.queue.shift();t.busy=!0,this.activeJobs++,this.notifyStatusChange(),(async()=>{try{const a=await t.api[o](...s);i(a)}catch(a){console.error(`Worker 任務 ${o} 執行失敗:`,a),a.message.includes("import")||a.message.includes("module")?n(new Error(`iOS Safari Worker 相容性問題: ${a.message}`)):n(a)}finally{t.busy=!1,this.availableWorkers.push(e),this.activeJobs--,this.notifyStatusChange(),this.processQueue()}})()}async waitForAll(){for(;this.activeJobs>0||this.queue.length>0;)await new Promise(e=>setTimeout(e,10))}destroy(){this.statusCallbacks.clear(),this.isIOSMode&&this.iosPool?(this.iosPool.destroy(),this.iosPool=null):this.workers.forEach(({worker:e})=>{e.terminate()}),this.workers=[],this.availableWorkers=[],this.queue=[],this.activeJobs=0}}class X{constructor(){this.pools=new Map}getPool(e,t,o){return this.pools.has(e)||this.pools.set(e,new Y(t,o)),this.pools.get(e)}async waitForAllInitialization(){const e=Array.from(this.pools.values()).map(t=>t.waitForInitialization());await Promise.all(e)}getAllStatus(){const e={};return this.pools.forEach((t,o)=>{e[o]=t.getStatus()}),e}onAllStatusChange(e){this.pools.forEach((t,o)=>{t.onStatusChange(s=>{e(o,s,this.getAllStatus())})})}getPoolStatus(e){const t=this.pools.get(e);return t?t.getStatus():null}destroyPool(e){this.pools.has(e)&&(this.pools.get(e).destroy(),this.pools.delete(e))}destroyAll(){this.pools.forEach(e=>e.destroy()),this.pools.clear()}}const te=new X;export{ee as c,re as i,te as w};

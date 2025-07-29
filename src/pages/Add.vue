<template>
    <div style="padding: 16px; background: #f8f9fa; min-height: 100vh;">
        <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">新增股票</h2>
            
            <!-- 搜尋框 -->
            <Search
                v-model="searchValue"
                placeholder="搜尋股票代號或名稱"
                shape="round"
                @search="onSearch"
                @clear="onClear"
            />
        </div>

        <!-- 搜尋結果列表 -->
        <div v-if="searchResults.length > 0" style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #666;">搜尋結果</h3>
            <Card v-for="stock in searchResults" :key="stock.code" style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">{{ stock.name }}</div>
                        <div style="color: #666; font-size: 14px;">{{ stock.code }}</div>
                    </div>
                    <Button type="primary" size="small" @click="addStock(stock)">
                        新增
                    </Button>
                </div>
            </Card>
        </div>

        <!-- 熱門股票推薦 -->
        <div v-if="searchValue === ''">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #666;">熱門股票</h3>
            <Card v-for="stock in popularStocks" :key="stock.code" style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">{{ stock.name }}</div>
                        <div style="color: #666; font-size: 14px;">{{ stock.code }}</div>
                    </div>
                    <Button type="primary" size="small" @click="addStock(stock)">
                        新增
                    </Button>
                </div>
            </Card>
        </div>

        <!-- 空狀態 -->
        <div v-if="searchValue !== '' && searchResults.length === 0" style="text-align: center; padding: 40px 0; color: #999;">
            查無相關股票
        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { Search, Card, Button, showToast } from 'vant';
    import { useRouter } from 'vue-router';

    const router = useRouter();
    const searchValue = ref('');
    const searchResults = ref([]);

    // 熱門股票數據（模擬）
    const popularStocks = ref([
        { code: '2330', name: '台積電' },
        { code: '2317', name: '鴻海' },
        { code: '2454', name: '聯發科' },
        { code: '2412', name: '中華電' },
        { code: '1301', name: '台塑' },
        { code: '2882', name: '國泰金' },
    ]);

    // 全部股票數據（模擬）
    const allStocks = [
        { code: '2330', name: '台積電' },
        { code: '2317', name: '鴻海' },
        { code: '2454', name: '聯發科' },
        { code: '2412', name: '中華電' },
        { code: '1301', name: '台塑' },
        { code: '2882', name: '國泰金' },
        { code: '2881', name: '富邦金' },
        { code: '2303', name: '聯電' },
        { code: '2308', name: '台達電' },
        { code: '1303', name: '南亞' },
    ];

    function onSearch() {
        if (!searchValue.value.trim()) {
            searchResults.value = [];
            return;
        }

        // 模擬搜尋邏輯
        searchResults.value = allStocks.filter(stock => 
            stock.code.includes(searchValue.value) || 
            stock.name.includes(searchValue.value)
        );
    }

    function onClear() {
        searchResults.value = [];
    }

    function addStock(stock) {
        showToast(`已新增 ${stock.name} (${stock.code}) 到自選股`);
        // 這裡可以加入實際的新增邏輯，如 API 呼叫
        setTimeout(() => {
            router.push('/');
        }, 1000);
    }
</script>

<template>
    <div style="padding: 32px">
        自選股頁面324234234234234234324234234234
        <FloatingBubble
            icon="plus"
            axis="xy"
            magnetic="x"
            :gap="{ x: 24, y: 80 }"
            style="--van-floating-bubble-size: 48px"
            @click="onBubbleClick"
        />
        <StockSearch v-model:show="showSheet" />
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { FloatingBubble } from 'vant';
    import StockSearch from '@/components/StockSearch.vue';

    const showSheet = ref(false);
    function onBubbleClick() {
        showSheet.value = true;
    }
</script>

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
        <StockSearch />
    </div>
</template>

<script setup>
    import { FloatingBubble } from 'vant';
    import StockSearch from '@/components/StockSearch.vue';
    import { useEventBus } from '@vueuse/core';

    // 事件總線
    const bus = useEventBus('stock-search');

    function onBubbleClick() {
        bus.emit(true);
    }
</script>

<template>
    <div style="padding: 32px">
        自選股頁面324234234234234234324234234234
        <FloatingBubble
            icon="plus"
            axis="xy"
            magnetic="x"
            :gap="{ x: 24, y: 100 }"
            style="--van-floating-bubble-size: 48px"
            @click="onBubbleClick"
        />
    </div>
</template>

<script setup>
    import { FloatingBubble } from 'vant';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    function onBubbleClick() {
        router.push('/add');
    }
</script>

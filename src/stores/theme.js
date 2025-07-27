import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { usePreferredDark } from '@vueuse/core';

export const useThemeStore = defineStore('theme', () => {
    // 0: 跟隨系統, 1: 亮, 2: 暗
    const mode = ref(0);
    const isDark = ref(false);

    // 跟隨系統
    const systemDark = usePreferredDark();

    // 根據 mode 計算 isDark
    watch(
        [mode, systemDark],
        () => {
            if (mode.value === 0) {
                isDark.value = systemDark.value;
            } else if (mode.value === 1) {
                isDark.value = false;
            } else {
                isDark.value = true;
            }
            document.body.classList.toggle('dark', isDark.value);
        },
        { immediate: true }
    );

    return { mode, isDark };
});

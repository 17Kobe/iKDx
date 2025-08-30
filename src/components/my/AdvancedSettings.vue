<template>
    <div class="advanced-settings">
        <div class="setting-list">
            <!-- 開發者設定 -->
            <div class="setting-item" @click="$emit('showDeveloper')">
                <div class="setting-left">
                    <span class="setting-title">開發者</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>

            <!-- 應用資訊 -->
            <div class="setting-item" @click="$emit('showAppInfo')">
                <div class="setting-left">
                    <span class="setting-title">應用資訊</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>

            <!-- 清除快取 -->
            <div class="setting-item" @click="$emit('clearCache')">
                <div class="setting-left">
                    <span class="setting-title">清除快取</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>

            <!-- 備份與還原 -->
            <div class="setting-item" @click="$emit('showBackup')">
                <div class="setting-left">
                    <span class="setting-title">備份與還原</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>

            <!-- 實驗性功能 -->
            <div class="setting-item" @click="$emit('showExperimental')">
                <div class="setting-left">
                    <span class="setting-title">實驗性功能</span>
                </div>
                <div class="setting-right">
                    <span class="arrow">></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    // Emits
    defineEmits([
        'showDeveloper',
        'showAppInfo', 
        'clearCache',
        'showBackup',
        'showExperimental'
    ]);
</script>

<style scoped>
    .advanced-settings {
        padding: 0 16px;
        min-height: 400px;
    }

    .setting-list {
        background: white;
        margin: 16px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #f5f5f5;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .setting-item:last-child {
        border-bottom: none;
    }

    .setting-item:hover {
        background-color: #f8f9fa;
    }

    .setting-item:active {
        background-color: #f0f1f2;
    }

    .setting-left {
        display: flex;
        align-items: center;
    }

    .setting-title {
        font-size: 16px;
        color: #333;
        font-weight: 500;
    }

    .setting-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .arrow {
        font-size: 16px;
        color: #c8c9cc;
        font-weight: bold;
    }
</style>

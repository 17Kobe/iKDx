#!/usr/bin/env bash

# 原始 Windows 路徑（注意不要寫混斜線）
JAVA_HOME=$(cygpath "C:\Program Files\Android\Android Studio\jbr")
RAW_ANDROID_HOME="$LOCALAPPDATA\\Android\\Sdk"

# 統一轉成 Unix 路徑
ANDROID_HOME=$(cygpath "$RAW_ANDROID_HOME")

# 找最新的 NDK 版本（用已轉好的 Unix 路徑）
NDK_LATEST=$(ls -1 "$ANDROID_HOME/ndk" 2>/dev/null | sort | tail -n1)
NDK_HOME="$ANDROID_HOME/ndk/$NDK_LATEST"

echo "設定環境變數："
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "NDK_HOME=$NDK_HOME"

export JAVA_HOME
export ANDROID_HOME
export NDK_HOME

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

echo "PATH 已更新"
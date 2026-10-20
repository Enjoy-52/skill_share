---
name: android-mirror-ios
description: >-
  Forces Android UI/UX to fully replicate the iOS counterpart with no style
  innovation; Kotlin-first Android implementation. Use when building or
  changing Android screens, layouts, themes, login/home/mine/discover tabs,
  dual-platform mobile work, or when the user mentions 复刻 iOS、对齐 iOS、
  Android 跟 iOS、双端一致、Kotlin 优先.
---

# Android 复刻 iOS（全局）

用户原话（verbatim，始终遵守）：

> android端的设计完全复刻iOS端，不要自行创新和修改风格，没有iOS时，方可自行使用android的设计，android的实现优先使用kotlin，这个规则始终记忆下来，应用到cursor开发过项目的全局。

## 硬规则

1. **有 iOS 对照时**：Android 的信息架构、文案、层级、间距节奏、颜色、圆角、控件形态、空态/加载/错误态，必须以 iOS 为准**完全复刻**。
2. **禁止**：自行「优化」视觉、换 Material 默认风格、改文案语气、增减主按钮/装饰、用 Android 习惯替代 iOS 布局（除非平台硬性无法实现，且须在回复中注明）。
3. **无 iOS 时**：方可按 Android 常规设计；仍优先 Kotlin。
4. **实现语言**：Android 新代码 / 可改写逻辑 **优先 Kotlin**；勿无 Java 写新功能，除非改动极小且文件本为 Java、或项目强制要求。

## 工作流（改 Android UI 前）

1. 定位对应 iOS 实现（SwiftUI / UIKit / 资源色值）。
2. 列出须对齐项：顶栏、主内容、底栏、主色、字号层级、按钮形状、协议/第三方等细节。
3. 再写 Android（Kotlin + XML/Compose），对照清单自检。
4. 双端可跑时优先截图对比；不一致则改 Android，不改 iOS 去迁就。

## 反例

| 错误 | 正确 |
|------|------|
| Android 用 MaterialAlertDialog，iOS 是全屏登录 Sheet | Android 做成同等全屏/Sheet 结构 |
| 自创紫色主题或 Material 默认紫 | 使用与 iOS 相同的品牌色（如 `#5b7c0a`） |
| 新功能写 Java Activity | 新功能用 Kotlin |

## 三端

功能正本是 iOS。Android 与 HarmonyOS 全部跟随 iOS；与 iOS 冲突时改这两端，不改 iOS 去迁就。

## 范围

适用于用户在 Cursor 中开发的**所有**含 Android/iOS/鸿蒙 的项目，不限于当前仓库。

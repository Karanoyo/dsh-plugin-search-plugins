# dsh-plugin-search-plugins 插件

> DeepSeek Harness 侧边栏「插件管理」页面专属的 `Ctrl + F` 快捷搜索与卡片跳转定位插件。

---

## 🌟 功能特色

- **🎹 快捷唤起**：在侧边栏进入插件管理列表后，直接按下 `Ctrl + F`（macOS 上为 `Command + F`），立即弹出居中搜索浮层。
- **🛡️ 零冲突守卫**：包含严格的作用域守卫检测（`[data-plugin-panel]`），在聊天对话界面、设置面板或其他页面按下 `Ctrl + F` 不做任何拦截，保持浏览器原生行为。
- **🔍 智能检索**：自动扫描并解析当前渲染出的卡片信息，支持匹配插件中文名称、npm 包名以及功能描述。
- **⌨️ 纯键盘操控**：
  - `↑` / `↓`：上下切换候选结果
  - `Enter`：确认并跳转至目标插件
  - `Esc`：随时关闭搜索浮层
- **🎯 原生动效定位**：选中后自动通过平滑滚动将卡片移至屏幕中央，并触发宿主自带的 `data-plugin-highlight` 呼吸聚焦光晕，清晰可见。
- **🎨 主题自适应**：浮层完全采用宿主 `--dsw-alias-*` 变量渲染，无缝贴合深色 / 浅色模式。

---

## 📁 目录结构

```
dsh-plugin-search-plugins/
├── package.json         # Bundle 清单定义与客户端导出配置
├── cordis.patch.yml     # 插件行注册补丁 (insert)
├── index.js             # 宿主半体入口 (符合 Cordis 规范)
├── client.js            # 客户端半体入口 (快捷键、搜索 UI 与跳转逻辑)
├── icon.svg             # 插件图标 (原创矢量图标，≤256 KiB)
├── locale/              # 本地化元数据
│   ├── zh.json          # 中文展示信息
│   └── en.json          # 英文展示信息
└── README.md            # 本说明文档
```

---

## 🚀 手动安装与启用方法

> 💡 **提示**：用户要求本次“确认开发但是不自动安装”，因此本插件仅保存在工作区 `E:\dsh-workspace\dsh-plugin-search-plugins` 中。后续若需在 DeepSeek Harness 中启用，可选择以下任意一种方式：

### 方案 A：通过对话命令让 Agent 安装（推荐）
在会话中直接对 Agent 发送：
```text
请帮我把工作区中的 dsh-plugin-search-plugins 插件安装到当前 profile
```
Agent 会调用官方工具 `tools.plugin_manager({ action: "install_bundle", target: "E:\\dsh-workspace\\dsh-plugin-search-plugins" })` 完成安全装载。

### 方案 B：通过命令行手动安装
在任意终端或 PowerShell 中执行：
```bash
dsh plugin --profile desktop add "E:\dsh-workspace\dsh-plugin-search-plugins"
```

---

## 🧪 验证与体验

1. 安装生效后（或重启应用后），点击桌面客户端左侧边栏的 **「插件」** 图标，进入插件管理列表页面。
2. 在该页面按下 **`Ctrl + F`**（macOS 上为 **`Cmd + F`**）。
3. 屏幕中央弹出搜索对话框，输入你想查找的插件名称（例如：`搜索`、`guide`、`model` 等）。
4. 使用键盘方向键选择目标，按下 **`Enter`** 键，页面将自动平滑滚动并高亮该插件卡片！

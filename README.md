# Tab Out

**管好你的标签页。**

Tab Out 是一个 Chrome 扩展，它把浏览器的「新标签页」替换成一个仪表盘，集中展示你打开的所有标签页。标签按域名分组，常用首页（Gmail、X、LinkedIn 等）会被单独归到一组。关闭标签时还有 swoosh 音效 + 彩纸特效。

无服务器、无账号、无任何外部 API 调用。就是一个纯粹的 Chrome 扩展。

> 本仓库 fork 自 [Zara Zhang 的原版 Tab Out](https://github.com/zarazhangrui/tab-out)，在其基础上**新增了「一键关闭久未查看标签页」功能**。详见下方[「与原版（Zara Zhang）的不同」](#与原版zara-zhang的不同)。

---

## 与原版（Zara Zhang）的不同

本分支在保留原版全部功能的前提下，主要新增/改动了以下内容：

### 🆕 新功能：一键关闭久未查看的标签页

这是本分支的核心新增能力——帮你清理那些「开着但很久没看」的标签。

- **自动记录最后查看时间**：后台 Service Worker 监听标签的激活/导航事件，把每个标签的「最后查看时间」持久化到 `chrome.storage.local`。
  - 不依赖 Chrome 原生的 `tab.lastAccessed`（它在浏览器重启后会丢失），所以记录更可靠、不挑 Chrome 版本。
  - 安装/启动时会给已打开的标签写入基线时间戳，**装完即用**，不用干等数据积累。
- **独立的「Haven't looked at these」分组**：默认折叠成一行琥珀色提示（如 `⚠ ▸ 3 tabs you haven't looked at`），点击才展开，**不打扰原有的 Open tabs 全集视图**。
- **三档时间阈值**：`1 小时 / 1 天 / 3 天`，**默认 3 天**，选择会被记住。
- **一键全关 + 逐个处理**：展开后可一键关闭全部超时标签（复用原版的 swoosh 音效 + 彩纸特效），也能逐个关闭或点击跳转；每个标签右侧带「多久没看」的徽章（如 `5d`）。

### 🔧 顺手修复

- 移除了 `index.html` 中 `config.local.js` 上的内联 `onerror` 处理器，消除一处 Manifest V3 的 CSP（内容安全策略）报错。

### 改动涉及的文件

| 文件 | 改了什么 |
|------|---------|
| `extension/background.js` | 新增「最后查看时间」追踪与清理逻辑 |
| `extension/app.js` | 新增久未查看分组的计算、渲染、折叠与一键关闭交互 |
| `extension/index.html` | 新增可折叠的分组容器结构 |
| `extension/style.css` | 新增分组与折叠头的样式 |

---

## 完整功能列表

- **一眼看清所有标签**：干净的网格视图，按域名分组
- **首页分组**：把 Gmail 收件箱、X 主页、YouTube、LinkedIn、GitHub 等首页归到同一张卡片
- **带特效地关标签**：swoosh 音效 + 彩纸爆发
- **重复检测**：同一页面开了两次会标记出来，一键清理
- **🆕 一键关闭久未查看标签**：把很久没看的标签（1 小时 / 1 天 / 3 天，默认 3 天）收进一个可折叠分组，一个按钮全部关掉
- **点击任意标签直接跳转**：跨窗口跳转，不会新开标签
- **稍后再看**：关闭前先把标签存进清单
- **localhost 分组**：显示端口号，方便区分你本地的多个项目
- **可展开分组**：先显示前 8 个标签，多余的折叠成可点击的「+N more」
- **100% 本地**：你的数据永不离开本机
- **纯 Chrome 扩展**：无服务器、无 Node.js、无 npm，除了加载扩展不用任何额外配置

---

## 手动安装

**1. 克隆仓库**

```bash
git clone https://github.com/dufanchen/tab-out.git
```

**2. 加载 Chrome 扩展**

1. 打开 Chrome，访问 `chrome://extensions`
2. 打开右上角的 **开发者模式（Developer mode）**
3. 点击 **加载已解压的扩展程序（Load unpacked）**
4. 选择克隆下来的仓库里的 `extension/` 文件夹（注意是最里层、能直接看到 `manifest.json` 的那个文件夹）

**3. 打开一个新标签页**

你就会看到 Tab Out。

---

## 工作原理

```
你打开一个新标签页
  -> Tab Out 按域名分组展示你打开的所有标签
  -> 首页（Gmail、X 等）单独归到顶部一组
  -> 点击任意标签标题即可跳转过去
  -> 把不需要的分组整组关掉（swoosh + 彩纸）
  -> 展开「Haven't looked at these」，清理久未查看的标签（1 小时 / 1 天 / 3 天）
  -> 关闭前可把标签存进「稍后再看」
```

一切都在 Chrome 扩展内部运行。无外部服务器、无 API 调用、不向任何地方发送数据。「稍后再看」的标签和「最后查看时间」都存在 `chrome.storage.local` 里。

---

## 技术栈

| 模块 | 实现 |
|------|------|
| 扩展 | Chrome Manifest V3 |
| 存储 | chrome.storage.local |
| 音效 | Web Audio API（实时合成，无音频文件） |
| 动画 | CSS 过渡 + JS 彩纸粒子 |

---

## 许可证

MIT

---

原版由 [Zara](https://x.com/zarazhangrui) 打造（[zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out)）。
本分支由 [dufanchen](https://github.com/dufanchen) 维护，新增「一键关闭久未查看标签页」功能。

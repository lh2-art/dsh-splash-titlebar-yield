# dsh-splash-titlebar-yield

**启动动画优化** — Let DSH desktop startup animations cover the Windows native caption buttons. The 40px titlebar strip is handed to the splash itself while it plays, and restored the moment playback ends.

[中文说明](#中文说明) · [English](#english)

---

## English

### The problem

On Windows, DSH Desktop draws the minimize / maximize / close buttons with Electron's
`titleBarStyle: 'hidden'` + `titleBarOverlay`. Those buttons are painted by the
**operating system** on top of the entire web render — no page-level `z-index` can
cover them, not even the `2147483000` that splash plugins use.

So while a startup animation or boot video plays, the top-right corner shows three
buttons instead of the animation.

### How it works

DSH's preload (`dsh/lib/preload-app.cjs`, function `syncWindowsAppearance`) keeps a
hidden probe element under `<body>`:

```js
background-color: var(--dsw-specific-sidebar-fill)   /* → caption background */
color:            var(--dsw-alias-label-primary)     /* → caption symbol  */
```

Whenever the probe's computed style changes, the two colours are sent over IPC
(`DESKTOP_IPC.windowsAppearance`) to the main process, which calls
`mainWindow.setTitleBarOverlay({ color, symbolColor })`. The main process validates
colours against `/^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\))$/` — **8-digit hex is
allowed**, i.e. colours with alpha.

So this plugin simply sets both variables to `#00000000` (fully transparent) on
`document.body` while a splash is playing, and removes them afterwards:

- caption background becomes transparent → the strip reveals the splash underneath
- caption symbols become transparent → the buttons disappear
- when playback ends the inline variables are removed and the buttons come back

Two implementation details that matter:

1. **The variables must be written on `document.body`, not on `document.documentElement`.**
   The colour bridge registers its observer with
   `observer.observe(root, { attributes: true, attributeFilter: ["lang"] })` and
   `observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme", "style"] })`.
   The `style` attribute is only watched on `<body>` — writing inline styles on
   `<html>` never reaches the bridge.
2. **Transparent, not black.** Splash sequences move through several stages
   (black curtain → blown-out white → warm paper). A black caption would become a
   glaring black block during the light stages; transparency is invisible everywhere.

### Splash plugins detected

| Plugin | Root element | Extra marker |
|---|---|---|
| `dsh-startup-screen` | `#dsh-startup-root` | `<html class="dsu-lock">` |
| `dsh-boot-animation` | `.dba-root` | — |

Either root existing, or `dsu-lock` being present, counts as "playing".

### Install

```sh
# from a local checkout
dsh plugin --profile desktop add "link:/absolute/path/to/dsh-splash-titlebar-yield"

# or straight from GitHub
dsh plugin --profile desktop add "github:lh2-art/dsh-splash-titlebar-yield#main"
```

Then **Ctrl+F5** in the DSH window (the client half has to be reloaded).

### Caveats

- The buttons become **invisible, not disabled** — their hit area is still there, so a
  stray click during the splash can still minimize or close the window. Electron's
  `titleBarOverlay` exposes no API to disable interaction; this is a hard boundary.
- This plugin relies on **DSH internals**, not a public API: the two CSS variable
  names and the `windowsAppearance` IPC channel. A future DSH release may rename
  them, in which case the plugin silently stops working. Re-locate the variable names
  in `lib/preload-app.cjs` (the probe's `cssText`) and update `VARS` in
  `lib/client.js` — that is the only line that needs changing.
- Windows only. On macOS and Linux the plugin does nothing.

### Uninstall

```sh
dsh plugin --profile desktop remove dsh-splash-titlebar-yield
```

---

## 中文说明

### 解决的问题

DSH 桌面端在 Windows 上用 Electron 的 `titleBarStyle: 'hidden'` + `titleBarOverlay`
绘制右上角的「最小化 / 最大化 / 关闭」。这三个按钮由**操作系统绘制**，位于整个网页
渲染结果之上 —— 网页里任何元素的 `z-index` 都盖不住它们，包括启动动画所用的
`2147483000`。

结果就是：启动动画或片头视频播放时，右上角露出的不是画面，而是三个按钮。

### 实现原理

DSH 的 preload（`dsh/lib/preload-app.cjs` 的 `syncWindowsAppearance`）在 `<body>` 下
维护一个隐藏的 probe 元素，它的样式取自两个 CSS 变量：

```js
background-color: var(--dsw-specific-sidebar-fill)   /* → 标题栏背景色 */
color:            var(--dsw-alias-label-primary)     /* → 按钮符号色 */
```

probe 的计算样式一旦变化，这两个颜色就经 IPC（`DESKTOP_IPC.windowsAppearance`）交给
主进程，由主进程调 `mainWindow.setTitleBarOverlay({ color, symbolColor })`。主进程的
颜色校验是 `/^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\))$/` —— **允许 8 位 hex**，也就是
带 alpha 的透明色。

于是本插件要做的事非常简单：播放期间把这两个变量以**内联样式**写在
`document.body` 上并设为 `#00000000`（全透明），播放结束再移除：

- 标题栏背景透明 → 那一横条露出下面的启动画面
- 按钮符号透明 → 三个按钮消失
- 播放结束移除内联变量 → 按钮原样回来

两个关键细节：

1. **变量必须写在 `document.body` 上，而不是 `document.documentElement`。**
   颜色桥的 observer 是这样注册的：
   `observer.observe(root, { attributes: true, attributeFilter: ["lang"] })` 与
   `observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme", "style"] })`。
   `style` 属性只在 `<body>` 上被监听 —— 把内联样式写在 `<html>` 上，颜色桥永远收不到。
2. **用透明，不要用黑色。** 启动动画会经历多个阶段（黑幕 → 过曝洗白 → 暖白底板），
   黑色标题栏在浅色阶段反而会变成一块显眼的黑块；透明则在任何背景下都不存在。

### 识别的启动动画插件

| 插件 | 根元素 | 附加标记 |
|---|---|---|
| `dsh-startup-screen` | `#dsh-startup-root` | `<html class="dsu-lock">` |
| `dsh-boot-animation` | `.dba-root` | — |

任一根元素存在、或 `dsu-lock` 存在，即视为"播放中"。

### 安装

```sh
# 本地目录
dsh plugin --profile desktop add "link:/本目录绝对路径"

# 或直接从 GitHub
dsh plugin --profile desktop add "github:lh2-art/dsh-splash-titlebar-yield#main"
```

装完在 DSH 窗口里按 **Ctrl+F5**（客户端半边需要重新加载）。

### 已知边界

- 按钮只是**不可见，不是被禁用** —— 点击区域依然存在，启动动画期间误触右上角仍会
  触发最小化或关闭。Electron 的 `titleBarOverlay` 没有提供禁用交互的 API，这是硬边界。
- 本插件依赖的是 **DSH 内部实现**而非公开 API：那两个 CSS 变量名和 `windowsAppearance`
  IPC 通道。DSH 后续版本若改名，插件会静默失效。届时在 `lib/preload-app.cjs` 里重新
  定位变量名（probe 的 `cssText`），改 `lib/client.js` 顶部的 `VARS` 即可 —— 只有那一行。
- 仅限 Windows。macOS 与 Linux 上插件不做任何事。

### 卸载

```sh
dsh plugin --profile desktop remove dsh-splash-titlebar-yield
```

---

## License

[MIT](LICENSE) © 2026 lh2-art

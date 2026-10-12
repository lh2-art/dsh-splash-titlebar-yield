/**
 * dsh-splash-titlebar-yield — 浏览器半边
 * ---------------------------------------------------------------------------
 * 问题：DSH 桌面端（Windows）用 Electron 的 titleBarStyle:'hidden' +
 * titleBarOverlay 绘制右上角的「最小化 / 最大化 / 关闭」。这三个按钮由操作系统
 * 绘制，位于整个网页渲染结果之上 —— 网页里任何元素的 z-index（哪怕启动动画
 * 用的 2147483000）都盖不住它们。
 *
 * 出口：DSH 的 preload（lib/preload-app.cjs 里的 syncWindowsAppearance）提供了
 * 一条颜色桥。它建了一个隐藏 probe 元素挂在 <body> 下，样式是
 *     background-color: var(--dsw-specific-sidebar-fill)   → 标题栏背景色
 *     color:            var(--dsw-alias-label-primary)     → 按钮符号色
 * 每当 probe 的计算样式变化，就把这两个颜色经 IPC
 * （DESKTOP_IPC.windowsAppearance）交给主进程，主进程调
 *     mainWindow.setTitleBarOverlay({ color, symbolColor })
 *
 * ─── 关键：颜色桥监听的是哪些属性 ─────────────────────────────────────────────
 * 它的 observer 是这样注册的（原文）：
 *     observer.observe(root,          { attributes: true, attributeFilter: ["lang"] })
 *     observer.observe(document.body, { attributes: true,
 *                                       attributeFilter: ["data-ds-dark-theme", "style"] })
 *     observer.observe(document.head, { childList: true, subtree: true,
 *                                       characterData: true })
 *
 * 也就是说：
 *   - <html> 上只监听 lang —— 往 documentElement.style 写内联样式【不会触发】。
 *   - style 这个属性是在 <body> 上被监听的 —— 必须写 document.body.style。
 * 第一版就栽在这里：变量写在了 <html> 上，桥从未收到变化，按钮一直没动。
 *
 * 写在 <body> 上依然有效：probe 是 <body> 的子元素，CSS 变量会继承下去，
 * getComputedStyle(probe) 读到的就是新值。
 *
 * 值用 #00000000（全透明）而不是黑色：启动动画有「黑幕 → 过曝洗白 → 暖白底板」
 * 多个阶段，黑色在暖白阶段反而会变成一个显眼的黑块。主进程的颜色校验
 * /^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\))$/ 支持 8 位 hex，透明合法。
 *
 * ─── 触发时机 ────────────────────────────────────────────────────────────────
 * 借启动动画自己的标记，两类都认：
 *   dsh-startup-screen → #dsh-startup-root（CSS/JS 序列）或 <html class="dsu-lock">
 *   dsh-boot-animation → .dba-root（播放片头视频）
 */
window.__ModuleLoader__.load({
  id: 'dsh-splash-titlebar-yield',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    // 决定标题栏外观的两个 CSS 变量（见 lib/preload-app.cjs 的 probe 定义）
    var VARS = ['--dsw-specific-sidebar-fill', '--dsw-alias-label-primary']
    var TRANSPARENT = '#00000000'

    // 两个常见启动动画插件的根元素
    var SPLASH_SELECTORS = ['#dsh-startup-root', '.dba-root']
    var LOCK_CLASS = 'dsu-lock'

    // 上一次的判定结果，用于短路，避免频繁 DOM 变动导致反复写样式
    var last = null

    // 必须写在 <body> 上：颜色桥只在 document.body 上监听 style 属性
    function styleTarget() {
      return document.body || document.documentElement
    }

    function isPlaying() {
      var root = document.documentElement
      if (root.classList && root.classList.contains(LOCK_CLASS)) return true
      for (var i = 0; i < SPLASH_SELECTORS.length; i++) {
        if (document.querySelector(SPLASH_SELECTORS[i]) !== null) return true
      }
      return false
    }

    function sync() {
      var want = isPlaying()
      if (want === last) return
      last = want

      var style = styleTarget().style
      var i
      if (want) {
        for (i = 0; i < VARS.length; i++) style.setProperty(VARS[i], TRANSPARENT)
      } else {
        for (i = 0; i < VARS.length; i++) style.removeProperty(VARS[i])
      }
    }

    function apply(ctx) {
      var root = document.documentElement

      // 首次进场就对齐一次：比如启动动画正在播（客户端半边加载得比较晚）
      sync()

      // 监听启动动画的标记：
      //   dsu-lock 加减 → <html> 的 class 变化
      //   #dsh-startup-root / .dba-root 挂载与移除 → 子树 childList 变化
      new MutationObserver(sync).observe(root, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true,
      })

      // 页面离开前恢复，避免把透明状态留给下一次加载
      window.addEventListener('pagehide', () => {
        last = null
        var style = styleTarget().style
        for (var i = 0; i < VARS.length; i++) style.removeProperty(VARS[i])
      }, { once: true })
    }

    exports.name = 'dsh-splash-titlebar-yield'
    exports.apply = apply
    return module.exports
  },
})

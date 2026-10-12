# dsh-splash-titlebar-yield

**Startup splash titlebar fix**

While a DSH desktop startup animation plays, the top strip of the window shows the animation itself instead of the minimize, maximize and close buttons. The buttons come back when playback ends.

## Why

On Windows those three buttons are drawn by the operating system, above everything the page renders. No page-level z-index can cover them, so they stay visible over any startup animation.

This plugin makes the caption strip fully transparent while a splash plays, and removes it afterwards. That way the strip reveals the animation underneath.

The full mechanism is documented in the comment at the top of `lib/client.js`.

## Install

```sh
dsh plugin --profile desktop add "github:lh2-art/dsh-splash-titlebar-yield#main"
```

Then press Ctrl+F5 in the DSH window.

## Supported splash plugins

- dsh-startup-screen
- dsh-boot-animation

## Notes

The buttons become invisible, not disabled. Clicking the top-right corner during a splash still minimizes or closes the window. Electron exposes no way to turn that off.

The plugin depends on two CSS variable names inside DSH. If a future release renames them it stops working silently. The fix is a one-line change to the `VARS` constant in `lib/client.js`.

Windows only.

## Uninstall

```sh
dsh plugin --profile desktop remove dsh-splash-titlebar-yield
```

## License

MIT

---

# dsh-splash-titlebar-yield

**启动动画优化**

DSH 桌面端播放启动动画时，右上角那一条显示画面本身，不再露出窗口按钮。播放结束后按钮自动回来。

## 背景

Windows 上，DSH 桌面的最小化、最大化、关闭三个按钮由系统绘制，压在网页内容之上。启动动画的 z-index 再高也盖不住它们，所以那三个按钮一直露在画面上。

这个插件在动画播放期间把标题栏设成全透明，那一条就露出下面的启动动画了。播放结束再去掉透明，按钮原样回来。

具体怎么做到的写在 `lib/client.js` 顶部的注释里。

## 安装

```sh
dsh plugin --profile desktop add "github:lh2-art/dsh-splash-titlebar-yield#main"
```

装完在 DSH 窗口里按 Ctrl+F5 刷新页面。

## 支持的启动动画插件

- dsh-startup-screen
- dsh-boot-animation

## 注意

三个按钮只是看不见，点击区域还在。动画播放时误点右上角，仍然会最小化或关闭窗口。Electron 没有提供禁用它们的接口，这点绕不过去。

插件靠 DSH 内部的两个 CSS 变量名工作。DSH 以后改了名字，插件会静默失效。届时改 `lib/client.js` 里的 `VARS` 常量就行。

只支持 Windows。

## 卸载

```sh
dsh plugin --profile desktop remove dsh-splash-titlebar-yield
```

## License

MIT

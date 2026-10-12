/**
 * dsh-splash-titlebar-yield — Host 半边（占位）
 *
 * 本插件的全部逻辑都在浏览器半边（lib/client.js）：启动动画播放期间把 Windows
 * 原生标题栏覆盖层改成全透明，把右上角那 40px 让给启动画面本身；播放结束再
 * 原样恢复，按钮重新出现。
 *
 * Host 侧不需要注册路由、工具或系统提示词，所以这里故意留空 —— 它存在的唯一
 * 目的是让 bundle 层有一个可挂载的模块入口（package.json 的 main）。
 */
export const name = 'dsh-splash-titlebar-yield';

export function apply() {
  // 故意为空。
}

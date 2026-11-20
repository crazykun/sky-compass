# 追光寻月 · 月相奇观（第一章）

本目录是 [追光寻月 · 小学生天空科学探索站](../README.md)（sky-compass）的**第一章子页面**：一个无构建步骤、无运行时 CDN 依赖的月相科普互动站，保留原有视觉和核心功能，升级为 **真实天文 + 教学模拟** 双模式。页首提供「🧭 返回探索站首页」导航。

## 启动

请通过 HTTP 访问，不要直接双击 HTML（原生 ES Module 和月面纹理读取需要 HTTP 环境）。在**站点根目录**启动服务即可同时访问首页与本章：

```bash
python3 -I -m http.server 8765 --bind 127.0.0.1 --directory /Volumes/Data/www/sky-compass
```

打开 <http://127.0.0.1:8765/moonlight/>。

可使用以下查询参数：

- `?mode=sim`：以教学模拟模式打开。
- `?date=2024-09-18`：查询指定公历日期（真实模式）。
- `?space=1`：深空主题。
- `?kid=1`：儿童模式。
- `?mdyaw=180`：月面纹理初始朝向。

## 真实天文模式

- 使用本地 **Astronomy Engine 2.1.19** 计算月相角、照明比例、月龄及朔/上弦/望/下弦时刻。
- 支持 1900-01-31 至 2100-12-31 的日期输入。
- 日历展示真实 29/30 天农历月，不再固定“初八上弦、十五满月”。
- 手动选日使用浏览器当地 12:00；“回到今天”使用当前时刻。
- 农历换算和天文月龄分开处理，避免朔发生在下午时把初一误判为上月三十。

详见 [科学口径](docs/science.md)。

## 修复与优化

- 日历、时间轴、3D 联动使用统一状态入口，手动操作会停止冲突播放。
- 修复儿童答题后卡死及误禁用轨道按钮的问题，支持重试和下一题。
- 修复下弦月小窗方向、3D 重置按钮状态、非法 `mdyaw` 和指针取消处理。
- 时间轴、月面、诗词在移动端改为单列；已检查 1280、390、320px 宽度。
- 统一动画调度，后台停止 rAF，离屏 Canvas 不绘制，支持 `prefers-reduced-motion`。
- 星空支持 DPR；月面纹理使用 320/520 两档内部渲染、缓存几何与 `ImageData`。
- 月面纹理从 HTML 中分离，主 HTML 从约 369KB 降至约 13KB。

## 目录

```text
index.html
css/
  base.css       基础变量、主视觉、日历和公共控件
  theme.css      深空主题与儿童模式
  layout.css     各互动模块布局
  mobile.css     响应式和减少动画规则
js/
  main.js        入口与模块组装
  store.js       真实/模拟统一状态
  astro.js       真实天文计算
  lunar.js       农历换算
  data.js        月相、地标和诗词数据
  moon.js        月相绘制
  animation.js   可见性感知动画调度
  lunar-calendar.js
  cause.js
  timeline.js
  solar-system.js
  starfield.js
  moon-detail.js
  kids.js
assets/
  moon-texture.jpg
  vendor/        Astronomy Engine 与许可证
backups/
  index-20261120-original.html
tests/           Node 算法与静态检查
```

## 验证

```bash
node --test /Volumes/Data/www/moonlight/tests/*.test.mjs
for f in /Volumes/Data/www/moonlight/js/*.js; do node --check "$f" || exit 1; done
```

当前 15 项测试覆盖：真实朔/望时刻、照明比例、真实月长、农历与闰月、民用初一与天文月龄边界、状态同步、模式连续性、DOM ID 和本地资源完整性。

## 第三方资源

- Astronomy Engine：MIT，作者 Don Cross；许可证在 `assets/vendor/LICENSE.astronomy-engine.txt`。
- 月面纹理沿用原页面内嵌的 NASA 标注资源；公开发布前建议补充其原始 URL 和授权信息。

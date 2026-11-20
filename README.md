# 追光寻月 · 小学生天空科学探索站（sky-compass）

> **抬头看天空，动手找方向。**

面向小学生的天空科学互动探索站。**无构建步骤、无运行时 CDN 依赖**，纯静态站点，克隆后起一个 HTTP 服务即可使用。

## 章节导航

| 章节 | 名称 | 内容 | 状态 |
|---|---|---|---|
| 第一章 | 🌙 追光寻月 | 月相奇观：真实天文 × 教学模拟双模式月相科普（月相历、日地月模型、时间轴、月面地标、儿童模式） | ✅ 已开放 |
| 第二章 | ☀️ 光的方向 | 影子、日晷与辨方向 | 🚧 规划中 |
| 第三章 | ⭐ 星与罗盘 | 认星星、找北极星 | 🚧 规划中 |

## 本地运行

请通过 HTTP 访问，不要直接双击 HTML（子页面使用原生 ES Module 和月面纹理，需要 HTTP 环境）：

```bash
python3 -I -m http.server 8765 --bind 127.0.0.1 --directory /Volumes/Data/www/sky-compass
```

打开 <http://127.0.0.1:8765/> 进入导航首页，第一章位于 <http://127.0.0.1:8765/moonlight/>。

第一章子页面支持查询参数：`?mode=sim`（教学模拟）、`?date=2024-09-18`（指定日期）、`?space=1`（深空主题）、`?kid=1`（儿童模式）。

## 目录结构

```text
index.html          首页导航（站点标题 / slogan / 章节入口）
css/home.css        首页样式
js/home.js          首页星空背景（DPR 自适应、后台暂停、尊重减少动画偏好）
moonlight/          第一章 · 追光寻月（月相奇观）
  index.html
  css/  js/  assets/  tests/  docs/
docs/
  attribution.md    第三方素材与授权说明
```

## 设计约定

- 无构建工具、无运行时 CDN，所有依赖本地化。
- 真实天文与教学模拟两种口径明确区分，不把固定 29.53 天模型当真实历表（见 `moonlight/docs/science.md`）。
- 星空/动画尊重 `prefers-reduced-motion`；后台标签页停止绘制。

## 验证

```bash
node --test moonlight/tests/*.test.mjs
for f in moonlight/js/*.js js/home.js; do node --check "$f" || exit 1; done
```

第一章 15 项测试覆盖：真实朔/望时刻、照明比例、真实月长、农历与闰月、状态同步、DOM ID 与本地资源完整性等；详见 [moonlight/README.md](./moonlight/README.md)。

## 第三方素材与授权

见 [docs/attribution.md](./docs/attribution.md)。

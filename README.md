# Journeloom（暂定中文名：岁织）

> Every Life Has a Story. 每个人的人生，都值得被记录。

**状态：M0 基础开发中（2026-10-25）。仓库已建立；域名与商标尚未注册。**

Journeloom 是一个 local-first 的人生经历与数字记忆管理工具，让个人将事件、照片、原始材料与反思整理为可保存、检索、分享和导出的人生档案。

它不是 Pagevela 的新简历模板，也不是任务/习惯追踪工具：

- [Pagevela](https://github.com/kunlong-luo/pagevela) 专注就业和职业形象；
- Journeloom 专注人生时间轴、记忆、故事、家庭档案与传记；
- 两者可以在用户明确同意后通过导入导出交换职业经历，避免直接共享私密数据库。

## 文档导航

| 文件 | 内容 |
|---|---|
| `docs/PRD.md` | 目标用户、MVP、用户故事、验收标准与隐私原则 |
| `docs/ARCHITECTURE.md` | Next.js App Router 本地优先架构、存储、备份、媒体与安全边界 |
| `docs/DATA_MODEL.md` | 人物、人生事件、故事、证据和媒体的数据模型 |
| `docs/ROADMAP.md` | Milestone、Issue 拆分、质量门禁和交付顺序 |
| `docs/BRAND.md` | 品牌定位、视觉规范、Logo 使用、命名风险 |
| `assets/journeloom-logo-concept.png` | 第一版透明背景标志概念，非最终商标设计 |

## MVP 一句话

用户可以离线创建人生档案，按时间记录事件，添加来源和照片，写下自己的感受，在时间轴中回顾，最后将整个档案完整备份或导出为可阅读的文档。

## 在线仓库

[kunlong-luo/journeloom](https://github.com/kunlong-luo/journeloom)，独立于 `pagevela`，MIT 开源。首期使用 Next.js 静态导出，准备通过 GitHub Pages 发布；个人数据不进入 GitHub 仓库。

## 本地开发（M0）

需要 Node.js 20.9+，推荐 Node.js 22 LTS。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。目前是中英双语的交互式产品预览：可查看示例时间轴并按类别筛选，示例人物与事件均为虚构，不会被存储。**尚未实现档案创建、Dexie 数据库存储、媒体上传或数据备份**，这些将在 M1—M5 落地。预览页面不采集或上传用户人生数据。

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

`npm run test:e2e` 首次运行前可能需要 `npx playwright install chromium`。`npm run build` 生成 `out/` 静态文件；`npm run preview` 预览静态产物。生产模式注册轻量 Service Worker，缓存页面外壳及同源静态资源以便再次离线访问；不缓存 API 或用户生成的数据。

构建脚本显式使用 Next.js 支持的 Webpack 模式，以适应对内部子进程端口有限制的开发/CI 环境；仍是 Next.js 16 App Router，而不是退回 Vite。

GitHub Pages 仓库子路径构建需要设置 `NEXT_PUBLIC_BASE_PATH=/journeloom`；`.github/workflows/pages.yml` 已处理此变量。若要公开预览，还需在仓库 **Settings → Pages** 中选择 **GitHub Actions** 作为构建与部署来源。部署不等于已实现云同步。

## 后续实施

1. 按 `docs/ROADMAP.md` 完成 M0 CI/部署验收。
2. M1 建立领域模型、Dexie schema 与档案 CRUD。
3. M2 加入事件创建、日期精度与真实时间轴。
4. M3—M5 再实施 Markdown、媒体、恢复与安全验收。

**注意：** 这里的名称、Logo、域名与产品结构都是设计建议。域名查询及公开名称检索不能取代专业的商标可用性审查。

# Journeloom（暂定中文名：岁织）

> Every Life Has a Story. 每个人的人生，都值得被记录。

**状态：本地优先 MVP 持续开发中（2026-10-25）。仓库已建立；域名与商标尚未注册。**

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
| `docs/STACK_ALIGNMENT.md` | 对照 Pagevela 的真实技术栈、可复用工程实践及不迁移的技术边界 |
| `docs/DATA_MODEL.md` | 人物、人生事件、故事、证据和媒体的数据模型 |
| `docs/ROADMAP.md` | Milestone、Issue 拆分、质量门禁和交付顺序 |
| `docs/BRAND.md` | 品牌定位、视觉规范、Logo 使用、命名风险 |
| `assets/journeloom-logo-concept.png` | 第一版透明背景标志概念，非最终商标设计 |

## MVP 一句话

用户可以离线创建人生档案，按时间记录事件，添加来源和照片，写下自己的感受，在时间轴中回顾，最后将整个档案完整备份或导出为可阅读的文档。

## 在线仓库

[kunlong-luo/journeloom](https://github.com/kunlong-luo/journeloom)，独立于 `pagevela`，MIT 开源。首期使用 Next.js 静态导出，准备通过 GitHub Pages 发布；个人数据不进入 GitHub 仓库。

## 已实现的功能

访问 `/archive/`：

- 创建、切换、编辑与删除多个私人档案；用户需显式确认永久删除。
- 添加、编辑、检索、按年份与类别筛选人生事件；支持未知、大致、年、月、日五种日期精度，以及跨期事件。
- 事件软删除与恢复、标签、地点、感受/反思、Markdown 编辑预览。
- 图片、音频、视频、PDF、TXT 本地附件（单个不超过 10 MB），校验 SHA-256，可下载与删除。
- 导出全量私人 ZIP 备份；导入前逐文件校验摘要并预览，**只新增、不覆盖现有记录**；冲突时整笔恢复取消。
- 可设置强口令下载 `.jloom` 加密备份（Web Crypto PBKDF2-HMAC-SHA256 + AES-256-GCM），恢复时须先验证口令；旧版未加密 ZIP 仅保留兼容入口。
- 可分享的 Markdown 阅读导出仅包含明确允许导出的事件，并要求用户二次审核；不包含私人原始附件。
- 保留中英双语品牌首页与虚构示例时间轴。

**数据完全保存在当前浏览器的 IndexedDB 中。** 默认没有账号、云存储、分析追踪或 AI 上传；附件目前也保存在 IndexedDB，后续再评估 OPFS。浏览器清缓存、被系统清理存储或更换设备可能丢失记录，请定期下载完整备份。

**加密范围：** `.jloom` 保护下载后的备份文件，而非 IndexedDB 静态加密。口令不上传、不保存，也无法找回；使用者需妥善保管口令和文件。未经加密的 `.zip` 可被任何拿到文件的人直接读取。

## 本地开发

需要 Node.js 20.9+，推荐 Node.js 22 LTS。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000` 浏览品牌首页，点击“开始记录人生”进入 `/archive/` 使用真正的本地档案功能。首页时间轴仍是虚构示例，与真实数据隔离。

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

**已知范围：** 私人备份最多 80 MB 原始归档内容 / 100 MB ZIP，单个附件最多 10 MB；加密外壳增加少量头部及认证标签字节；导入禁止覆盖重复 ID。尚未实现本地数据静态加密、多人协作、云同步、人物关系图、完整传记排版与高级媒体缩略图；正式发布前仍需扩大跨浏览器、无障碍、存储配额和导入安全测试。

## 后续实施

1. 按 `docs/ROADMAP.md` 完成 CI、浏览器与移动端验收。
2. 强化附件的 OPFS 存储回退、大文件配额与备份抗资源耗尽策略。
3. 增加人物/来源/章节关联、可打印的传记排版和更多无障碍测试。
4. 完成 MVP 安全审查后再考虑可选 AI 和受控分享。

**注意：** 这里的名称、Logo、域名与产品结构都是设计建议。域名查询及公开名称检索不能取代专业的商标可用性审查。

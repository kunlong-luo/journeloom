# Journeloom（暂定中文名：岁织）

> Every Life Has a Story. 每个人的人生，都值得被记录。

**状态：产品设计草案 v0.1（2026-10-25），尚未建立 GitHub 仓库、注册域名或取得商标权。**

Journeloom 是一个 local-first 的人生经历与数字记忆管理工具，让个人将事件、照片、原始材料与反思整理为可保存、检索、分享和导出的人生档案。

它不是 Pagevela 的新简历模板，也不是任务/习惯追踪工具：

- [Pagevela](https://github.com/kunlong-luo/pagevela) 专注就业和职业形象；
- Journeloom 专注人生时间轴、记忆、故事、家庭档案与传记；
- 两者可以在用户明确同意后通过导入导出交换职业经历，避免直接共享私密数据库。

## 文档导航

| 文件 | 内容 |
|---|---|
| `docs/PRD.md` | 目标用户、MVP、用户故事、验收标准与隐私原则 |
| `docs/ARCHITECTURE.md` | React 本地优先架构、存储、备份、媒体与安全边界 |
| `docs/DATA_MODEL.md` | 人物、人生事件、故事、证据和媒体的数据模型 |
| `docs/ROADMAP.md` | Milestone、Issue 拆分、质量门禁和交付顺序 |
| `docs/BRAND.md` | 品牌定位、视觉规范、Logo 使用、命名风险 |
| `assets/journeloom-logo-concept.png` | 第一版透明背景标志概念，非最终商标设计 |

## MVP 一句话

用户可以离线创建人生档案，按时间记录事件，添加来源和照片，写下自己的感受，在时间轴中回顾，最后将整个档案完整备份或导出为可阅读的文档。

## 推荐新仓库（尚未创建）

`kunlong-luo/journeloom`，独立于 `pagevela`。建议 MIT 开源、单体前端、GitHub Pages 静态部署。用户数据不进入 GitHub 仓库。

## 如何启动实施

1. 审阅 `docs/PRD.md`，冻结 v0.1 的范围。
2. 审阅 `docs/DATA_MODEL.md` 的日期精度、隐私可见性及媒体归档规则。
3. 创建独立仓库，并以 `docs/ROADMAP.md` 的 Milestone/Issue 开发。
4. 将 `assets` 下的标志用作视觉探索；正式品牌发布前完成商标近似检索。

**注意：** 这里的名称、Logo、域名与产品结构都是设计建议。域名查询及公开名称检索不能取代专业的商标可用性审查。

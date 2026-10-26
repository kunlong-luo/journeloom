# 技术架构 v0.1

## 1. 技术选型

与 Pagevela 尽量复用工程实践，同时保留已选择的 Next.js 框架。详细版本和迁移边界见 [`STACK_ALIGNMENT.md`](./STACK_ALIGNMENT.md)。

| 层 | 推荐 | 说明 |
|---|---|---|
| UI | Next.js 16 App Router + React 19 + TypeScript | 按用户选择的 Next.js 框架构建；首期只使用可静态导出的路由/组件 |
| 样式 | Tailwind CSS | 共享设计思路，不直接耦合 Pagevela 主题 |
| 状态 | React 内部状态；按需引入 Zustand | 当前尚未安装 Zustand；未来跨路由共享 UI 状态时使用，数据库始终是事实源 |
| 数据 | Dexie + IndexedDB | 本地结构化档案、迁移版本管理 |
| 大附件 | OPFS（优先）+ 浏览器兼容回退 | 大文件不直接放入状态树或分享 URL |
| 编辑 | Markdown 编辑器与阅读渲染 | 保留纯文本可迁移性；不强绑某种私有格式 |
| 导出 | ZIP + JSON manifest + Markdown + 浏览器打印 | 备份与阅读导出严格分离 |
| 测试 | Vitest + Playwright | 单元、迁移、跨浏览器端到端 |
| 部署 | Next.js `output: 'export'` + GitHub Pages | 生成 `out/`；不需要服务端，不承担个人数据持久化 |

**架构原则：** 独立仓库、模块边界清楚、导出格式优先稳定；不得从 Pagevela 直接读取浏览器数据库。需要复用时复制/抽离经测试的通用逻辑（导出、Markdown、i18n、PWA），而非把所有简历业务类型迁移过来。

当前 Dexie schema v2 在原 v1 表之外新增按 `profileId` 隔离的 `people` 表。事件 `participantIds` 只允许指向同档案人物；保存与删除人物关联都在事务中处理。删除人物会解除所有相关事件的关联（包括回收站），不修改正文；档案删除同步清理人物表。

ZIP 完整备份采用 `formatVersion: 2`，新增 `data/people.json` 与清单计数，恢复前验证人物归属和所有事件关联，事务内拒绝任何已有 ID 冲突；读取旧 v1 归档时人物列表为空。`.jloom` 加密容器版本独立于 ZIP 内容版本。人物名称、备注、未成年人标记不会被阅读版 Markdown 自动输出，正文中的身份信息仍需用户审核。

## 2. 模块边界

```text
src/
  app/              # Next.js App Router、全局布局、错误边界
  features/
    profiles/       # 档案
    timeline/       # 时间轴视图与索引
    events/         # 事件编辑与校验
    narratives/     # 故事、章节、Markdown
    media/          # 上传、缩略图、引用、校验
    search/         # 筛选和全文检索
    portability/    # 备份、恢复、版本迁移、隐私导出
  domain/           # 纯 TypeScript 的领域类型、验证、规则
  storage/          # Dexie schema、repository、迁移与 OPFS 适配
  components/       # 通用 UI
  i18n/             # 中文与英文
  styles/           # 设计 token
  test/             # fixtures 与辅助函数
public/             # manifest、简化图标、静态资源和离线外壳 Service Worker
e2e/                # Playwright 浏览器旅程测试
.github/workflows/   # CI 与 GitHub Pages 静态部署
docs/
  PRD.md ARCHITECTURE.md DATA_MODEL.md ROADMAP.md BRAND.md
```

### Next.js 与本地优先约束

- 首期使用 `output: 'export'` 与 `trailingSlash: true`，所有页面构建为静态 HTML/CSS/JS；GitHub Pages 部署时通过 `NEXT_PUBLIC_BASE_PATH=/journeloom` 设置子路径。
- 不依赖动态 API Route、Server Actions、cookies、SSR 或需要服务器的图片优化。未来如需账号与同步，另做经过评审的服务端架构，不把本地事件静默传往服务器。
- IndexedDB、OPFS、浏览器文件接口和 Service Worker 只能在浏览器环境访问；本地存储逻辑应放入 Client Component 或客户端 adapter，避免在 Next.js 预渲染阶段读取 `window`。
- M0 仅有匿名、虚构的交互预览；M1 接入 Dexie 与持久化档案。已创建的 Service Worker **仅缓存页面外壳和同源静态资源**，不缓存用户记录。

### 当前实现进度（M1–M4 初版）

- `src/domain/models.ts` / `life-date.ts`：Zod 约束与不确定日期校验；日期未知时不生成假日期。
- `src/storage/database.ts` / `repository.ts`：Dexie v1 schema；单一浏览器内的 profiles、events、media 三张表，事件软删除与附件写入事务。
- `src/features/archive/`：真实档案 CRUD、事件 Markdown、附件上传下载与隐私状态；Next.js `/archive/` 静态路由。
- `src/portability/backup.ts`：ZIP `manifest.json`、文件字节数与 SHA-256 校验、恢复预览、仅新增的事务导入。
- `src/portability/encrypted-backup.ts`：可选的 `.jloom` 认证加密外壳；版本化头部、随机 128 位盐与 96 位 IV、PBKDF2-HMAC-SHA256（600,000 次）、AES-256-GCM（128 位标签）；头部也纳入认证数据。
- `src/portability/markdown.ts`：仅显式允许导出的事件进入阅读文档，且 UI 必须再次确认。

**限制：** 附件当前存于 IndexedDB Blob，单文件最多 10 MB；出于浏览器内存限制，备份设有体积上限。原始大型媒体 OPFS/流式 ZIP 尚未实现，不能宣称适合海量照片或视频档案。JSON/ZIP 恢复不会直接执行外部代码。

## 3. 数据流

`表单或 Markdown → 领域验证 → 数据事务 → Dexie/附件存储 → 时间轴和搜索索引 → 视图渲染`

导出路径为 `已保存快照 → 隐私过滤（阅读导出）/全量快照（私人备份） → 预览 → ZIP/Markdown/PDF`。

**不可混淆：** 私人完整备份可以含隐私内容；可分享的阅读导出必须默认屏蔽。不能把两种导出共用一个未经审查的按钮。

## 4. 稳定性策略

- schemaVersion + 逐版本 migration；备份内也要有 formatVersion、createdAt、appVersion。
- 使用事务保存相互关联的数据；新媒体先验证与摘要，再落库并关联事件。失败时要清理或标记孤儿文件。
- 附件用稳定 ID 关联，不把 Data URL/原始二进制塞进事件 Markdown。
- 导入先在临时 staging 区校验 manifest 与摘要、映射 ID，确认后原子或可回滚地应用；默认不覆盖现有档案。
- 大附件需要配额预警、文件缺失提示及完整性检查；备份过程使用流式处理或合理大小限制，避免浏览器内存崩溃。
- 自动保存应有防抖与失败状态；明确提示保存失败，不能在失败时展示已保存。
- 事件按时间分页/虚拟化，避免长期积累数据后浏览器卡顿。

## 5. 安全隐私

- 默认无账号、无服务端、无第三方内容上传。
- CSP、XSS 防护、Markdown HTML 净化、文件 MIME 和尺寸校验。
- 敏感数据不放在 URL 查询参数/片段或 analytics event 属性中。
- 不把本地浏览器存储包装成“端到端加密”：当前仅加密导出的 `.jloom` 文件，IndexedDB 依然是明文存储。
- `.jloom` 采用 Web Crypto AES-GCM 与基于口令的密钥派生，使用独立随机盐/IV、格式版本与认证标签，校验错误口令和篡改时不区分失败原因。口令只在操作期间用于派生密钥，不做持久化；忘记口令无法恢复文件。
- 旧版 `.zip` 导出与恢复保留兼容，但在 UI 中必须明确告知它没有加密。不能把 `.jloom` 文件视为已经完成设备加密或云端同步。
- 云 AI 为可选、明确授权的未来功能；从本地发给模型的内容范围和去向应可见。

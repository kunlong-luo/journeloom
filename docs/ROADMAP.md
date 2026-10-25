# 开发路线与 GitHub 协作规范

## 1. 项目设置

**新仓库建议：** `kunlong-luo/journeloom`，公开源码、MIT 许可证、私人示例数据不得入库。

目录：`src/app/`（Next.js App Router）、`src/components/`、`src/i18n/`、`public/`、`docs/`、`e2e/`、`.github/workflows/` 等。M0 使用 Node.js 22、Next.js 16、React 19 和 Tailwind CSS 4。

分支采用 `main` 保护 + `feat/<scope>` / `fix/<scope>` / `docs/<scope>`，PR squash merge。CI 至少包括 typecheck、lint、unit、E2E、build，主分支成功后才部署静态页面。

## 2. Milestone 及 Issue 建议

| Milestone | Issues | 可验证交付 |
|---|---|---|
| M0 项目基础 | #1 仓库搭建、#2 CI/测试、#3 双语与品牌 token | Next.js 静态预览可 build、语言与示例筛选可用、PWA 离线外壳、CI 通过 |
| M1 本地数据 | #4 领域模型、#5 Dexie schema/migration、#6 Profile CRUD | 刷新后仍保留多个档案 |
| M2 人生事件 | #7 Event CRUD、#8 日期精度、#9 时间轴筛选 | 不确定日期可正确显示 |
| M3 内容记录 | #10 Markdown、#11 来源/人物关联、#12 媒体 | 事件与材料关联稳定，文件可校验 |
| M4 导出恢复 | #13 ZIP 备份、#14 恢复校验、#15 Markdown/PDF 阅读导出 | 备份往返一致，隐私默认保护 |
| M5 发布验收 | #16 E2E、#17 无障碍与手机布局、#18 性能/离线、#19 安全文档 | 完成 MVP 验收与 v0.1.0 标签 |

这些 # 仅表示建议的创建顺序，**不是已经存在的 GitHub Issue 编号**。

### M0 范围说明

- 首页中的所有时间轴事件均为静态虚构示例，不能创建/修改个人记录，不向任何服务器上传个人内容。
- 支持中英双语和响应式演示、原生 Web App manifest、静态外壳离线缓存、单元测试与 Playwright 浏览器烟测。
- 真正的离线数据编辑与可恢复备份从 M1 开始，直至 M5 端到端验收后才可以宣称实现完整的离线档案能力。
- 发布前确认 GitHub Actions CI 全绿，且 GitHub Pages 部署源设为 GitHub Actions。

### M1–M4 增量实现（待全面验收）

- M1：Dexie v1 schema、Profile 创建/修改/切换与删除已实现；存储恢复用内存 IndexedDB 测试。
- M2：事件 CRUD、日期精度、软删除/恢复、时间轴筛选和搜索已实现。
- M3：Markdown 编辑预览、标签、事件本地附件已实现；人物/来源/章节关联待办。
- M4：完整 ZIP 私人备份、摘要校验、无覆盖导入、隐私审核后的 Markdown 导出已实现；跨浏览器大型附件和 PDF 视觉导出待办。
- M5：继续覆盖离线恢复、Safari/iOS、低存储配额、无障碍、性能以及备份恶意文件防护。

## 3. 推荐标签

`type:feature`, `type:bug`, `type:docs`, `area:storage`, `area:timeline`, `area:media`, `area:export`, `area:privacy`, `priority:P0`, `priority:P1`, `good-first-issue`。

## 4. 开发优先级

优先保证数据完整性，再做精美展示，最后再做 AI。

下一阶段的依赖选择与 Pagevela 经验复用遵循 [`STACK_ALIGNMENT.md`](./STACK_ALIGNMENT.md)：保留 Next.js，逐项借鉴 Dexie、PDF、PWA、跨浏览器测试与发布流程；避免一揽子替换包管理器和框架。

1. 单独实现并测试事件与日期模型。
2. 存储迁移、事务及稳定事件编辑。
3. 时间轴、筛选与响应式 UI。
4. 附件存储与来源引用。
5. 备份、完整性验证、恢复。
6. 私密导出与阅读 PDF。
7. 离线、跨浏览器、无障碍和安全 QA。

**时间预估：** 个人开发在复用部分 Pagevela 思路的前提下，MVP 大约 4–6 周；实际取决于素材处理和浏览器兼容性，不作为排期承诺。

## 5. Definition of Done

- PR 说明用户价值、数据迁移影响、隐私影响及测试。
- 新增复杂逻辑有单元测试；关键旅程有 Playwright 测试。
- 不出现真实身份证、电话、家庭照片、聊天记录、内部文档的测试 fixtures。
- 数据格式变更有 schemaVersion 增量和迁移回归测试。
- 影响公开导出的变更必须包含“默认不泄露”的安全用例。
- `README` 和文档同步更新、CI 全绿后才合并。

## 6. 不在 v0.1 实施

登录账户、托管照片云库、付费、家庭多人实时协作、自动推送短视频、自动读取社交账户及医疗/财务数据。此类能力需要独立的权限、合规和威胁建模。

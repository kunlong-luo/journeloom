# 开发路线与 GitHub 协作规范

## 1. 项目设置

**新仓库建议：** `kunlong-luo/journeloom`，公开源码、MIT 许可证、私人示例数据不得入库。

建议目录：`src/`、`public/`、`docs/`、`e2e/`、`.github/workflows/`、`README.md`、`README.zh-CN.md`、`LICENSE`、`SECURITY.md`、`CONTRIBUTING.md`。

分支采用 `main` 保护 + `feat/<scope>` / `fix/<scope>` / `docs/<scope>`，PR squash merge。CI 至少包括 typecheck、lint、unit、E2E、build，主分支成功后才部署静态页面。

## 2. Milestone 及 Issue 建议

| Milestone | Issues | 可验证交付 |
|---|---|---|
| M0 项目基础 | #1 仓库搭建、#2 CI/测试、#3 双语与品牌 token | 空壳 PWA 可 build，CI 通过 |
| M1 本地数据 | #4 领域模型、#5 Dexie schema/migration、#6 Profile CRUD | 刷新后仍保留多个档案 |
| M2 人生事件 | #7 Event CRUD、#8 日期精度、#9 时间轴筛选 | 不确定日期可正确显示 |
| M3 内容记录 | #10 Markdown、#11 来源/人物关联、#12 媒体 | 事件与材料关联稳定，文件可校验 |
| M4 导出恢复 | #13 ZIP 备份、#14 恢复校验、#15 Markdown/PDF 阅读导出 | 备份往返一致，隐私默认保护 |
| M5 发布验收 | #16 E2E、#17 无障碍与手机布局、#18 性能/离线、#19 安全文档 | 完成 MVP 验收与 v0.1.0 标签 |

这些 # 仅表示建议的创建顺序，**不是已经存在的 GitHub Issue 编号**。

## 3. 推荐标签

`type:feature`, `type:bug`, `type:docs`, `area:storage`, `area:timeline`, `area:media`, `area:export`, `area:privacy`, `priority:P0`, `priority:P1`, `good-first-issue`。

## 4. 开发优先级

优先保证数据完整性，再做精美展示，最后再做 AI。

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

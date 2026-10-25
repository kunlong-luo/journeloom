# 技术架构 v0.1

## 1. 技术选型

与 Pagevela 尽量保持一致：

| 层 | 推荐 | 说明 |
|---|---|---|
| UI | React + TypeScript + Vite | 静态构建、类型安全、便于复用交互模式 |
| 样式 | Tailwind CSS | 共享设计思路，不直接耦合 Pagevela 主题 |
| 状态 | Zustand | 当前视图/筛选/编辑器状态，数据库是事实源 |
| 数据 | Dexie + IndexedDB | 本地结构化档案、迁移版本管理 |
| 大附件 | OPFS（优先）+ 浏览器兼容回退 | 大文件不直接放入状态树或分享 URL |
| 编辑 | Markdown 编辑器与阅读渲染 | 保留纯文本可迁移性；不强绑某种私有格式 |
| 导出 | ZIP + JSON manifest + Markdown + 浏览器打印 | 备份与阅读导出严格分离 |
| 测试 | Vitest + Playwright | 单元、迁移、跨浏览器端到端 |
| 部署 | GitHub Pages | 不需要服务端，也不承担个人数据持久化 |

**架构原则：** 独立仓库、模块边界清楚、导出格式优先稳定；不得从 Pagevela 直接读取浏览器数据库。需要复用时复制/抽离经测试的通用逻辑（导出、Markdown、i18n、PWA），而非把所有简历业务类型迁移过来。

## 2. 模块边界

```text
src/
  app/              # 启动、路由、全局布局、错误边界
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
docs/
  PRD.md ARCHITECTURE.md DATA_MODEL.md ROADMAP.md BRAND.md
```

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
- 不把本地浏览器存储包装成“端到端加密”：v0.1 没有默认静态加密保证。
- 后续加密备份可采用 Web Crypto AES-GCM 与强口令 KDF；须包含独立 salt、nonce、版本及篡改检测，在安全评审后上线。
- 云 AI 为可选、明确授权的未来功能；从本地发给模型的内容范围和去向应可见。

# Journeloom 与 Pagevela 技术栈对齐决策

记录日期：2026-10-25。参考：[Pagevela `package.json`](https://github.com/kunlong-luo/pagevela/blob/main/package.json)、[Vite 配置](https://github.com/kunlong-luo/pagevela/blob/main/vite.config.ts)、[Playwright 配置](https://github.com/kunlong-luo/pagevela/blob/main/playwright.config.ts)、[CI 工作流](https://github.com/kunlong-luo/pagevela/blob/main/.github/workflows/ci.yml)。这是本次核查时的快照；版本不是永久锁定要求。

## 1. 基本原则

**保留 Journeloom 的 Next.js App Router，参考 Pagevela 的技术能力和工程方法，而不是复制它的 Vite 启动器。** 两个仓库独立发布，允许共享设计约定、测试模式和经过验证的纯业务无关代码；不可读取对方的私有 IndexedDB 或静默交换个人数据。

| 范畴 | Pagevela 当前做法（参考） | Journeloom 决策 |
|---|---|---|
| 框架 | Vite 8 + React 19 | **Next.js 16 App Router + React 19**；以用户要求为准，静态导出 GitHub Pages |
| 类型 | TypeScript，独立关键模块严格检查 | TypeScript `strict`；逐步增加 `noUncheckedIndexedAccess` 等关键边界检查 |
| UI | Tailwind CSS 4、Lucide、Motion | 保留 Tailwind 4 + Lucide；动效有必要时再按需引入 Motion |
| 状态 | Zustand 5 | 当前使用组件状态 + Dexie LiveQuery；跨页面 UI 状态增长后再引入 Zustand，**数据库仍是事实源** |
| 数据 | Dexie 4 / IndexedDB | 保留 Dexie 4 / IndexedDB；附件体积扩大时评估 OPFS + 兼容回退 |
| 内容 | React Markdown 10 + remark-gfm 4 | 已对齐；私密 Markdown 预览不能自动请求远程图片 |
| 压缩 | fflate | 当前 JSZip + 摘要/大小验证已通过备份往返测试；大文件性能有证据后再评估替换 |
| PDF | react-to-print、jsPDF、html2canvas-pro、PDF.js | 首先实现可选择文本的 A4/Letter 打印样式；快速位图 PDF 与 PDF 导入均为独立按需功能 |
| PWA | vite-plugin-pwa / Workbox | 保留 Next.js 静态导出适配的 Service Worker；**不安装 Vite 插件** |
| 测试 | Vitest + Playwright，覆盖 Chromium/Firefox/WebKit | 继续 Vitest + Playwright；先巩固 Chromium 桌面/手机，再拓展 Firefox、WebKit 与移动设备实测 |
| 质量 | i18n 审计、严格类型、性能预算、CI → 同 SHA 发布 | 分阶段借鉴；发布必须依赖成功的主分支 CI，不把 PR 检查替代发布验收 |
| 工具链 | Node 24、pnpm 12、TS native/新版本 | **当前保留 Journeloom 的 npm lockfile 和 Node 22 兼容基线**；另开独立变更验证 pnpm/Node 升级，不混入功能 PR |

## 2. 可直接借鉴的工程约定

1. **按需加载重型功能。** Markdown、PDF 布局/渲染、大型媒体预览不应全部进入初始路由 JS；先在性能测试中建立基线。
2. **IndexedDB 是唯一事实源。** UI 状态可用 Zustand，但不能同时在 Zustand 和数据库中各维护一份未同步的持久化真相。首次加载时须等待持久化状态，避免覆盖已有记忆。
3. **用户明确授权才导出或分享。** 区分完整私人 ZIP 与可分享传记；PDF、Markdown、未来云同步均复用显式的隐私审核流程。
4. **先保证文本 PDF，再补高保真视觉效果。** 传记适合长期搜索、复制与打印；若后续实现位图 PDF，必须明确说明文字无法选择的差异。
5. **跨浏览器测试与可恢复证据。** 尤其验证 Safari/iOS 的 IndexedDB 持久性、存储配额、PDF 下载和 PWA 更新；GitHub CI 通过不等于所有真机已验收。
6. **按发布 SHA 追踪构建与部署。** 若 GitHub Pages 部署未成功，不能仅凭代码合并宣称网站已上线。

## 3. 不直接复制的部分

- 不把 Pagevela 的简历领域模型、ATS、电话号码处理、用户内容或浏览器数据库移入 Journeloom。
- 不把 Next.js 改成 Vite，也不同时运行两个前端构建系统。
- 不为了“依赖一致”一次性升级 React、Node、TypeScript、包管理器；以测试、兼容性和实际收益驱动升级。
- 不为了功能演示而在默认流程上传私人文本、医疗记录、家人照片或任何原始证据。

## 4. 后续实施顺序

1. P0：完整 ZIP 的可选强口令加密（AES-GCM、独立盐、密钥派生、版本和认证校验）及恢复失败测试。
2. P1：人物/事件关系、来源证据、人生章节；强化迁移与大型档案性能。
3. P1：复用 Pagevela 已验证的打印经验，制作支持 A4/Letter 的传记排版和文本型 PDF 流程。
4. P2：双语编辑界面审计、Firefox/WebKit、真机 Safari、存储配额与离线故障恢复。
5. P2：评估 Motion、Zustand、OPFS、fflate 和工具链升级，只引入真正解决问题的模块。

每一项实现在独立 PR 中提交测试和隐私影响说明。该文档是决策基线，不代表待办功能已经完成。

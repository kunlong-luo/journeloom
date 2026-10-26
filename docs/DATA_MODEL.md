# 领域数据模型 v0.1

## 1. 基本原则

将“客观上记录的事件”“当事人的主观叙事”“来源材料”分开存储。不要将 AI 推断写成事实，不要因为日期不详就编造一个精确日期。

## 2. 主要实体

```ts
type Id = string; // crypto.randomUUID()
type Visibility = 'private' | 'export-review' | 'public-approved';
type DatePrecision = 'day' | 'month' | 'year' | 'approximate' | 'unknown';

interface LifeDate {
  iso?: string;              // 有明确日期时 YYYY / YYYY-MM / YYYY-MM-DD
  precision: DatePrecision;
  earliest?: string;         // 不确定的最早范围
  latest?: string;           // 不确定的最晚范围
  originalText?: string;     // 例如“高中毕业后的夏天”
}

interface Profile {
  id: Id;
  displayName: string;
  birthDate?: LifeDate;
  bioMarkdown: string;
  createdAt: string;
  updatedAt: string;
}

interface LifeEvent {
  id: Id;
  profileId: Id;
  title: string;
  category: 'family' | 'education' | 'career' | 'relationship' |
            'travel' | 'health' | 'milestone' | 'other';
  startDate: LifeDate;
  endDate?: LifeDate;
  locationLabel?: string;
  summaryMarkdown: string;
  reflectionMarkdown?: string;
  tags: string[];
  participantIds: Id[];
  mediaIds: Id[];
  sourceIds: Id[];
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface PersonRef {
  id: Id;
  profileId: Id;
  displayName: string;       // 可使用化名
  relationship?: string;
  isMinor?: boolean;
  visibility: Visibility;
  notesMarkdown: string;
  createdAt: string;
  updatedAt: string;
}

interface MediaAsset {
  id: Id;
  profileId: Id;
  kind: 'image' | 'audio' | 'video' | 'document';
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string;        // OPFS / IndexedDB 适配器内的稳定引用
  capturedAt?: LifeDate;
  createdAt: string;
  visibility: Visibility;
}

interface SourceReference {
  id: Id;
  profileId: Id;
  kind: 'document' | 'message' | 'photo' | 'testimony' | 'other';
  title: string;
  mediaId?: Id;
  noteMarkdown?: string;
  recordedAt?: LifeDate;
  visibility: Visibility;
}

interface Narrative {
  id: Id;
  profileId: Id;
  title: string;
  markdown: string;
  eventIds: Id[];
  origin: 'human' | 'ai-draft' | 'mixed';
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}
```

## 3. 关系与约束

- 一个 Profile 对应多个 LifeEvent、Narrative、MediaAsset。
- LifeEvent 可关联多人、多附件、多来源；同一附件可关联多个事件，不复制物理文件。
- `private` 是所有新事件、人物与附件的默认 visibility。
- 人物目前按 Profile 隔离；新建人物默认为私密，可使用化名。事件通过 `participantIds` 引用人物；删除人物会在事务中移除所有事件的关联（包括回收站事件），而不删除事件正文。
- 人物属性、关系、备注及未成年人标记不会自动进入阅读版 Markdown。用户在事件正文中自行写入的身份信息仍需导出前人工审核。
- `public-approved` 也不意味着自动发布：最终导出仍需批量预览与确认。
- LifeDate 的日期精度决定格式；未知日期事件不得按系统当前日期替代。
- 软删除对象有恢复期限或显式永久清理流程；备份恢复应保留或说明删除状态。

## 4. 备份格式

```text
journeloom-backup-2026-10-25.zip
  manifest.json
  data/
    profiles.json
    events.json
    people.json
    narratives.json     # 后续迭代
    sources.json        # 后续迭代
    media.json
  media/
    <media-id>.<ext>
```

`manifest.json` 必须包含 formatVersion、导出时间、应用版本、每文件的相对路径、字节数、SHA-256 及校验算法。路径应进行规范化与目录穿越防护。

当前完整备份采用 `formatVersion: 2`，包含 `data/people.json`、每类记录计数和 SHA-256 校验；旧版 `formatVersion: 1` 仍可读，恢复时人物列表为空。下载的 `.jloom` 文件在 ZIP 外层做口令加密，ZIP 内部版本独立演进。浏览器 IndexedDB 仍没有静态加密。

本地 Dexie 从 v1 原样保留档案、事件、附件，v2 增加 `people` 表和索引 `[profileId+updatedAt]`；不转换既有事件。

## 5. 后续迁移方向

- 职业经历可从 Pagevela 的 *用户主动导出* JSON 转为 education/career LifeEvent；两系统互不读取对方浏览器存储。
- 增加章节、家庭关系、事件位置坐标、历史版本和 AI 草稿 provenance 前，先设计版本迁移测试。

export type Locale = "zh" | "en";
export type Category = "all" | "milestone" | "memory" | "growth";

type EventCopy = { year: string; date: string; title: string; description: string; category: Exclude<Category, "all"> };

export type Copy = {
  nav: { timeline: string; philosophy: string; roadmap: string; github: string; archive: string };
  language: string;
  eyebrow: string;
  heroLines: [string, string, string];
  heroBody: string;
  explore: string;
  startArchive: string;
  source: string;
  heroFootnote: string;
  cover: string;
  edition: string;
  memoryTitle: string;
  memoryBody: string;
  memoryDate: string;
  journal: string;
  values: { number: string; title: string; description: string }[];
  timelineEyebrow: string;
  timelineTitle: string;
  timelineBody: string;
  demoNotice: string;
  categories: Record<Category, string>;
  events: EventCopy[];
  featuresEyebrow: string;
  featuresTitle: string;
  featuresBody: string;
  features: { title: string; description: string }[];
  progressEyebrow: string;
  progressTitle: string;
  progressBody: string;
  steps: { number: string; title: string; description: string; status: string }[];
  closingTitle: string;
  closingBody: string;
  footerNote: string;
  futureButton: string;
};

export const messages: Record<Locale, Copy> = {
  zh: {
    nav: { timeline: "故事时间轴", philosophy: "设计理念", roadmap: "开发进度", github: "GitHub", archive: "我的档案" },
    language: "Switch to English",
    eyebrow: "个人生活档案 · 一段仍在书写的旅程",
    heroLines: ["把人生的片刻，", "织成可以回望", "的故事。"],
    heroBody: "每一次出发、每一个转折、每一段平凡的日子，都有被认真珍藏的意义。Journeloom 为你的真实人生留下一处安静、私密的空间。",
    explore: "探索故事时间轴",
    startArchive: "开始记录人生",
    source: "查看开源项目",
    heroFootnote: "下方时间轴是虚构示例；进入“我的档案”后，真实记录只保存在你当前的浏览器。",
    cover: "LIFE / IN PROGRESS",
    edition: "一本关于时间的私人手记",
    memoryTitle: "那些值得留住的瞬间",
    memoryBody: "有些日子看似普通，却在多年后变得格外珍贵。",
    memoryDate: "初夏 · 某一天",
    journal: "THE MEMORY JOURNAL",
    values: [
      { number: "01", title: "真实，而非完美", description: "允许记忆模糊，保留生活原本的纹理。" },
      { number: "02", title: "私密，由你决定", description: "以本地优先为原则，不默认上传人生故事。" },
      { number: "03", title: "长久，可以带走", description: "用开放格式保存，不让重要回忆被平台困住。" },
    ],
    timelineEyebrow: "THE TIMELINE / 时光轴",
    timelineTitle: "人生不是一张履历表。",
    timelineBody: "它是很多个故事的交汇。下面用一段虚构人生展示未来时间轴的阅读方式。",
    demoNotice: "仅为产品交互示例；内容不会保存到本地数据库。",
    categories: { all: "全部片段", milestone: "重要时刻", memory: "生活记忆", growth: "成长感悟" },
    events: [
      { year: "2025", date: "2025 · 秋", title: "写给未来的第一封信", description: "试着把没说出口的期待写下来。原来成长不是突然变成谁，而是慢慢读懂自己。", category: "growth" },
      { year: "2022", date: "2022 · 06", title: "在陌生城市安顿下来", description: "新的街道，新的朋友。那个从车窗望出去的黄昏，至今记得。", category: "memory" },
      { year: "2018", date: "2018 · 夏", title: "毕业，也是一次出发", description: "合上一本书，走向更广阔的世界。那天的照片依然鲜亮。", category: "milestone" },
      { year: "2011", date: "2011 · 春", title: "第一次勇敢地做决定", description: "当时并不知道这会改变什么，只记得心里有一束小小的光。", category: "growth" },
    ],
    featuresEyebrow: "MADE FOR YOUR STORY / 设计初心",
    featuresTitle: "让记忆生根，而不只是堆积。",
    featuresBody: "Journeloom 的方向，是在尊重隐私的前提下，把分散的日记、照片和人生节点整理成真正属于你的作品。",
    features: [
      { title: "时间有不同的精度", description: "只记得某一年、某一季，也能如实记录。不替你虚构具体日期。" },
      { title: "故事与资料彼此关联", description: "把事件、反思、人物与照片整理在同一条故事脉络里。" },
      { title: "记录始终属于你", description: "规划可靠备份、恢复和可阅读导出，避免对单一平台的依赖。" },
    ],
    progressEyebrow: "BUILDING IN THE OPEN / 开发路线",
    progressTitle: "从第一张空白纸，慢慢开始。",
    progressBody: "当前阶段先打好基础；真正的本地档案、编辑、附件与备份会按里程碑交付。",
    steps: [
      { number: "M0", title: "基础与设计系统", description: "Next.js、双语预览、测试与持续集成", status: "正在构建" },
      { number: "M1—M2", title: "档案与人生事件", description: "本地数据、日期精度、可编辑时间轴", status: "下一阶段" },
      { number: "M3—M5", title: "故事、附件与备份", description: "Markdown、媒体材料、导出恢复与验收", status: "规划中" },
    ],
    closingTitle: "每个人的人生，都值得被记录。",
    closingBody: "不必有惊天动地的成就。从今天开始，一页一页地保存你的故事。",
    footerNote: "开源构建中 · 私人内容不会因浏览这个预览页而上传",
    futureButton: "打开我的档案",
  },
  en: {
    nav: { timeline: "Timeline", philosophy: "Our philosophy", roadmap: "Roadmap", github: "GitHub", archive: "My archive" },
    language: "切换到中文",
    eyebrow: "A PERSONAL LIFE ARCHIVE · A STORY STILL UNFOLDING",
    heroLines: ["Gather the moments.", "Weave a life", "worth remembering."],
    heroBody: "Every beginning, turning point, and ordinary afternoon belongs to your story. Journeloom is a calm, private space for the life you've actually lived.",
    explore: "Explore the timeline",
    startArchive: "Start your life story",
    source: "View on GitHub",
    heroFootnote: "The timeline below is fictional. Your real archive stays in this browser when you open My archive.",
    cover: "LIFE / IN PROGRESS",
    edition: "A private collection of moments",
    memoryTitle: "The moments we keep",
    memoryBody: "An ordinary day can become the memory we treasure most.",
    memoryDate: "Early summer · one day",
    journal: "THE MEMORY JOURNAL",
    values: [
      { number: "01", title: "Real, not perfect", description: "Leave space for uncertain dates and imperfect memories." },
      { number: "02", title: "Private by choice", description: "Local-first by design; your story is not uploaded by default." },
      { number: "03", title: "Yours to keep", description: "Open, portable formats help memories outlive platforms." },
    ],
    timelineEyebrow: "THE TIMELINE / A LIFE IN MOMENTS",
    timelineTitle: "A life is more than a résumé.",
    timelineBody: "It's a constellation of stories. This fictional timeline offers a glimpse of the reading experience we're building.",
    demoNotice: "Interactive example only. These entries are not saved to a database.",
    categories: { all: "All stories", milestone: "Milestones", memory: "Memories", growth: "Reflections" },
    events: [
      { year: "2025", date: "2025 · Autumn", title: "A letter to my future self", description: "I put my quiet hopes into words and learned that growing up means gradually learning who I am.", category: "growth" },
      { year: "2022", date: "2022 · June", title: "Making a home in a new city", description: "New streets, new faces. I can still see the evening light through the train window.", category: "memory" },
      { year: "2018", date: "2018 · Summer", title: "Graduation, and a new beginning", description: "One book closed; an open world awaited. The photograph still feels full of color.", category: "milestone" },
      { year: "2011", date: "2011 · Spring", title: "The courage of a first decision", description: "I had no idea what it would change, only that a small light had begun to glow.", category: "growth" },
    ],
    featuresEyebrow: "MADE FOR YOUR STORY / OUR PHILOSOPHY",
    featuresTitle: "Give memories roots, not just folders.",
    featuresBody: "Our vision is to bring scattered photos, journal pages and life events together, thoughtfully and privately, into something meaningful to you.",
    features: [
      { title: "Time isn't always exact", description: "Remember only the year or season? Record it honestly, without inventing a date." },
      { title: "Connected stories", description: "Bring events, reflections, people and photographs into one narrative." },
      { title: "Truly yours", description: "Backups, restoration and readable exports are planned so your archive stays portable." },
    ],
    progressEyebrow: "BUILDING IN THE OPEN / ROADMAP",
    progressTitle: "Every story begins with a blank page.",
    progressBody: "We're building the foundation first. Local profiles, editing, media and backups will follow in planned milestones.",
    steps: [
      { number: "M0", title: "Foundation and design", description: "Next.js, bilingual preview, testing and CI", status: "In progress" },
      { number: "M1—M2", title: "Profiles and life events", description: "Local data, uncertain dates, editable timeline", status: "Up next" },
      { number: "M3—M5", title: "Stories, media and backups", description: "Markdown, attachments, portability and QA", status: "Planned" },
    ],
    closingTitle: "Every life has a story.",
    closingBody: "It doesn't need to be extraordinary. Start preserving your own, one page at a time.",
    footerNote: "Open source, in progress · Visiting this preview does not upload personal memories",
    futureButton: "Open my archive",
  },
};

export function filterEvents(events: EventCopy[], category: Category): EventCopy[] {
  return category === "all" ? events : events.filter((event) => event.category === category);
}

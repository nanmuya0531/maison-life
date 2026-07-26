import { useState, useEffect } from 'react';
import {
  Newspaper, Lightbulb, FileText, Globe, Plus, Trash2, X, Copy, Filter,
  RefreshCw, Sparkles, ExternalLink, Flame, Quote, Heart,
} from 'lucide-react';
import { storage, generateId, todayStr } from '../store';
import { HotTopic, ContentIdea } from '../types';

// ============ 法式配色 ============
const C = {
  cream: '#FAF7F2',
  beige: '#F0EAE0',
  roseGold: '#C9A876',
  deepBrown: '#4A3C32',
  wine: '#8B4555',
  sage: '#8B9D83',
  dustyRose: '#D4A5A5',
  ink: '#2D2A26',
  mist: '#E8E2D9',
  muted: '#7A6E62',
  soft: '#B5A99A',
};

// ============ Tab 1: 资讯速递 - 预设示例数据 ============
const DEFAULT_NEWS: Omit<HotTopic, 'id' | 'addedAt'>[] = [
  // AI 工具
  { title: 'Sora 2 终于会拍"会走路的人"了，物理一致性大幅提升', category: 'AI工具', heat: 96, source: 'ProductHunt', url: 'https://producthunt.com', notes: 'OpenAI 新版 Sora，8 秒视频里人物脚步不再滑步，对短视频创作者来说是大利好。' },
  { title: 'Midjourney v7 上线，中国脸终于不再"塑料感"', category: 'AI工具', heat: 92, source: 'Midjourney', url: 'https://midjourney.com', notes: '这次更新重点优化了真实人像，毛孔、发丝都做出来了，配小红书封面图挺能打。' },
  { title: 'Runway Gen-4 一句话改视频镜头，剪辑师慌了', category: 'AI工具', heat: 88, source: 'Runway', url: 'https://runwayml.com', notes: '输入"把镜头从近景推到特写"，AI 直接帮你转场，省掉一半剪辑时间。' },
  // 赚钱能力
  { title: '小红书素人单条合作报价破 5 万，背后 3 个真相', category: '赚钱能力', heat: 94, source: '新榜', url: 'https://newrank.cn', notes: '不是粉丝越多越值钱，账号垂直度、复购率、互动质量才是真正的报价底层逻辑。' },
  { title: '副业做内容的人，普遍死在第三个月', category: '赚钱能力', heat: 89, source: '即刻', url: 'https://okjike.com', notes: '一篇深度复盘，讲透了为什么大多数人做内容赚不到钱：不是不会写，是不会复利。' },
  // 学习应用
  { title: 'Notion AI 中文版终于好用，做笔记效率直接翻倍', category: '学习应用', heat: 85, source: 'Notion', url: 'https://notion.so', notes: '中文理解准确了，能自动总结会议纪要、提取待办，做内容选题库很顺手。' },
  { title: '一款被低估的口语 APP：和 AI 练对话不再尴尬', category: '学习应用', heat: 82, source: 'ProductHunt', url: 'https://producthunt.com', notes: '可以模拟面试、点咖啡、退货等真实场景，比死记单词有用多了。' },
  // 新鲜事物
  { title: '巴黎 2026 春夏时装周主打色：褪色玫瑰', category: '新鲜事物', heat: 90, source: 'Vogue', url: 'https://vogue.com', notes: '不是亮粉也不是正红，是那种"穿过一夏天的旧丝绸"色，刚好踩中法式审美风口。' },
  { title: '"松弛感"被列入年度热词，搜索量涨了 300%', category: '新鲜事物', heat: 87, source: '小红书', url: 'https://xiaohongshu.com', notes: '从穿搭、家居到生活方式都在卷松弛感，做选题的角度其实还有不少没被讲烂。' },
  // 女性话题
  { title: '35+ 女性的"反卷"风潮：不是躺平，是重新选赛道', category: '女性话题', heat: 91, source: '豆瓣', url: 'https://douban.com', notes: '越来越多女性放弃职场内卷，转去做小而美的个人事业，这个选题值得做成长系列。' },
  { title: '"我开始买少而精的东西"——中产女性消费观悄悄变了', category: '女性话题', heat: 86, source: '第一财经', url: 'https://yicai.com', notes: '从快时尚转向可持续品牌，从囤货转向断舍离，背后是价值观的迭代。' },
];

const NEWS_CATEGORIES = ['全部', 'AI工具', '赚钱能力', '学习应用', '新鲜事物', '女性话题'];

// ============ Tab 2: 灵感选题 - 预设灵感 ============
const DEFAULT_BEAUTY_IDEAS: Omit<ContentIdea, 'id' | 'createdAt' | 'status'>[] = [
  {
    title: '5 个让皮肤变好的晨间习惯，第 3 个我真的没想到',
    description: '从喝水的温度、洗脸手法到防晒的顺序，复盘我自己坚持半年的晨间流程，附真实皮肤对比。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['护肤', '晨间习惯', '抗老'],
    hook: '坚持半年，朋友问我偷偷做了什么医美——其实只是改了 5 件小事。',
  },
  {
    title: '法式女生的护肤哲学：少即是多，慢即是快',
    description: '扒了 10 位法国博主的护肤步骤，发现她们平均只用 5 件产品，但每一件都讲究到骨子里。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['法式护肤', '极简', '成分党'],
    hook: '法国女人不用 10 步护肤，但她们的脸看起来比我们年轻 5 岁。',
  },
  {
    title: '35 岁后的抗老真相：贵的不如对的',
    description: '拆解 A 醇、烟酰胺、玻色因三大抗老成分，告诉你什么年龄该用什么、什么钱真的不用花。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['抗老', '成分', '35+'],
    hook: '别再被专柜忽悠了，35 岁后的抗老逻辑完全不一样。',
  },
  {
    title: '月入 8000 也能用得起的 10 件变美好物（纯自费）',
    description: '没有一条广告，全部自费回购 3 次以上，从卸妆油到身体乳，附价格和使用感受。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['平价好物', '自费推荐', '回购'],
    hook: '我是真的花自己钱买的，不好用我直接骂。',
  },
  {
    title: '别再追爆款了，35+ 女生该做的是"护肤减法"',
    description: '从 13 步精简到 5 步，皮肤反而变好了。讲讲我为什么要砍掉那些"看似有用"的步骤。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['护肤减法', '极简', '35+'],
    hook: '我曾经是 13 步护肤党，直到皮肤科医生一句话点醒我。',
  },
  {
    title: '凌晨三点想到的，关于变美这件事我终于想通了',
    description: '一篇很私人的随笔，关于"变美是为了谁"这件事，写给所有容貌焦虑的女生。',
    platform: 'xiaohongshu', account: 'beauty',
    tags: ['容貌焦虑', '自我和解', '随笔'],
    hook: '变美这件事，我曾经做错了十年。',
  },
];

const DEFAULT_INS_IDEAS: Omit<ContentIdea, 'id' | 'createdAt' | 'status'>[] = [
  {
    title: '巴黎街头观察了 100 个女人，发现她们都有一个共同点',
    description: '在巴黎住了半年，记录街头真实穿搭，提炼出法国女人不说的 5 个穿搭底层逻辑。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['法式穿搭', '巴黎', '观察'],
    hook: '她们不是长得美，是会"穿"——这种会，是可以学的。',
  },
  {
    title: '法式家居美学：客厅只放 3 件东西，反而更高级',
    description: '从巴黎老式公寓的实景照片，拆解法式家居的留白哲学，附平替单品清单。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['法式家居', '极简', '软装'],
    hook: '法式高级感的秘密，藏在她家客厅的"空"里。',
  },
  {
    title: 'ins 风拍照构图技巧：把咖啡杯放这里，照片立刻贵 10 倍',
    description: '5 种经典法式构图法：三分法、对称法、前景虚化、留白法、对角线，附失败案例对比。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['拍照构图', 'ins风', '法式'],
    hook: '同一杯咖啡，构图差一厘米，点赞差 10 倍。',
  },
  {
    title: '法式早餐仪式感：10 分钟搞定，但吃完像在度假',
    description: '可颂 + 咖啡 + 报纸的法式早餐三件套，分享我的 10 分钟极简做法，以及为什么这件事改变了我的一天。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['法式早餐', '仪式感', '生活方式'],
    hook: '不是早餐贵，是你没给它时间。',
  },
  {
    title: '在巴黎住了半年才懂，所谓法式穿搭就是这 3 件单品',
    description: '白衬衫、卡其风衣、直筒牛仔裤——讲透这 3 件单品的挑选、搭配、护理全过程。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['法式穿搭', '基础款', '巴黎'],
    hook: '法国女人的衣柜里，80% 的衣服都是这 3 件的变种。',
  },
  {
    title: 'ins 博主不会告诉你的：法式高级感是"做减法"做出来的',
    description: '从颜色、版型、配饰三个维度，讲清楚为什么法式风格看似简单却难学。',
    platform: 'xiaohongshu', account: 'ins',
    tags: ['法式审美', '做减法', '高级感'],
    hook: '法式风格不是穿什么，是不穿什么。',
  },
];

// 一键生成灵感的随机模板（占位符会被随机替换）
const BEAUTY_RANDOM_IDEAS = [
  { title: '{{数字}}个让我偷偷变美的小习惯，第{{数字}}个最反直觉', hook: '坚持{{时间}}，连我妈都问我做了什么。' },
  { title: '{{年龄}}岁才明白的护肤真相，句句都是花钱买的教训', hook: '别再被忽悠了，这才是 35+ 该懂的护肤逻辑。' },
  { title: '平价好物分享：{{数字}}件不到{{价格}}元的回购好物', hook: '我是自费买的，不好用我直接骂。' },
  { title: '为什么你的护肤越做皮肤越差？问题出在这{{数字}}个细节', hook: '90% 的人都做错了这一步，包括曾经的我。' },
  { title: '坚持{{时间}}，皮肤状态真的不一样了（附真实对比）', hook: '不是变美有多难，是坚持有多难。' },
];

const INS_RANDOM_IDEAS = [
  { title: '巴黎女人不会告诉你的{{数字}}个穿搭秘密', hook: '她们不是天生会穿，是懂得"少即是多"。' },
  { title: 'ins 风照片怎么拍？{{数字}}个构图技巧让你秒变博主', hook: '同一杯咖啡，构图差一厘米，点赞差{{数字}}倍。' },
  { title: '法式家居美学：把沙发放这里，立刻贵{{数字}}倍', hook: '法式高级感的秘密，藏在她家的"空"里。' },
  { title: '{{数字}}件法式必备单品，第{{数字}}件我回购了{{数字}}次', hook: '在巴黎住过才懂，所谓法式就是这{{数字}}件单品。' },
  { title: '为什么法国女人不焦虑？答案藏在她早餐的{{数字}}分钟里', hook: '不是她们天生松弛，是把"快"换成了"慢"。' },
];

// ============ Tab 3: 文案模板 ============
interface CopyTemplate {
  id: string;
  scene: string;
  title: string;
  body: string;
  hook: string;
  account: 'beauty' | 'ins' | 'both';
}

const COPY_TEMPLATES: CopyTemplate[] = [
  {
    id: 'tpl-1',
    scene: '好物分享 · 真实自费',
    account: 'beauty',
    title: '说真的，这个{{产品名}}我用了一周，只想说为什么不早点知道',
    body: '先说结论：{{产品名}}是真的好用，但前提是你要{{正确用法}}。\n\n我先讲我自己的情况：{{你的痛点}}。试过{{曾用过的产品}}，都没解决。这次是{{朋友/博主}}推荐，本来没抱希望，结果{{使用后的变化}}。\n\n用法很简单：{{具体步骤}}。注意{{关键细节}}，不然效果会打折。\n\n价格{{价格}}，不算便宜，但算下来{{性价比}}。如果只能买一件{{品类}}，我会选它。\n\n没有广告，纯自费。下次买什么你们评论区告诉我。',
    hook: '我是真的花自己钱买的，不好用我直接骂。',
  },
  {
    id: 'tpl-2',
    scene: '护肤心得 · 反向输出',
    account: 'beauty',
    title: '别再被忽悠了，{{年龄}}岁阿姨的真实护肤心得，句句大实话',
    body: '我{{年龄}}岁，护肤{{年数}}年，踩过{{数字}}个坑，花过{{金额}}冤枉钱。\n\n这篇不卖货，只讲三件事：\n\n1. {{第一件该做的事}}——比{{昂贵项目}}管用 10 倍，而且免费。\n2. {{第二件该停止的事}}——99% 的人都在做，包括曾经的我自己。\n3. {{第三件最该买的东西}}——不超过{{价格}}，但能解决{{问题}}。\n\n记住一句话：{{金句总结}}。\n\n下次想买什么之前，先回来看这篇。',
    hook: '专柜小姐不会告诉你的真相，我全写在这里了。',
  },
  {
    id: 'tpl-3',
    scene: '法式审美 · 观察笔记',
    account: 'ins',
    title: '巴黎街头观察了{{数字}}个女人，发现她们都有一个共同点',
    body: '在巴黎待了{{时间}}，我没事就坐在咖啡馆看人。\n\n看了{{数字}}个女人之后，我发现一件事：她们没有一个人{{你以为是法式的东西}}。\n\n真正"法式"的是这 3 个细节：\n\n· {{细节1}}——不是流行，是习惯。\n· {{细节2}}——看起来随意，其实是刻意。\n· {{细节3}}——法国妈妈从小就教，我们长大了才学。\n\n她们不是天生会穿，是知道"少即是多"。\n\n下次买衣服之前，先问自己一个问题：{{灵魂拷问}}。',
    hook: '她们不是长得美，是会"穿"——这种会，是可以学的。',
  },
  {
    id: 'tpl-4',
    scene: '深夜感悟 · 自我对话',
    account: 'both',
    title: '凌晨三点想到的，关于{{主题}}这件事我终于想通了',
    body: '昨晚失眠，脑子里突然冒出一句话：{{突然想到的话}}。\n\n我盯着天花板想了很久，关于{{主题}}这件事，我好像做错了{{年数}}年。\n\n以前我以为{{曾经的认知}}，所以我一直在{{过去的做法}}。结果呢？{{结果}}。\n\n直到{{转折事件}}，我才明白：{{新的认知}}。\n\n不是{{错误归因}}，是{{真正原因}}。\n\n写下来不是要教谁，是想给同样在挣扎的你一个拥抱：{{温柔收尾}}。',
    hook: '关于{{主题}}这件事，我用了{{年数}}年才想通。',
  },
  {
    id: 'tpl-5',
    scene: '习惯养成 · 亲测复盘',
    account: 'beauty',
    title: '坚持{{天数}}天{{习惯}}，皮肤/状态真的不一样了（附真实对比）',
    body: '先放结论：{{天数}}天，{{前后对比}}。\n\n第{{数字}}天最难熬，差点放弃。坚持下来的原因是{{关键转折}}。\n\n说说具体怎么做的：\n\n· 早起{{时间}}——{{原因}}\n· {{第二件事}}——{{方法}}\n· {{第三件事}}——{{心得}}\n\n没有什么神技，就是把这{{数字}}件小事连续做{{天数}}天。\n\n模板我放在最后了，需要的自取。',
    hook: '不是变美有多难，是坚持有多难。',
  },
  {
    id: 'tpl-6',
    scene: '反爆款 · 清醒发言',
    account: 'both',
    title: '别再追什么爆款了，真正高级的女生都在做减法',
    body: '最近被{{爆款趋势}}刷屏了吧？\n\n说句大实话：{{爆款的问题}}。\n\n真正有质感的女生，她们在做的事恰恰相反：\n\n· 衣柜里只有{{数字}}件单品，但每一件都讲究到骨子里。\n· 护肤台不超过{{数字}}件，但每一件都用了{{年数}}年以上。\n· 社交账号关注不超过{{数字}}个，但每一个都让她变好。\n\n高级感的本质，是"知道不要什么"。\n\n下次想跟风之前，问自己：{{灵魂拷问}}。',
    hook: '法式风格不是穿什么，是不穿什么。',
  },
  {
    id: 'tpl-7',
    scene: '法式穿搭 · 单品拆解',
    account: 'ins',
    title: '在巴黎住了{{时间}}才懂，所谓法式穿搭就是这{{数字}}件单品',
    body: '巴黎女人衣柜打开来，80% 都是这{{数字}}件：\n\n1. {{单品1}}——{{为什么必备}}\n2. {{单品2}}——{{怎么挑才不踩雷}}\n3. {{单品3}}——{{搭配公式}}\n\n不是没钱买，是知道什么值得买。\n\n关于价格：{{价格区间}}就够用，不必冲大牌。关于版型：{{关键尺寸}}比品牌重要 10 倍。\n\n我回购过{{数字}}次的店铺放在评论区，自己判断。',
    hook: '法国女人的衣柜里，80% 的衣服都是这{{数字}}件的变种。',
  },
  {
    id: 'tpl-8',
    scene: '涨粉复盘 · 真实数据',
    account: 'both',
    title: '小红书涨粉{{数字}}的真相：不是技术，是这{{数字}}个字',
    body: '先放数据：{{起始粉丝}} → {{现在的粉丝}}，用了{{时间}}。\n\n不是我厉害，是我搞懂了一件事：{{核心逻辑}}。\n\n具体怎么做？三步：\n\n第一步：{{找选题的方法}}——别再追热点，要追"长期痛点"。\n第二步：{{写标题的技巧}}——{{数字}}个字以内，必须包含{{关键元素}}。\n第三步：{{做封面的逻辑}}——{{具体方法}}。\n\n不是玄学，是把这{{数字}}件事重复做{{次数}}次。\n\n我踩过的坑写在最后，希望你别再踩。',
    hook: '涨粉从来不是靠"会写"，是靠"懂人"。',
  },
  {
    id: 'tpl-9',
    scene: '自我和解 · 写给 30+',
    account: 'beauty',
    title: '写给{{年龄}}岁的自己：变美从来不是为了讨好别人',
    body: '{{年龄}}岁生日那天，我对着镜子哭了。\n\n不是因为老，是因为我终于承认：{{曾经的执念}}。\n\n这{{年数}}年我做过的事：\n\n· {{为了变美做过的事1}}——现在想想，没必要。\n· {{为了变美做过的事2}}——做错了，但也不晚。\n· {{为了变美做过的事3}}——这个做对了，分享给你。\n\n变美这件事，{{新的理解}}。\n\n写给所有和我一样焦虑过的女生：{{温柔收尾}}。',
    hook: '变美不是为了被看见，是为了让自己舒服。',
  },
  {
    id: 'tpl-10',
    scene: '实用攻略 · 干货收藏',
    account: 'both',
    title: '{{数字}}个让我偷偷变美/变好的小细节，第{{数字}}个最反直觉',
    body: '不讲虚的，全是{{年数}}年亲测有效的小细节。\n\n1. {{细节1}}——{{为什么有效}}\n2. {{细节2}}——{{具体怎么做}}\n3. {{细节3}}——{{反直觉但真的有用}}\n4. {{细节4}}——{{免费但被低估}}\n5. {{细节5}}——{{坚持下去的变化}}\n\n每一条都是我自己用{{时间}}验证过的。\n\n先收藏，慢慢试。',
    hook: '不是变美有多难，是这些小细节你从来没注意过。',
  },
];

// ============ Tab 4: 外网通道 ============
interface ExternalLink {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  isCustom?: boolean;
}

const DEFAULT_LINKS: ExternalLink[] = [
  { id: 'l-1', name: 'Instagram', description: '全球最大视觉灵感平台，法式博主聚集地', category: '社交平台', url: 'https://www.instagram.com' },
  { id: 'l-2', name: 'Pinterest', description: '图片灵感库，搜 French girl aesthetic 出大片', category: '灵感库', url: 'https://www.pinterest.com' },
  { id: 'l-3', name: 'Product Hunt', description: '每日最新 AI 工具和产品，每天刷 5 分钟不亏', category: 'AI工具', url: 'https://www.producthunt.com' },
  { id: 'l-4', name: 'AI工具集', description: '中文 AI 工具导航，分类清晰，免费工具多', category: 'AI工具', url: 'https://ai-bot.cn' },
  { id: 'l-5', name: 'Hugging Face', description: '开源 AI 模型库，玩票级选手也能上手', category: 'AI工具', url: 'https://huggingface.co' },
  { id: 'l-6', name: 'Behance', description: '设计师作品集平台，看海外审美趋势', category: '设计灵感', url: 'https://www.behance.net' },
  { id: 'l-7', name: 'Vogue France', description: '法国版 Vogue 官网，看法式风格第一手', category: '法式灵感', url: 'https://www.vogue.fr' },
  { id: 'l-8', name: 'YouTube', description: '海外视频灵感，法式 vlog 博主超多', category: '视频平台', url: 'https://www.youtube.com' },
  { id: 'l-9', name: 'Medium', description: '英文深度文章，赚钱/学习/认知类内容多', category: '学习平台', url: 'https://medium.com' },
  { id: 'l-10', name: 'Substack', description: '海外独立作者 newsletter 平台，看变现模式', category: '学习平台', url: 'https://substack.com' },
  { id: 'l-11', name: 'TikTok', description: '海外短视频灵感，ins 风原产地之一', category: '视频平台', url: 'https://www.tiktok.com' },
  { id: 'l-12', name: 'Etsy', description: '海外手作品牌平台，看法式小众品牌怎么做', category: '品牌灵感', url: 'https://www.etsy.com' },
];

const LINK_CATEGORIES = ['全部', '社交平台', '灵感库', 'AI工具', '设计灵感', '法式灵感', '视频平台', '学习平台', '品牌灵感'];

type TabType = 'news' | 'ideas' | 'copy' | 'links';

const LINKS_STORAGE_KEY = 'life_planner_external_links';

function loadCustomLinks(): ExternalLink[] {
  try {
    const stored = localStorage.getItem(LINKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomLinks(links: ExternalLink[]): void {
  try {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (e) {
    console.error('Failed to save links:', e);
  }
}

// 随机生成灵感 - 占位符替换
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillRandomTemplate(tpl: { title: string; hook: string }): { title: string; hook: string } {
  const numbers = [3, 5, 7, 10, 12, 30, 100, 365];
  const prices = ['50', '100', '200', '300', '500'];
  const times = ['一周', '一个月', '半年', '一年', '三年'];
  const ages = ['25', '30', '35', '40'];

  const replace = (s: string) => s
    .replace(/{{数字}}/g, String(pick(numbers)))
    .replace(/{{价格}}/g, pick(prices))
    .replace(/{{时间}}/g, pick(times))
    .replace(/{{年龄}}/g, pick(ages));

  return { title: replace(tpl.title), hook: replace(tpl.hook) };
}

export default function MediaStudio() {
  const [tab, setTab] = useState<TabType>('news');
  const [news, setNews] = useState<HotTopic[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [customLinks, setCustomLinks] = useState<ExternalLink[]>([]);
  const [showAddNews, setShowAddNews] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newsCategory, setNewsCategory] = useState('全部');
  const [linkCategory, setLinkCategory] = useState('全部');
  const [ideaAccount, setIdeaAccount] = useState<'beauty' | 'ins'>('beauty');
  const [generatedIdea, setGeneratedIdea] = useState<{ title: string; hook: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newNews, setNewNews] = useState({
    title: '', category: 'AI工具', heat: 50, source: '', url: '', notes: '',
  });
  const [newIdea, setNewIdea] = useState({
    title: '', description: '', account: 'beauty' as 'beauty' | 'ins',
    tags: '', hook: '',
  });
  const [newLink, setNewLink] = useState({
    name: '', description: '', category: 'AI工具', url: '',
  });

  useEffect(() => {
    // 资讯速递（HotTopic 存储）
    const storedNews = storage.getHotTopics();
    if (storedNews.length === 0) {
      const initialized = DEFAULT_NEWS.map(n => ({
        ...n,
        id: generateId(),
        addedAt: new Date().toISOString(),
      }));
      storage.setHotTopics(initialized);
      setNews(initialized);
    } else {
      setNews(storedNews);
    }

    // 灵感选题（ContentIdea 存储）
    const storedIdeas = storage.getContentIdeas();
    if (storedIdeas.length === 0) {
      const allDefaults = [
        ...DEFAULT_BEAUTY_IDEAS,
        ...DEFAULT_INS_IDEAS,
      ].map(i => ({
        ...i,
        id: generateId(),
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
      }));
      storage.setContentIdeas(allDefaults);
      setIdeas(allDefaults);
    } else {
      setIdeas(storedIdeas);
    }

    // 外网通道自定义链接
    setCustomLinks(loadCustomLinks());
  }, []);

  // ====== 资讯 handlers ======
  const saveNews = () => {
    if (!newNews.title.trim()) return;
    const item: HotTopic = {
      id: generateId(),
      title: newNews.title.trim(),
      category: newNews.category,
      heat: newNews.heat,
      source: newNews.source.trim() || '手动添加',
      url: newNews.url.trim(),
      notes: newNews.notes.trim(),
      addedAt: new Date().toISOString(),
    };
    const updated = [item, ...news];
    storage.setHotTopics(updated);
    setNews(updated);
    setShowAddNews(false);
    setNewNews({ title: '', category: 'AI工具', heat: 50, source: '', url: '', notes: '' });
  };

  const deleteNews = (id: string) => {
    const updated = news.filter(n => n.id !== id);
    storage.setHotTopics(updated);
    setNews(updated);
  };

  // ====== 灵感 handlers ======
  const saveIdea = () => {
    if (!newIdea.title.trim()) return;
    const idea: ContentIdea = {
      id: generateId(),
      title: newIdea.title.trim(),
      description: newIdea.description.trim(),
      platform: 'xiaohongshu',
      account: newIdea.account,
      tags: newIdea.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      hook: newIdea.hook.trim(),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    const updated = [idea, ...ideas];
    storage.setContentIdeas(updated);
    setIdeas(updated);
    setShowAddIdea(false);
    setNewIdea({ title: '', description: '', account: 'beauty', tags: '', hook: '' });
  };

  const deleteIdea = (id: string) => {
    const updated = ideas.filter(i => i.id !== id);
    storage.setContentIdeas(updated);
    setIdeas(updated);
  };

  const generateIdea = () => {
    const pool = ideaAccount === 'beauty' ? BEAUTY_RANDOM_IDEAS : INS_RANDOM_IDEAS;
    setGeneratedIdea(fillRandomTemplate(pick(pool)));
  };

  const saveGeneratedIdea = () => {
    if (!generatedIdea) return;
    const idea: ContentIdea = {
      id: generateId(),
      title: generatedIdea.title,
      description: '一键生成的灵感，可继续完善细节。',
      platform: 'xiaohongshu',
      account: ideaAccount,
      tags: ideaAccount === 'beauty' ? ['一键生成', '待完善'] : ['一键生成', '法式', '待完善'],
      hook: generatedIdea.hook,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    const updated = [idea, ...ideas];
    storage.setContentIdeas(updated);
    setIdeas(updated);
    setGeneratedIdea(null);
  };

  // ====== 链接 handlers ======
  const saveLink = () => {
    if (!newLink.name.trim() || !newLink.url.trim()) return;
    const link: ExternalLink = {
      id: generateId(),
      name: newLink.name.trim(),
      description: newLink.description.trim(),
      category: newLink.category,
      url: newLink.url.trim(),
      isCustom: true,
    };
    const updated = [link, ...customLinks];
    saveCustomLinks(updated);
    setCustomLinks(updated);
    setShowAddLink(false);
    setNewLink({ name: '', description: '', category: 'AI工具', url: '' });
  };

  const deleteLink = (id: string) => {
    const updated = customLinks.filter(l => l.id !== id);
    saveCustomLinks(updated);
    setCustomLinks(updated);
  };

  // ====== 复制 ======
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ====== 过滤 ======
  const filteredNews = newsCategory === '全部' ? news : news.filter(n => n.category === newsCategory);
  const allLinks = [...customLinks, ...DEFAULT_LINKS];
  const filteredLinks = linkCategory === '全部' ? allLinks : allLinks.filter(l => l.category === linkCategory);
  const beautyIdeas = ideas.filter(i => i.account === 'beauty');
  const insIdeas = ideas.filter(i => i.account === 'ins');

  const tabs = [
    { id: 'news' as TabType, label: '资讯速递', sub: 'News', icon: Newspaper },
    { id: 'ideas' as TabType, label: '灵感选题', sub: 'Ideas', icon: Lightbulb },
    { id: 'copy' as TabType, label: '文案模板', sub: 'Copywriting', icon: FileText },
    { id: 'links' as TabType, label: '外网通道', sub: 'Channels', icon: Globe },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.deepBrown }}>
          <Sparkles size={22} style={{ color: C.wine }} />
          自媒体运营中心
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Atelier de Contenu · 两个账号，一种法式生活
        </p>
        <div className="divider-french mt-3" />
      </div>

      {/* 双账号 banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass card card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4A5A5, #C9A876)' }}>
              <Heart size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-serif font-semibold" style={{ color: C.deepBrown }}>账号一 · 女性变美</p>
              <p className="text-xs truncate" style={{ color: C.soft }}>小红书 · 皮肤、抗老与自我和解</p>
            </div>
          </div>
        </div>
        <div className="glass card card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B9D83, #6B7D63)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-serif font-semibold" style={{ color: C.deepBrown }}>账号二 · ins 法式审美</p>
              <p className="text-xs truncate" style={{ color: C.soft }}>小红书 + Instagram · 穿搭、家居与生活</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${active ? 'btn-french' : 'glass'}`}
              style={active ? {} : { color: C.muted }}
            >
              <Icon size={16} />
              <span className="text-sm font-medium tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============ Tab 1: 资讯速递 ============ */}
      {tab === 'news' && (
        <div className="space-y-5">
          {/* 说明 */}
          <div className="glass card p-4 flex items-start gap-3" style={{ borderRadius: 12 }}>
            <Quote size={16} className="flex-shrink-0 mt-0.5" style={{ color: C.wine }} />
            <p className="text-xs font-serif leading-relaxed" style={{ color: C.muted }}>
              示例数据，可手动添加 · 实时资讯需接入后端 API，当前为示例数据，可手动添加收藏。
            </p>
          </div>

          {/* 筛选 + 添加 */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
              <Filter size={14} style={{ color: C.soft }} className="flex-shrink-0" />
              {NEWS_CATEGORIES.map(cat => {
                const active = newsCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setNewsCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${active ? 'btn-french' : 'glass'}`}
                    style={active ? {} : { color: C.muted }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAddNews(true)}
              className="btn-rose px-4 py-2 flex items-center gap-2 text-sm flex-shrink-0"
            >
              <Plus size={14} />
              添加资讯
            </button>
          </div>

          {/* 资讯列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 glass card">
                <Newspaper size={36} className="mx-auto mb-3" style={{ color: C.dustyRose }} />
                <p className="text-sm font-serif" style={{ color: C.muted }}>暂无相关资讯</p>
              </div>
            ) : (
              filteredNews.map(item => (
                <div key={item.id} className="glass card card-hover p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="tag-french px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,118,0.15)', color: C.roseGold }}>
                        {item.category}
                      </span>
                      <span className="text-xs" style={{ color: C.soft }}>{item.source}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: C.wine }}>
                        <Flame size={11} /> {item.heat}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteNews(item.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      style={{ color: C.soft }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h3 className="font-serif font-semibold mb-2 leading-snug" style={{ color: C.deepBrown }}>
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-sm font-serif leading-relaxed mb-3" style={{ color: C.muted }}>
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs" style={{ color: C.soft }}>
                    <span>{new Date(item.addedAt).toLocaleDateString('zh-CN')}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 transition hover:underline"
                        style={{ color: C.wine }}
                      >
                        <ExternalLink size={11} />
                        查看原文
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ Tab 2: 灵感选题 ============ */}
      {tab === 'ideas' && (
        <div className="space-y-5">
          {/* 账号切换 + 操作 */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2 flex-wrap">
              {([
                { id: 'beauty' as const, label: '账号一 · 女性变美', icon: Heart },
                { id: 'ins' as const, label: '账号二 · ins 法式审美', icon: Sparkles },
              ]).map(a => {
                const active = ideaAccount === a.id;
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => { setIdeaAccount(a.id); setGeneratedIdea(null); }}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all ${active ? 'btn-french' : 'glass'}`}
                    style={active ? {} : { color: C.muted }}
                  >
                    <Icon size={14} />
                    {a.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={generateIdea}
                className="btn-french px-4 py-2 flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} />
                一键生成灵感
              </button>
              <button
                onClick={() => setShowAddIdea(true)}
                className="btn-rose px-4 py-2 flex items-center gap-2 text-sm"
              >
                <Plus size={14} />
                添加灵感
              </button>
            </div>
          </div>

          {/* 生成预览 */}
          {generatedIdea && (
            <div className="glass card p-5 animate-slide-up" style={{ borderLeft: `3px solid ${C.wine}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-widest font-serif" style={{ color: C.wine }}>
                  ✨ 一键生成 · 可继续打磨
                </span>
                <button onClick={() => setGeneratedIdea(null)} className="p-1 rounded" style={{ color: C.soft }}>
                  <X size={14} />
                </button>
              </div>
              <h3 className="font-serif font-semibold text-lg mb-3 leading-snug" style={{ color: C.deepBrown }}>
                {generatedIdea.title}
              </h3>
              <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(212,165,165,0.15)' }}>
                <p className="text-xs mb-1" style={{ color: C.wine }}>📌 开场钩子</p>
                <p className="text-sm font-serif italic" style={{ color: C.deepBrown }}>
                  "{generatedIdea.hook}"
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveGeneratedIdea} className="btn-rose px-4 py-2 flex items-center gap-2 text-sm">
                  <Plus size={14} />
                  收藏到灵感库
                </button>
                <button onClick={generateIdea} className="glass px-4 py-2 flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                  <RefreshCw size={14} />
                  再来一个
                </button>
              </div>
            </div>
          )}

          {/* 灵感列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(ideaAccount === 'beauty' ? beautyIdeas : insIdeas).length === 0 ? (
              <div className="md:col-span-2 text-center py-16 glass card">
                <Lightbulb size={36} className="mx-auto mb-3" style={{ color: C.dustyRose }} />
                <p className="text-sm font-serif" style={{ color: C.muted }}>这个账号还没有灵感</p>
                <p className="text-xs mt-1" style={{ color: C.soft }}>点击"一键生成灵感"或手动添加</p>
              </div>
            ) : (
              (ideaAccount === 'beauty' ? beautyIdeas : insIdeas).map(idea => (
                <div key={idea.id} className="glass card card-hover p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="tag-french px-2 py-0.5 rounded"
                      style={{
                        background: ideaAccount === 'beauty' ? 'rgba(212,165,165,0.2)' : 'rgba(139,157,131,0.15)',
                        color: ideaAccount === 'beauty' ? C.wine : C.sage,
                      }}
                    >
                      {ideaAccount === 'beauty' ? '女性变美' : '法式审美'}
                    </span>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      style={{ color: C.soft }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h3 className="font-serif font-semibold mb-2 leading-snug" style={{ color: C.deepBrown }}>
                    {idea.title}
                  </h3>
                  <p className="text-sm font-serif leading-relaxed mb-3" style={{ color: C.muted }}>
                    {idea.description}
                  </p>

                  {idea.hook && (
                    <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(212,165,165,0.12)' }}>
                      <p className="text-xs mb-1" style={{ color: C.wine }}>📌 开场钩子</p>
                      <p className="text-sm font-serif italic" style={{ color: C.deepBrown }}>
                        "{idea.hook}"
                      </p>
                    </div>
                  )}

                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {idea.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,168,118,0.12)', color: C.muted }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs" style={{ color: C.soft }}>
                    <span>{new Date(idea.createdAt).toLocaleDateString('zh-CN')}</span>
                    <button
                      onClick={() => copyText(
                        `${idea.title}\n\n${idea.description}\n\n钩子：${idea.hook}\n\n标签：${idea.tags.join('、')}`,
                        idea.id
                      )}
                      className="flex items-center gap-1 transition hover:underline"
                      style={{ color: C.wine }}
                    >
                      {copiedId === idea.id ? <span>已复制 ✓</span> : (<><Copy size={11} /> 复制</>)}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ Tab 3: 文案模板 ============ */}
      {tab === 'copy' && (
        <div className="space-y-5">
          <div className="glass card p-4 flex items-start gap-3" style={{ borderRadius: 12 }}>
            <Quote size={16} className="flex-shrink-0 mt-0.5" style={{ color: C.wine }} />
            <p className="text-xs font-serif leading-relaxed" style={{ color: C.muted }}>
              活人感文案模板 · 拒绝官方腔 · 用词精准 · 占位符用 {'{{ }}'} 标注，按场景替换即可。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COPY_TEMPLATES.map(tpl => (
              <div key={tpl.id} className="glass card card-hover p-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span
                    className="tag-french px-2 py-0.5 rounded"
                    style={{
                      background: tpl.account === 'beauty' ? 'rgba(212,165,165,0.2)'
                        : tpl.account === 'ins' ? 'rgba(139,157,131,0.15)'
                        : 'rgba(201,168,118,0.15)',
                      color: tpl.account === 'beauty' ? C.wine
                        : tpl.account === 'ins' ? C.sage
                        : C.roseGold,
                    }}
                  >
                    {tpl.scene}
                  </span>
                  <button
                    onClick={() => copyText(`【${tpl.scene}】\n\n${tpl.title}\n\n${tpl.body}\n\n钩子：${tpl.hook}`, tpl.id)}
                    className="text-xs flex items-center gap-1 transition hover:underline flex-shrink-0"
                    style={{ color: C.wine }}
                  >
                    {copiedId === tpl.id ? <span>已复制 ✓</span> : (<><Copy size={12} /> 复制文案</>)}
                  </button>
                </div>

                <h3 className="font-serif font-semibold mb-3 leading-snug" style={{ color: C.deepBrown }}>
                  {tpl.title}
                </h3>

                <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap mb-3" style={{ color: C.ink }}>
                  {tpl.body}
                </p>

                <div className="rounded-lg p-3" style={{ background: 'rgba(212,165,165,0.12)' }}>
                  <p className="text-xs mb-1" style={{ color: C.wine }}>📌 钩子句</p>
                  <p className="text-sm font-serif italic" style={{ color: C.deepBrown }}>
                    {tpl.hook}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Tab 4: 外网通道 ============ */}
      {tab === 'links' && (
        <div className="space-y-5">
          <div className="glass card p-4 flex items-start gap-3" style={{ borderRadius: 12 }}>
            <Quote size={16} className="flex-shrink-0 mt-0.5" style={{ color: C.wine }} />
            <p className="text-xs font-serif leading-relaxed" style={{ color: C.muted }}>
              受浏览器跨域限制，以下链接需在新窗口打开，部分内容可能需要科学上网。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
              <Filter size={14} style={{ color: C.soft }} className="flex-shrink-0" />
              {LINK_CATEGORIES.map(cat => {
                const active = linkCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setLinkCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${active ? 'btn-french' : 'glass'}`}
                    style={active ? {} : { color: C.muted }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAddLink(true)}
              className="btn-rose px-4 py-2 flex items-center gap-2 text-sm flex-shrink-0"
            >
              <Plus size={14} />
              添加链接
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 text-center py-16 glass card">
                <Globe size={36} className="mx-auto mb-3" style={{ color: C.dustyRose }} />
                <p className="text-sm font-serif" style={{ color: C.muted }}>暂无相关链接</p>
              </div>
            ) : (
              filteredLinks.map(link => (
                <div key={link.id} className="glass card card-hover p-5 group relative">
                  {link.isCustom && (
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 transition z-10"
                      style={{ color: C.soft, background: 'rgba(255,255,255,0.6)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <div className="flex items-start justify-between mb-2 pr-6">
                      <span className="tag-french px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,118,0.15)', color: C.roseGold }}>
                        {link.category}
                      </span>
                      <ExternalLink size={14} style={{ color: C.soft }} className="group-hover:translate-x-0.5 transition flex-shrink-0" />
                    </div>
                    <h3 className="font-serif font-semibold mb-2" style={{ color: C.deepBrown }}>
                      {link.name}
                    </h3>
                    <p className="text-xs font-serif leading-relaxed" style={{ color: C.muted }}>
                      {link.description}
                    </p>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ Add News Modal ============ */}
      {showAddNews && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddNews(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: C.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>添加资讯</h2>
                <p className="text-xs mt-0.5" style={{ color: C.soft }}>Nouvelle Info</p>
              </div>
              <button onClick={() => setShowAddNews(false)} className="p-1.5 rounded-lg hover:bg-white/50">
                <X size={18} style={{ color: C.muted }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>标题</label>
                <input
                  value={newNews.title}
                  onChange={e => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="如：Sora 2 物理一致性大幅提升"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>分类</label>
                  <select
                    value={newNews.category}
                    onChange={e => setNewNews({ ...newNews, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                  >
                    {NEWS_CATEGORIES.filter(c => c !== '全部').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>来源</label>
                  <input
                    value={newNews.source}
                    onChange={e => setNewNews({ ...newNews, source: e.target.value })}
                    placeholder="如：ProductHunt"
                    className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>
                  热度 · {newNews.heat}
                </label>
                <input
                  type="range" min={0} max={100} value={newNews.heat}
                  onChange={e => setNewNews({ ...newNews, heat: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: C.mist, accentColor: C.wine }}
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>链接（可选）</label>
                <input
                  value={newNews.url}
                  onChange={e => setNewNews({ ...newNews, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>简介</label>
                <textarea
                  value={newNews.notes}
                  onChange={e => setNewNews({ ...newNews, notes: e.target.value })}
                  placeholder="这条资讯讲了什么、为什么值得看…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french resize-none"
                />
              </div>
            </div>

            <button
              onClick={saveNews}
              disabled={!newNews.title.trim()}
              className="w-full mt-6 py-3 btn-rose text-sm font-serif tracking-wide"
              style={newNews.title.trim() ? {} : { opacity: 0.4, cursor: 'not-allowed' }}
            >
              收藏这条资讯
            </button>
          </div>
        </div>
      )}

      {/* ============ Add Idea Modal ============ */}
      {showAddIdea && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddIdea(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: C.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>添加灵感</h2>
                <p className="text-xs mt-0.5" style={{ color: C.soft }}>Idée de Contenu</p>
              </div>
              <button onClick={() => setShowAddIdea(false)} className="p-1.5 rounded-lg hover:bg-white/50">
                <X size={18} style={{ color: C.muted }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-serif mb-2 block" style={{ color: C.deepBrown }}>归属账号</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'beauty' as const, label: '账号一 · 女性变美' },
                    { id: 'ins' as const, label: '账号二 · ins 法式' },
                  ]).map(a => {
                    const active = newIdea.account === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setNewIdea({ ...newIdea, account: a.id })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-serif transition ${active ? 'btn-french' : 'glass'}`}
                        style={active ? {} : { color: C.muted }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>标题</label>
                <input
                  value={newIdea.title}
                  onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="如：5 个让皮肤变好的晨间习惯"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>内容描述</label>
                <textarea
                  value={newIdea.description}
                  onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="这篇内容想讲什么、怎么讲、亮点是什么…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>开场钩子（Hook）</label>
                <input
                  value={newIdea.hook}
                  onChange={e => setNewIdea({ ...newIdea, hook: e.target.value })}
                  placeholder="第一句话，决定读者是否留下…"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>标签（逗号分隔）</label>
                <input
                  value={newIdea.tags}
                  onChange={e => setNewIdea({ ...newIdea, tags: e.target.value })}
                  placeholder="如：护肤, 抗老, 35+"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>
            </div>

            <button
              onClick={saveIdea}
              disabled={!newIdea.title.trim()}
              className="w-full mt-6 py-3 btn-rose text-sm font-serif tracking-wide"
              style={newIdea.title.trim() ? {} : { opacity: 0.4, cursor: 'not-allowed' }}
            >
              收藏这条灵感
            </button>
          </div>
        </div>
      )}

      {/* ============ Add Link Modal ============ */}
      {showAddLink && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddLink(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-6 animate-slide-up"
            style={{ background: C.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>添加链接</h2>
                <p className="text-xs mt-0.5" style={{ color: C.soft }}>Ressource Personnalisée</p>
              </div>
              <button onClick={() => setShowAddLink(false)} className="p-1.5 rounded-lg hover:bg-white/50">
                <X size={18} style={{ color: C.muted }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>名称</label>
                <input
                  value={newLink.name}
                  onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                  placeholder="如：Dribbble"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>描述</label>
                <input
                  value={newLink.description}
                  onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="一句话说明这个链接是干嘛的"
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>分类</label>
                <select
                  value={newLink.category}
                  onChange={e => setNewLink({ ...newLink, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                >
                  {LINK_CATEGORIES.filter(c => c !== '全部').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-serif mb-1 block" style={{ color: C.deepBrown }}>链接 URL</label>
                <input
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
                />
              </div>
            </div>

            <button
              onClick={saveLink}
              disabled={!newLink.name.trim() || !newLink.url.trim()}
              className="w-full mt-6 py-3 btn-rose text-sm font-serif tracking-wide"
              style={(newLink.name.trim() && newLink.url.trim()) ? {} : { opacity: 0.4, cursor: 'not-allowed' }}
            >
              添加这个链接
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

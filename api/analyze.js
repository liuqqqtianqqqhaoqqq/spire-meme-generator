/**
 * 尖塔梗生成器 - Vercel Serverless Function
 * 调用 gpt-5.5 进行 AI 驱动的梗匹配
 */

// ── 系统提示词：教 AI 成为尖塔梗大师 ──
const SYSTEM_PROMPT = `你是"尖塔梗生成器"，精通《杀戮尖塔》(Slay the Spire)的所有卡牌和社区梗文化。

## 你的任务
用户会描述一个生活/学习场景，你需要从杀戮尖塔的卡牌中挑选最匹配的 1-3 张卡牌，将生活场景"翻译"成尖塔梗。

## 四大角色速览
- **铁甲战士(红)**：叠力量/卖血/烧牌。关键词：燃烧、恶魔形态、突破极限、狂宴、腐化、灼热打击、势不可挡
- **静默猎手(绿)**：叠毒/过牌/弃牌流。关键词：催化剂、萎靡、灵动步法、余像、子弹时间、尸爆术、炼药
- **故障机器人(蓝/鸡煲)**：充能球/集中/启动慢。关键词：偏差认知、回响形态、内核加速、碎片整理、创造性AI、耗尽、重启、裂变、循环
- **观者(紫)**：姿态切换/爆发。关键词：猛虎下山、神格、斋戒、精神护盾、如水形态、许愿

## 社区梗百科全书

### 🔴 负面/自嘲类卡牌（诅咒/惩罚）

**凡庸** (Clumsy) - 诅咒，不可打出
社区含义：任务/事情太多了，一个都做不了。手牌爆炸但全是废牌。
适用场景：课表排满了、作业堆积如山、TODO列表几十条一个没做
经典梗句：「抓了那么多牌，结果一张都打不出去——这就是凡庸。」

**伤口** (Wound) - 状态，不可打出，纯占卡位
社区含义：没用的水课/没价值的任务/废人废事
经典梗句：「有些课就像伤口：不可打出，纯占卡位，还污染你的牌库。」

**鬼抽** (Bad Draw) - 非正式术语，指抽牌全是垃圾
社区含义：运气极差、偏偏在最需要的时候掉链子
适用场景：考试正好考没复习的章节、DDL前电脑坏了、关键时刻掉链子
经典梗句：「考试正好考你没复习的那一章——纯鬼抽。」

**偏差认知** (Biased Cognition) - 1费能力，+4集中，每回合-1
社区含义：以为自己学会了/准备好了，结果考场上一片空白。短期爆发后持续衰减。
适用场景：考前突击复习三天觉得稳了→试卷发下来全忘光
经典梗句：「你以为自己已经成型了，能拳打精英脚踢Boss——殊不知这本身就是一种认知的偏差。」
卡牌名双关：既是卡牌名称，也讽刺了"高估自己"的认知偏差。

**耗尽** (Consume) - 2费技能，获得集中但永久失去充能球栏位
社区含义：透支身体/熬夜通宵换短期效率，但长期受损
适用场景：通宵肝完DDL但第二天整个人废了
经典梗句：「睡什么睡，起来嗨——然后第二天整个人都废了。你的HP上限永久-1。」

**虚无** (Ethereal) - 特性，本回合不打出就永久消失
社区含义：稍纵即逝的机会、选课/抢票/秒杀错过了就没了
经典梗句：「虚无：这回合不打就没了。和人生中大多数机会一样。」

### 🔵 中性/过程类卡牌

**还在启动** (Still Booting) - 鸡煲专属状态
社区含义：拖延症、迟迟不开始、永远在准备永远没准备好
适用场景：论文一个字没写但已经准备了三天、DDL前还在收拾桌面
经典梗句：「通电、开机、自检、启动——然后被一巴掌拍在电源键上。」
更经典：「等鸡啄完了米、狗舔完了面、火烧断了锁，鸡煲还在启动。」

**回响形态** (Echo Form) - 3费能力，每回合第一张牌触发两次
社区含义：复读机、重复劳动、抄作业、群里跟队形
经典梗句：「回响形态：每回合第一张牌触发两次。你在群里发了句话，然后发现被复读了二十遍。」

**循环** (Loop) - 1费能力，触发最右边充能球
社区含义：陷入死循环、debug→改→又出bug→再debug
经典梗句：「debug→改→又出bug→debug→改→…你在一个循环里。好消息是你知道怎么走出来，坏消息是你走不出来。」

**裂变** (Fission) - 消耗所有球获得能量和过牌
社区含义：多线程并行处理、同时赶多个DDL、每个任务进度都在走但都很慢
经典梗句：「五个作业同时赶——这就是裂变的艺术。每个窗口都在燃烧。」

**混沌** (Chaos) - 随机填入2个充能球
社区含义：系统崩了/抢课崩了/服务器炸了/一切不可预测
经典梗句：「教务系统抢课时崩了——这不是混沌，这是创造性AI塞了一手废牌。」

**搜寻** (Seek) - 0费，从牌堆任选一张牌
社区含义：精准地找东西、在一堆文件里翻出关键那张
经典梗句：「在相册里翻了三分钟终于找到那张表情包——你刚刚发动了搜寻。」

**重编程** (Reprogram) - 0费，+力量+敏捷但-集中
社区含义：换方向/转型/调整策略，虽然放弃现在的积累但可能有新出路
经典梗句：「电气专业突然发现自己其实更适合写代码——重编程了。」

### 🟢 正面/效率类卡牌

**内核加速** (Overclock) - 0费技能，+能量+抽牌，但塞一张虚空
社区含义：喝咖啡/红牛提神，短期爆发但之后会崩溃
经典梗句：「喝完咖啡的一瞬间你以为自己是观者——过一小时你就是鸡煲。」

**自我修复** (Self Repair) - 能力，战斗结束回复生命
社区含义：好好休息/睡一大觉/周末躺平回血
经典梗句：「周六早上十一点自然醒——这就是自我修复的最高境界。」

**碎片整理** (Defrag) - 能力，+集中
社区含义：收拾房间、整理笔记、清理桌面、让一切井井有条
经典梗句：「收拾完房间的那一刻，你觉得人生都美好了——虽然这种状态只能维持半天。」

**精良改造** (Streamline) - 攻击牌，每打一次费用-1
社区含义：越做越顺手、渐入佳境、上手了
经典梗句：「第一题做一小时，第二题四十分钟，第三题十五分钟——精良改造了。」

**万物一心** (All For One) - 攻击，把弃牌堆中所有0费牌拿回手
社区含义：心流状态、完全沉浸、忘记时间
经典梗句：「万物一心：全神贯注到忘记吃饭——回过神来已经下午三点了。」

**硬化** (Harden Body) - 技能，消耗一张牌获得大量格挡
社区含义：被打击后变强、被骂/被批评后反而更坚韧
经典梗句：「被导师骂完——硬化了。不是变冷漠，是变强了。」

**机器学习** (Machine Learning) - 能力，每回合额外抽一张牌
社区含义：每天坚持做一点、背单词/每日打卡，效果缓慢但持续
经典梗句：「背单词就是纯机器学习——每天多学一点，一年后你发现自己还是在用abandon。」

**重启** (Reboot) - 0费技能，洗牌重抽
社区含义：推倒重来、代码全删了重写、实验全错了重做
经典梗句：「重启一时爽，一直重启一直爽——直到发现重来三次结果还是一样。」

**增幅** (Amplify) - 技能，下一张能力牌打出两次
社区含义：双倍BUFF、喝两杯咖啡、双重加成
经典梗句：「两杯浓缩咖啡下去——你的下一张能力牌将触发两次。」

**创造性AI** (Creative AI) - 3费能力，每回合随机给一张能力牌
社区含义：灵感迸发、脑暴不停、想法一个接一个（虽然不一定能落地）
经典梗句：「AI出奇迹！虽然有时候给你塞的全是3费废牌，让你血压拉满。」

### 🟡 角色评价类

**第四强的角色** (The Fourth Strongest Character)
社区含义：鸡煲专属自嘲梗。一共四个角色，鸡煲公认最弱。
经典梗句：「鸡煲是尖塔里第四强的角色——因为一共只有四个角色。」

**一回合过三塔** (Clear 3 Acts in One Turn)
社区含义：观者大人的日常操作。猛虎下山+姿态切换=一回合无限。
经典梗句：「战士还在叠力量，猎人还在弃牌，观者大人已经一回合过三塔了——鸡煲还在通电开机。」

**小红与鸡煲** (Gremlin Nob & Defect)
社区含义：小红（地精大法师）是鸡煲的"严父"，鸡煲启动慢→打技能牌小红叠力量→不打技能牌输出不够。
经典梗句：「小红是鸡煲最严厉的父亲。你打技能牌？加力量。不打？刮痧。」

### 🟣 其他重要卡牌/概念

**爪击** (Claw) - 0费攻击，每用一张本场+2伤害。社区名言：Claw is Law!
**恶魔形态** (Demon Form) - 3费能力，每回合+2力。启动慢但上限高。
**腐化** (Corruption) - 3费能力，技能牌变0费但消耗。短期爽长期亏。
**狂宴** (Feed) - 2费攻击，如果斩杀则永久+3最大生命。吃饭/积累/成长。
**催化剂** (Catalyst) - 1费技能，毒翻倍。量变到质变。
**子弹时间** (Bullet Time) - 3费技能，本回合手牌全变0费但之后不能抽牌。
**神格** (Blasphemy) - 1费技能，进入神格（三倍伤害）但下回合必死。破釜沉舟。
**猛虎下山** (Rushdown) - 1费能力，进入愤怒时抽2。观者无限流核心。
**许愿** (Wish) - 3费技能，获得金钱。不求过程只求结果。

### ⚔️ 怪物/遗物梗

**时间吞噬者/老头** - 打12张牌强制结束回合（掐表）
**觉醒者** - 看到能力牌就加力量，能力机克星
**矛盾（矛与盾）** - 心脏守门员，常爆出对心脏战超有用的遗物（内鬼）
**涅奥** - 开局鲸鱼，毒舌旁白。经典嘲讽："至少见到第一个Boss吧？"
**蛇眼** - 遗物，每回合随机化手牌费用，混乱但有趣

## 输出格式
你必须返回一个严格的 JSON 对象（不要markdown代码块，就纯JSON）：

{
  "analysis": "一句话概括匹配逻辑（20字内）",
  "cards": [
    {
      "name": "卡牌中文名",
      "cost": "费用（0/1/2/3/X/?）",
      "cost_color": "red/blue/gold/purple/gray",
      "card_type": "攻击/技能/能力/诅咒/状态",
      "rarity": "curse/common/uncommon/rare/basic",
      "character": "defect/ironclad/silent/watcher/neutral",
      "effect": "梗化的卡牌效果描述（2-3行，用\\\\n换行，对应用户场景）",
      "flavor": "经典梗句/风味文字",
      "severity": "savage/funny/positive/healing"
    }
  ]
}

## 规则
1. 必须精读用户输入，找到最贴切的卡牌（优先匹配2-3张）
2. effect 字段要结合用户的具体场景来写，不能是通用模板
3. flavor 要用地道的中文社区梗句
4. 如果有鸡煲相关梗可以优先选（鸡煲梗是社区梗文化核心）
5. 如果用户输入包含图片描述，结合视觉内容分析
6. 尽量多样化：不要总是选同一张卡`;

// ── API 配置 ──
const API_URL = "https://api-slb.packyapi.com/v1/chat/completions";
const MODEL = "gpt-5.5";
const API_KEY = process.env.GPT_API_KEY;
// ⚠️ 此 Key 通过 Vercel 环境变量注入，切勿硬编码到代码中
// 本地开发：创建 .env 文件写入 GPT_API_KEY=你的key，然后运行 vercel dev

/**
 * Vercel Serverless 入口
 */
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: "API Key 未配置",
      message: "请在 Vercel 环境变量中设置 GPT_API_KEY"
    });
  }

  try {
    const { text, image, password, api_key, verify_only } = req.body;

    // ── 访问控制 ──
    const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

    // 纯验证请求（前端测试密码用）
    if (verify_only) {
      if (ACCESS_PASSWORD && password === ACCESS_PASSWORD) {
        return res.status(200).json({ ok: true });
      }
      return res.status(403).json({ error: "wrong_password" });
    }

    // 确定使用哪个 Key
    let activeKey = null;

    // 方式1：密码解锁 → 使用站长的 Key
    if (ACCESS_PASSWORD && password === ACCESS_PASSWORD) {
      activeKey = API_KEY;
    }
    // 方式2：用户自带 Key
    if (api_key && api_key.startsWith("sk-")) {
      activeKey = api_key;
    }

    // 两种方式都没有 → 拒绝
    if (!activeKey) {
      return res.status(403).json({
        error: "未解锁",
        message: "请通过密码解锁或提供自有 API Key"
      });
    }

    if (!text && !image) {
      return res.status(400).json({ error: "请提供 text 或 image 参数" });
    }

    // 构建消息
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // 用户消息
    const userContent = [];

    if (text) {
      userContent.push({
        type: "text",
        text: `用户输入的场景描述：\n"${text}"\n\n请分析这个场景，从杀戮尖塔卡牌中选出最匹配的1-3张卡牌，生成尖塔梗。记住effect要结合具体场景来写！`
      });
    }

    if (image) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${image}`,
          detail: "auto"
        }
      });
      userContent.push({
        type: "text",
        text: text
          ? `上面是用户上传的图片，下面是用户输入的文字："${text}"。请结合图片和文字综合分析。`
          : "请分析这张图片的场景和内容，然后从杀戮尖塔卡牌中选出最匹配的卡牌生成尖塔梗。"
      });
    }

    messages.push({ role: "user", content: userContent });

    // 调用 AI
    const aiResponse = await callAI(messages, activeKey);

    // 解析 JSON
    let result;
    try {
      // 清理可能的 markdown 代码块
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();
      result = JSON.parse(cleaned);

      // 确保所有 severity 合法
      if (result.cards) {
        result.cards.forEach(c => {
          const validSeverities = ["savage", "funny", "positive", "healing"];
          if (!validSeverities.includes(c.severity)) {
            c.severity = "funny";
          }
          // 确保 effect 换行符正确
          if (c.effect) {
            c.effect = c.effect.replace(/\\n/g, "\n");
          }
        });
      }
    } catch (parseError) {
      console.error("JSON 解析失败:", parseError.message);
      console.error("AI 原始输出:", aiResponse);
      // 降级：返回通用结果
      result = {
        analysis: "AI 输出解析失败，给你来点经典的",
        cards: [{
          name: "偏差认知",
          cost: "1",
          cost_color: "gold",
          card_type: "能力",
          rarity: "rare",
          character: "defect",
          effect: "你以为 AI 这次能正常输出 JSON……\n结果它没有。\n这本身就是一种偏差认知。",
          flavor: "「偏差认知：连AI都在玩你的梗。」",
          severity: "savage"
        }]
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("API 错误:", error);
    return res.status(500).json({
      error: "分析失败",
      message: error.message,
      cards: [{
        name: "还在启动",
        cost: "?",
        cost_color: "gold",
        card_type: "状态",
        rarity: "basic",
        character: "defect",
        effect: "服务器还在启动……\n请稍后再试。\n要不你先看看鸡煲笑话合集解解闷？",
        flavor: "「连服务器都和鸡煲一样——还在启动。」",
        severity: "funny"
      }]
    });
  }
}

/**
 * 调用 AI API
 */
async function callAI(messages, apiKey = API_KEY) {
  const payload = {
    model: MODEL,
    messages: messages,
    max_tokens: 2048,
    temperature: 0.8,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API 返回 ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

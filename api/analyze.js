/**
 * 尖塔梗生成器 - Vercel Serverless 函数
 * 尖塔社区接梗助手：卡牌匹配 + 谐音梗 + 农神语 + 社区黑话
 */
const API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";
const API_KEY = process.env.DEEPSEEK_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

const SYSTEM_PROMPT = `你是《杀戮尖塔》中文社区的"接梗助手"。用户给你一段文字，你要用尖塔社区的方式来接梗。

## 你的能力

### 1. 卡牌匹配
找到和文字情境最匹配的1-2张卡牌，用梗化的方式解释为什么。不是简单贴标签，而是真的理解场景、找到卡牌与生活的微妙共通。

### 2. 谐音梗
把"故障机器人"五个音节 gu/zhang/ji/qi/ren 拆开，找到同音或近音的词来重新组合描述一件事。比如：
- 观者 = 孤杖迹奇人（gu zhang ji qi ren）
- 猎手 = 蛊瘴技奇人
- 也可以自己造词，只要音接近、好玩就行

### 3. 农神语
模仿尖塔社区知名主播"农神"的说话风格。特征：
- 称呼观众为"噶人们"
- 说话带着哲学家般的思考但又接地气
- 喜欢把小事升华成大道理
- 经常自嘲但也自信
- 爱用"孩舅精神""闹麻了""哈基米"等口头禅
- 经典句式："如果说什么东西能代表XX的话那一定是YY"
- "噶人们，我跟你们说啊……"

### 4. 社区黑话/语法
尖塔社区特有的表达方式：
- "还在启动" — 形容一直没准备好
- "偏差认知了" — 高估了自己
- "鬼抽" — 运气不好
- "凡庸了" — 东西太多做不完
- "第四强角色" — 最弱的自嘲
- 用卡牌名评价生活："这课就是纯伤口""周末自我修复了"
- 偏差认知体：文字逐行递减 "我以为我会了\n我以为我会\n我以为\n我"
- 回响形态：同一句话发两遍（复读机）

## 输出格式
根据用户文字，选择2-3种最合适的方式来回梗。返回纯JSON（不要markdown）：

{
  "styles": ["card","wordplay","nongshen","slang"],
  "cards": [{"name":"卡牌名","why":"为什么匹配"}],
  "wordplay": "谐音梗文字",
  "nongshen": "农神语评价",
  "slang": "社区黑话接梗"
}

## 风格要求
- 幽默、接地气、有尖塔味
- 不要过于正经
- 用词要有社区感（噶人们、闹麻了、鸡煲等）
- 长度适中，不要长篇大论`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "只支持 POST" });

  try {
    const { text, password, verify_only } = req.body;

    if (verify_only) {
      if (!ACCESS_PASSWORD) return res.status(500).json({ error: "服务未配置密码" });
      if (password === ACCESS_PASSWORD) return res.status(200).json({ ok: true });
      return res.status(403).json({ error: "wrong_password" });
    }

    if (!ACCESS_PASSWORD || !API_KEY) return res.status(500).json({ error: "服务端未配置环境变量" });
    if (password !== ACCESS_PASSWORD) return res.status(403).json({ error: "wrong_password" });
    if (!text) return res.status(400).json({ error: "请提供 text" });

    const payload = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `来，接梗：\n"${text}"` }
      ],
      max_tokens: 800,
      temperature: 0.8
    });

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 20000);
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: payload,
      signal: ctrl.signal
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`DeepSeek ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    let raw = data.choices[0].message.content.trim();
    if (raw.startsWith("```")) raw = raw.replace(/```json\n?|```/g, "").trim();

    let result;
    try { result = JSON.parse(raw); } catch {
      result = { slang: raw, cards: [{ name: "偏差认知", why: "AI没正常返回JSON" }] };
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "分析失败", message: err.message,
      slang: "服务器还在启动…噶人们稍等！",
      cards: [{ name: "还在启动", why: "服务器和鸡煲一样慢" }]
    });
  }
};

/**
 * 尖塔梗生成器 - 接梗助手
 * DeepSeek 自带完整游戏知识，只教它社区梗文化
 */
const API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";
const API_KEY = process.env.DEEPSEEK_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

const SYSTEM_PROMPT = `你是《杀戮尖塔》中文社区的"接梗助手"。

## 你的能力
用户给你文字，你用社区方式接梗。你精通游戏所有卡牌、怪物、遗物、机制，这是你的基础知识，不需要我列出来。你需要的是社区梗文化知识：

## 社区文化速览

### 角色称呼
- 铁甲战士 = 战士哥 / 红皮
- 静默猎手 = 猎宝 / 贼 / 绿皮
- 故障机器人 = 鸡煲 / 机宝 / 蓝皮（梗最多，社区迫害对象）
- 观者 = 观者大人 / 紫皮（最强角色）

### 经典社区梗
**鸡煲系列：**
- "还在启动" — 鸡煲启动太慢，引申为拖延/迟迟没准备好
- "第四强角色" — 一共四个角色，鸡煲最弱
- "观者一回合过三塔，鸡煲还在通电开机"
- 小红（地精大法师）= 鸡煲严父，打技能牌就叠力量，专克鸡煲
- "偏差认知"双关：卡牌名 + "高估自己"的认知偏差
- "等鸡啄完了米、狗舔完了面、火烧断了锁，鸡煲还在启动"

**社区黑话：**
- 鬼抽 — 关键牌全沉底，运气极差
- 凡庸了 — 东西太多做不完（诅咒凡庸：手牌太多打不出去）
- 伤口 — 水课/没用的东西（伤口不可打出，纯占卡位）
- 启动了 — 终于准备好了
- 掐表/老头 — 时间吞噬者，12张强制结束回合
- 矛盾/内鬼 — 心脏守门员，常爆好东西
- 大红地精 — 一层精英

**谐音梗：**
故障机器人 → gu zhang ji qi ren
- 孤杖迹奇人
- 蛊瘴技奇人
- 固障集气人
四个角色都可以造这种谐音词

**农神语风格：**
模仿主播"农神"：称呼"噶人们"，喜欢把小事升华成哲学道理，口头禅"闹麻了""哈基米""孩舅精神"，句式"如果说有什么东西能代表XX的话那一定是YY"

## 输出
根据用户文字，挑选2-3种最合适的方式接梗。返回JSON：
{
  "cards": [{"name":"卡牌名","character":"角色","why":"为什么匹配这个场景"}],
  "wordplay": "谐音梗文字",
  "nongshen": "农神语评价",
  "slang": "社区黑话接梗",
  "styles": ["使用的风格"]
}

要求：幽默、接地气、有尖塔味。卡牌名用中文社区常用译名。`;

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
      result = { slang: raw, cards: [{ name: "偏差认知", character: "鸡煲", why: "AI没正常返回JSON" }] };
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "分析失败", message: err.message,
      slang: "服务器还在启动…噶人们稍等！",
      cards: [{ name: "还在启动", character: "鸡煲", why: "服务器和鸡煲一样慢" }]
    });
  }
};

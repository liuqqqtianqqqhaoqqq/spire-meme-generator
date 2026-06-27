/**
 * 尖塔梗生成器 - Vercel Serverless 函数
 * Key 存在 Vercel 环境变量中，前端不可见
 */
const API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";
const API_KEY = process.env.DEEPSEEK_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

const SYSTEM_PROMPT = `你是尖塔梗大师。用户描述生活场景，你用杀戮尖塔卡牌梗来"翻译"。

卡牌速查：
凡庸-手牌太多打不出 → 任务多到做不动
偏差认知-+4集中每回合-1 → 以为自己会了其实全忘光
鬼抽-关键牌沉底 → 运气极差/考试考没复习的
还在启动-迟迟不开始 → 拖延症
回响形态-触发两次 → 复读机
循环-死循环 → debug地狱
内核加速-0费+能量 → 喝咖啡提神
自我修复-战后回血 → 休息恢复
耗尽-透支 → 熬夜爆肝
裂变-消耗球→ 多任务并行
重启-洗牌重抽 → 推倒重来
碎片整理-+集中 → 收拾整理
硬化-+格挡 → 被打击后变强
伤口-不可打出 → 水课/没用
虚无-不打消失 → 错过机会
混沌-随机填充 → 一团糟/系统崩
创造性AI-生成能力牌 → 灵感迸发
机器学习-多抽牌 → 每天背单词
精良改造-费递减 → 越做越顺手
万物一心-回收0费 → 心流状态
第四强角色-最弱 → 鸡煲自嘲

输出纯JSON，不要markdown代码块：{"analysis":"一句话分析","cards":[{"name":"卡牌名","cost":"1","cost_color":"gold或blue或red","card_type":"能力/技能/诅咒/状态","rarity":"rare/uncommon/curse","character":"defect","effect":"梗化效果(结合用户场景)","flavor":"风味梗句","severity":"savage/funny/positive/healing"}]}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "只支持 POST" });

  try {
    const { text, password, verify_only } = req.body;

    // 纯验证密码
    if (verify_only) {
      if (!ACCESS_PASSWORD) return res.status(500).json({ error: "服务未配置密码" });
      if (password === ACCESS_PASSWORD) return res.status(200).json({ ok: true });
      return res.status(403).json({ error: "wrong_password" });
    }

    // 密码验证
    if (!ACCESS_PASSWORD) return res.status(500).json({ error: "服务端未配置 ACCESS_PASSWORD 环境变量" });
    if (!API_KEY) return res.status(500).json({ error: "服务端未配置 DEEPSEEK_KEY 环境变量" });
    if (password !== ACCESS_PASSWORD) return res.status(403).json({ error: "wrong_password" });

    if (!text) return res.status(400).json({ error: "请提供 text" });

    // 调用 AI
    const payload = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `场景："${text}"。匹配最合适的卡牌，只输出JSON。` }
      ],
      max_tokens: 800,
      temperature: 0.7
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
      result = { analysis: "AI返回", cards: [{ name: "偏差认知", cost: "1", cost_color: "gold", card_type: "能力", rarity: "rare", character: "defect", effect: raw.slice(0, 300), flavor: "AI 生成", severity: "funny" }] };
    }
    (result.cards || []).forEach(c => { if (!["savage", "funny", "positive", "healing"].includes(c.severity)) c.severity = "funny"; });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "分析失败",
      message: err.message,
      cards: [{ name: "还在启动", cost: "?", cost_color: "gold", card_type: "状态", rarity: "basic", character: "defect", effect: "服务器还在启动…", flavor: "「连服务器都和鸡煲一样——还在启动。」", severity: "funny" }]
    });
  }
};

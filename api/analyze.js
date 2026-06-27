/**
 * 尖塔梗生成器 - Vercel Serverless Function
 */
const API_URL = "https://api-slb.packyapi.com/v1/chat/completions";
const MODEL = "gpt-5.5";
const API_KEY = process.env.GPT_API_KEY;

const SYSTEM_PROMPT = `你是尖塔梗翻译官。用户描述生活场景，你用杀戮尖塔卡牌来"翻译"它。

相关卡牌梗：
【凡庸】手牌太多打不出来 → 任务多到做不动
【偏差认知】+4集中每回合-1 → 以为自己会了其实不会
【鬼抽】关键牌沉底 → 运气差/考试正好考没复习的
【还在启动】永远在准备 → 拖延症
【回响形态】重复触发 → 复读机
【循环】→ 死循环/debug地狱
【内核加速】0费+能量 → 喝咖啡提神
【自我修复】战后回血 → 休息恢复
【耗尽】+集中但减球位 → 熬夜透支
【裂变】→ 多任务并行
【重启】→ 推倒重来
【碎片整理】→ 收拾整理
【硬化】→ 被打击后变强
【搜寻】→ 精准找东西
【伤口】→ 没用的水课
【虚无】→ 错过机会
【混沌】→ 一团糟
【创造性AI】→ 灵感迸发
【机器学习】→ 每天积累
【精良改造】→ 越做越顺手
【万物一心】→ 心流状态
【第四强角色】→ 鸡煲自嘲

输出纯JSON：
{"analysis":"一句话","cards":[{"name":"卡牌名","cost":"费用","cost_color":"gold/blue/red","card_type":"类型","rarity":"rare/uncommon/curse","character":"defect","effect":"梗化效果","flavor":"风味文字","severity":"savage/funny/positive/healing"}]}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "只支持 POST" });

  try {
    const { text, image, password, api_key, verify_only } = req.body;
    const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

    // 验证密码
    if (verify_only) {
      if (ACCESS_PASSWORD && password === ACCESS_PASSWORD) return res.status(200).json({ ok: true });
      return res.status(403).json({ error: "wrong_password" });
    }

    // 确定 Key
    let activeKey = null;
    if (ACCESS_PASSWORD && password === ACCESS_PASSWORD) activeKey = API_KEY;
    if (api_key && api_key.startsWith("sk-")) activeKey = api_key;
    if (!activeKey) return res.status(403).json({ error: "未解锁", message: "请通过密码解锁或提供自有 API Key" });
    if (!text && !image) return res.status(400).json({ error: "请提供 text 或 image" });

    // 构建消息
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    const userContent = [{ type: "text", text: `场景："${text||'图片内容'}"。匹配最合适的卡牌，只输出JSON。` }];
    if (image) {
      userContent.unshift({ type: "image_url", image_url: { url: `data:image/png;base64,${image}` } });
      userContent[userContent.length-1].text = text ? `图片+文字："${text}"` : "分析这张图片";
    }
    messages.push({ role: "user", content: userContent });

    // 调用 AI
    const payload = JSON.stringify({ model: MODEL, messages, max_tokens: 600, temperature: 0.8 });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${activeKey}`, "Content-Type": "application/json" },
      body: payload,
      signal: ctrl.signal
    });
    clearTimeout(t);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`AI API ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    let result;
    try {
      let raw = data.choices[0].message.content.trim();
      if (raw.startsWith("```")) raw = raw.replace(/```json\n?|```/g, "").trim();
      result = JSON.parse(raw);
      (result.cards || []).forEach(c => {
        if (!["savage","funny","positive","healing"].includes(c.severity)) c.severity = "funny";
        if (c.effect) c.effect = c.effect.replace(/\\n/g, "\n");
      });
    } catch {
      result = { analysis: "AI返回了奇怪的东西", cards: [{ name: "偏差认知", cost: "1", cost_color: "gold", card_type: "能力", rarity: "rare", character: "defect", effect: "AI 没返回正确的 JSON…\n这本身就是一种偏差认知。", flavor: "「偏差认知：连AI都在玩你的梗。」", severity: "savage" }] };
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "分析失败", message: err.message,
      cards: [{ name: "还在启动", cost: "?", cost_color: "gold", card_type: "状态", rarity: "basic", character: "defect", effect: "服务器还在启动…\n请稍后再试。", flavor: "「连服务器都和鸡煲一样——还在启动。」", severity: "funny" }]
    });
  }
};

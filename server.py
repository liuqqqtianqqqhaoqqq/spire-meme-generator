"""
尖塔梗生成器 - 本地/Railway 后端服务器
"""
import http.server
import json
import base64
import urllib.request
import os
import ssl

# ── API 配置 ──
API_URL = "https://api-slb.packyapi.com/v1/chat/completions"
MODEL = "gpt-5.5"
API_KEY = os.environ.get("GPT_API_KEY", "")
ACCESS_PASSWORD = os.environ.get("ACCESS_PASSWORD", "")
PORT = int(os.environ.get("PORT", 8765))

# ── 系统提示词 ──
SYSTEM_PROMPT = """你是尖塔梗翻译官。用户描述生活场景，你用杀戮尖塔卡牌来"翻译"它。

卡片梗速查：
【凡庸】手牌太多打不出来 → 任务多到做不动
【偏差认知】+4集中每回合-1 → 以为自己会了其实不会，考前突击然后全忘
【鬼抽】关键牌沉底 → 运气极差/考试考没复习的
【还在启动】→ 拖延症/迟迟不开始
【回响形态】→ 复读机/重复劳动
【循环】→ debug地狱/死循环
【内核加速】0费+能量→ 喝咖啡提神
【自我修复】→ 休息恢复/周末补觉
【耗尽】→ 熬夜透支/爆肝
【裂变】→ 多任务并行
【重启】→ 推倒重来
【碎片整理】→ 收拾整理
【硬化】→ 被打击后变强
【搜寻】→ 精准找东西
【伤口】→ 水课/没用的东西
【虚无】→ 错过机会
【混沌】→ 一团糟/系统崩了
【创造性AI】→ 灵感迸发
【机器学习】→ 每天积累/背单词
【精良改造】→ 越做越顺手
【万物一心】→ 心流状态
【第四强角色】→ 鸡煲最弱自嘲

输出纯JSON：
{"analysis":"简短分析","cards":[{"name":"卡牌名","cost":"费用","cost_color":"gold/blue/red","card_type":"攻击/技能/能力/诅咒/状态","rarity":"rare/uncommon/curse","character":"defect","effect":"梗化效果(结合用户场景)","flavor":"风味文字","severity":"savage/funny/positive/healing"}]}"""


def call_gpt(messages, api_key=None, max_tokens=1024):
    """调用 GPT API"""
    key = api_key or API_KEY
    payload = json.dumps({
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.8,
    }).encode("utf-8")
    req = urllib.request.Request(API_URL, data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # 静默日志

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _json(self, data, code=200):
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html_path = os.path.join(os.path.dirname(__file__), "index.html")
            with open(html_path, "rb") as f:
                self.wfile.write(f.read())
        elif self.path == "/api/ping":
            self._json({"ok": True})
        else:
            self._json({"error": "Not found"}, 404)

    def do_POST(self):
        if self.path == "/api/analyze":
            self._handle_analyze()
        elif self.path == "/api/ocr":
            self._json({"error": "OCR not implemented on Railway"}, 501)
        else:
            self._json({"error": "Not found"}, 404)

    def _handle_analyze(self):
        try:
            body = self._read_body()
            text = body.get("text", "")
            image = body.get("image")
            password = body.get("password", "")
            api_key = body.get("api_key", "")
            verify_only = body.get("verify_only", False)

            # 验证密码
            if verify_only:
                if ACCESS_PASSWORD and password == ACCESS_PASSWORD:
                    return self._json({"ok": True})
                return self._json({"error": "wrong_password"}, 403)

            # 确定 Key
            active_key = None
            if ACCESS_PASSWORD and password == ACCESS_PASSWORD:
                active_key = API_KEY
            if api_key and api_key.startswith("sk-"):
                active_key = api_key

            if not active_key:
                return self._json({"error": "未解锁", "message": "请通过密码解锁或提供自有API Key"}, 403)

            if not text and not image:
                return self._json({"error": "请提供text或image"}, 400)

            # 构建消息
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            user_content = [{"type": "text", "text": f'场景：\"{text or "图片内容"}\"。匹配最合适的卡牌，只输出JSON。'}]
            if image:
                user_content.insert(0, {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image}"}})
            messages.append({"role": "user", "content": user_content})

            # 调用 AI
            resp = call_gpt(messages, api_key=active_key, max_tokens=600)
            raw = resp["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):
                raw = raw.replace("```json\n", "").replace("```", "").strip()
            result = json.loads(raw)
            for c in result.get("cards", []):
                if c.get("severity") not in ("savage", "funny", "positive", "healing"):
                    c["severity"] = "funny"

            return self._json(result)

        except Exception as e:
            print(f"Error: {e}")
            return self._json({
                "error": "分析失败",
                "message": str(e),
                "cards": [{
                    "name": "还在启动",
                    "cost": "?",
                    "cost_color": "gold",
                    "card_type": "状态",
                    "rarity": "basic",
                    "character": "defect",
                    "effect": "服务器还在启动…请稍后再试。",
                    "flavor": "「连服务器都和鸡煲一样——还在启动。」",
                    "severity": "funny"
                }]
            }, 500)


def main():
    print(f"Server on port {PORT}")
    server = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()

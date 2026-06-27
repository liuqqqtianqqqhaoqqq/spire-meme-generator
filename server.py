"""
尖塔梗生成器 - 后端服务器 (Railway)
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os, ssl, urllib.request

API_URL = "https://api-slb.packyapi.com/v1/chat/completions"
MODEL = "gpt-5.5"
API_KEY = os.environ.get("GPT_API_KEY", "")
ACCESS_PASSWORD = os.environ.get("ACCESS_PASSWORD", "")
PORT = int(os.environ.get("PORT", 8765))

SP = """你是尖塔梗翻译官。用户描述场景，用杀戮尖塔卡牌来"翻译"。
卡牌：凡庸(任务太多) 偏差认知(以为会了其实不会) 鬼抽(运气差) 还在启动(拖延) 回响形态(复读) 循环(死循环) 内核加速(咖啡提神) 自我修复(休息) 耗尽(熬夜) 裂变(多任务) 重启(重来) 碎片整理(收拾) 硬化(变强) 搜寻(找东西) 伤口(水课) 虚无(错过) 混沌(崩了) 创造性AI(灵感) 机器学习(积累) 精良改造(顺手) 万物一心(心流) 第四强(鸡煲最弱)
输出JSON:{"cards":[{"name":"","cost":"","cost_color":"gold/blue/red","card_type":"","rarity":"rare/uncommon/curse","character":"defect","effect":"","flavor":"","severity":"savage/funny/positive/healing"}]}"""

def call_api(msgs, k, mt=600):
    d = json.dumps({"model":MODEL,"messages":msgs,"max_tokens":mt,"temperature":0.8}).encode()
    r = urllib.request.Request(API_URL,data=d,method="POST")
    r.add_header("Authorization",f"Bearer {k}")
    r.add_header("Content-Type","application/json")
    return json.loads(urllib.request.urlopen(r,timeout=25,context=ssl.create_default_context()).read())

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers","Content-Type,Authorization")
    def _ok(self,b=""):
        self.send_response(200);self._cors();self.end_headers()
        if b:self.wfile.write(b.encode() if isinstance(b,str) else b)
    def _json(self,d,code=200):
        self.send_response(code);self._cors()
        self.send_header("Content-Type","application/json");self.end_headers()
        self.wfile.write(json.dumps(d,ensure_ascii=False).encode())
    def _body(self):
        n=int(self.headers.get("Content-Length",0))
        return json.loads(self.rfile.read(n)) if n else {}
    def log_message(self,*a):pass
    def do_OPTIONS(self):self._ok()
    def do_GET(self):
        if self.path=="/api/ping":self._json({"ok":True})
        elif self.path=="/":self._ok("OK")
        else:self._json({"error":"not found"},404)
    def do_POST(self):
        if self.path!="/api/analyze":return self._json({"error":"not found"},404)
        try:
            b=self._body();t=b.get("text","");pw=b.get("password","");ak=b.get("api_key","");vo=b.get("verify_only",False)
            if vo:
                if ACCESS_PASSWORD and pw==ACCESS_PASSWORD:return self._json({"ok":True})
                return self._json({"error":"wrong_password"},403)
            key=None
            if ACCESS_PASSWORD and pw==ACCESS_PASSWORD:key=API_KEY
            if ak and ak.startswith("sk-"):key=ak
            if not key:return self._json({"error":"未解锁"},403)
            if not t and not b.get("image"):return self._json({"error":"需要输入"},400)
            ms=[{"role":"system","content":SP},{"role":"user","content":f'场景:"{t}"。匹配卡牌，输出JSON。'}]
            if b.get("image"):ms[1]["content"]=[{"type":"text","text":f'图片场景:"{t}"'},{"type":"image_url","image_url":{"url":f"data:image/png;base64,{b[\"image\"]}"}}]
            r=call_api(ms,key)
            raw=r["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):raw=raw.replace("```json\n","").replace("```","").strip()
            result=json.loads(raw)
            for c in result.get("cards",[]):
                if c.get("severity") not in("savage","funny","positive","healing"):c["severity"]="funny"
            self._json(result)
        except Exception as e:
            print("ERR:",e)
            self._json({"cards":[{"name":"还在启动","cost":"?","cost_color":"gold","card_type":"状态","rarity":"basic","character":"defect","effect":"服务器还在启动…","flavor":"「连服务器都和鸡煲一样——还在启动。」","severity":"funny"}]},500)

if __name__=="__main__":
    print(f"Server on port {PORT}")
    HTTPServer(("0.0.0.0",PORT),H).serve_forever()

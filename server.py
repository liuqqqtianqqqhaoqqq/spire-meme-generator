"""
尖塔梗生成器 - Railway 后端
"""
import http.server, json, os, ssl, urllib.request, sys

API_URL = "https://api-slb.packyapi.com/v1/chat/completions"
MODEL = "gpt-5.5"
API_KEY = os.environ.get("GPT_API_KEY", "")
ACCESS_PASSWORD = os.environ.get("ACCESS_PASSWORD", "")
PORT = int(os.environ.get("PORT", "8765"))

SP = """你是尖塔梗翻译官。匹配卡牌，只输出JSON。"""

def call_api(msgs, k, mt=600):
    d = json.dumps({"model":MODEL,"messages":msgs,"max_tokens":mt,"temperature":0.8}).encode()
    r = urllib.request.Request(API_URL,data=d,method="POST")
    r.add_header("Authorization",f"Bearer {k}")
    r.add_header("Content-Type","application/json")
    return json.loads(urllib.request.urlopen(r,timeout=25,context=ssl.create_default_context()).read())

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def do_GET(self):self.wfile.write(b"OK")
    def do_POST(self):
        try:
            n=int(self.headers.get("Content-Length",0))
            b=json.loads(self.rfile.read(n)) if n else {}
            t=b.get("text","");pw=b.get("password","");ak=b.get("api_key","");vo=b.get("verify_only",False)
            if vo:
                ok = ACCESS_PASSWORD and pw==ACCESS_PASSWORD
                self.send_response(200 if ok else 403)
                self.send_header("Access-Control-Allow-Origin","*")
                self.send_header("Content-Type","application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok":ok}).encode())
                return
            key=None
            if ACCESS_PASSWORD and pw==ACCESS_PASSWORD:key=API_KEY
            if ak and ak.startswith("sk-"):key=ak
            if not key:
                self.send_response(403)
                self.send_header("Access-Control-Allow-Origin","*")
                self.end_headers()
                return
            if not t:
                self.send_response(400)
                self.send_header("Access-Control-Allow-Origin","*")
                self.end_headers()
                return
            r=call_api([{"role":"user","content":t}],key)
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin","*")
            self.send_header("Content-Type","application/json")
            self.end_headers()
            raw=r["choices"][0]["message"]["content"].strip()
            self.wfile.write(json.dumps({"cards":[{"name":"尖塔卡牌","effect":raw[:200],"severity":"funny"}]}).encode())
        except Exception as e:
            print(f"ERR:{e}",file=sys.stderr,flush=True)
            self.send_response(500)
            self.send_header("Access-Control-Allow-Origin","*")
            self.end_headers()

if __name__=="__main__":
    print(f"START:{PORT}",flush=True)
    s = http.server.ThreadingHTTPServer(("0.0.0.0",PORT), H)
    s.daemon_threads = True
    s.serve_forever()

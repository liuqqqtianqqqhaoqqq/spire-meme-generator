"""
尖塔梗生成器 - 后端服务器
提供图片 OCR 和视觉分析 API
使用 gpt-5.5 模型（已验证可用的 API）
"""

import http.server
import json
import base64
import urllib.request
import os
import re

# ── API 配置 ──
API_URL = "https://api-slb.packyapi.com/v1/chat/completions"
MODEL = "gpt-5.5"

# ⚠️ 通过环境变量读取 Key，切勿硬编码到代码中
# 本地使用：在终端运行 set GPT_API_KEY=你的key && python server.py
# 或创建 .env 文件（已加入 .gitignore）
API_KEY = os.environ.get("GPT_API_KEY")
if not API_KEY:
    print("❌ 错误：未设置 GPT_API_KEY 环境变量！")
    print("   请运行：set GPT_API_KEY=你的key && python server.py")
    exit(1)

PORT = 8765
HTML_FILE = os.path.join(os.path.dirname(__file__), "index.html")


def call_gpt(messages, max_tokens=1024):
    """调用 gpt-5.5 API"""
    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"API 调用失败: {e}")
        raise


def ocr_image(base64_str):
    """用 gpt-5.5 做 OCR"""
    prompt = """请提取这张图片中的所有中文和英文文字，只输出文字内容，不要加任何解释。
如果图片中没有文字，请输出"无文字"。
注意：这是一个来自大学/学习/生活场景的图片，尽可能提取所有可见文字。"""

    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_str}"}}
        ]
    }]
    return call_gpt(messages)


def describe_image(base64_str):
    """用 gpt-5.5 描述图片内容（用于没有文字的情况）"""
    prompt = """请用一段简短的中文（50字以内）描述这张图片的场景和主要内容。
重点关注：场景类型（如课堂、考试、实验室、宿舍、食堂等）、人物状态（疲惫、开心、忙碌等）、可能表达的情绪。
输出格式：直接输出描述文字，不要加任何前缀。"""

    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_str}"}}
        ]
    }]
    return call_gpt(messages)


class APIHandler(http.server.SimpleHTTPRequestHandler):
    """自定义 HTTP 请求处理器"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/ocr":
            self._handle_ocr()
        elif self.path == "/api/vision":
            self._handle_vision()
        else:
            self.send_error(404, "Not Found")

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length))

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        """CORS 预检"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _handle_ocr(self):
        try:
            body = self._read_body()
            b64 = body.get("image", "")
            if not b64:
                self._send_json({"error": "缺少 image 参数"}, 400)
                return

            print(f"[OCR] 收到图片，大小: {len(b64)} bytes")
            text = ocr_image(b64)
            print(f"[OCR] 结果: {text[:100]}...")

            self._send_json({"text": text.strip()})
        except Exception as e:
            print(f"[OCR] 错误: {e}")
            self._send_json({"error": str(e)}, 500)

    def _handle_vision(self):
        try:
            body = self._read_body()
            b64 = body.get("image", "")
            if not b64:
                self._send_json({"error": "缺少 image 参数"}, 400)
                return

            print(f"[Vision] 收到图片，大小: {len(b64)} bytes")
            desc = describe_image(b64)
            print(f"[Vision] 结果: {desc[:100]}...")

            self._send_json({"text": desc.strip()})
        except Exception as e:
            print(f"[Vision] 错误: {e}")
            self._send_json({"error": str(e)}, 500)

    def log_message(self, format, *args):
        # 简化日志
        if "/api/" in str(args[0]):
            print(f"[Server] {args[0]}")
        else:
            pass  # 静默静态文件请求


def main():
    print(f"""
╔══════════════════════════════════════════╗
║        🤖 尖塔梗生成器 已启动！           ║
║                                          ║
║  前端地址: http://localhost:{PORT}         ║
║  OCR API:  /api/ocr (POST)               ║
║  Vision:   /api/vision (POST)            ║
║                                          ║
║  文本模式：离线可用                       ║
║  图片模式：需要保持服务器运行              ║
║                                          ║
║  按 Ctrl+C 停止服务器                     ║
╚══════════════════════════════════════════╝
    """)

    server = http.server.HTTPServer(("0.0.0.0", PORT), APIHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 鸡煲已关机——它甚至没能启动完。")
        server.shutdown()


if __name__ == "__main__":
    main()

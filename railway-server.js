/**
 * Railway 后端入口 - 处理 /api/analyze 请求
 */
const http = require("http");
const analyzeHandler = require("./api/analyze");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  if (req.url === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const json = JSON.parse(body);
        // 模拟 Vercel 的 req/res 接口
        const mockReq = { method: req.method, body: json };
        const mockRes = {
          status: function(code) { res.statusCode = code; return this; },
          json: function(data) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
            return this;
          },
          end: function() { res.end(); return this; },
          setHeader: function() { return this; }
        };
        await analyzeHandler(mockReq, mockRes);
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Bad request" }));
      }
    });
    return;
  }

  // Health check
  if (req.url === "/api/ping") {
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => console.log(`Railway server on port ${PORT}`));

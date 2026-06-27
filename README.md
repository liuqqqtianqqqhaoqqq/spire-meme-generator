# 🤖 尖塔梗生成器

> 你说句话，我给你翻译成鸡煲笑话 🃏

基于 AI 的《杀戮尖塔》社区梗生成器。输入你的生活场景，AI 自动从杀戮尖塔全卡池中匹配最合适的卡牌梗。

## ✨ 功能

- **🤖 AI 模式** — GPT 驱动，理解语境，匹配全卡池，效果精准搞笑
- **🔐 密码锁** — AI 模式默认锁定，需密码解锁或用自带 Key，保护 API 额度
- **⚡ 闪电模式** — 本地关键词匹配，秒出结果，离线可用，永远免费
- **📸 图片支持** — 上传图片，AI 自动识别场景并匹配梗
- **📱 移动端适配** — 手机上打开就能用
- **🔗 一键分享** — 复制梗文字，发到群里迫害朋友

## 🚀 部署

### 📦 部署到 Vercel（推荐）

1. Fork 这个仓库到你的 GitHub
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
3. 点击 "New Project" → 导入 fork 的仓库
4. **🔑 设置环境变量**：
   - `GPT_API_KEY` = 你的 AI API Key
   - `ACCESS_PASSWORD` = 你设定的访问密码（用户需输入此密码才能用 AI）
   - 在 Vercel 项目设置 → Environment Variables 中添加
   - 这个 Key **只存在于 Vercel 服务器上**，不会暴露给前端用户
5. 点击 Deploy！Vercel 会给你一个 `.vercel.app` 公开地址
6. 手机上打开这个地址就能用

### 🔒 API Key 安全说明

- **Key 绝不出现在前端代码中**
- 前端的 "🤖 AI 分析" 按钮调用 `/api/analyze`（Vercel Serverless Function）
- Serverless Function 在**服务端**读取环境变量 `GPT_API_KEY` 调用 AI
- 用户浏览器只能看到返回结果，永远看不到你的 Key
- 环境变量在 Vercel 控制台设置，不会被提交到 Git

### 本地运行

**⚡ 闪电模式（不需要服务器）：**
直接双击 `index.html`，用浏览器打开即可。

**🤖 AI 模式 + 图片模式（需要本地服务器）：**
```bash
# 1. 设置环境变量
set GPT_API_KEY=你的key    # Windows
# export GPT_API_KEY=你的key  # Mac/Linux

# 2. 运行服务器
python server.py

# 3. 浏览器打开
# http://localhost:8765
```

## 📂 文件说明

```
尖塔梗生成器/
├── index.html          # 前端页面（双模式）
├── api/
│   └── analyze.js      # Vercel Serverless 函数（AI 分析）
├── server.py           # 本地开发服务器（可选）
├── vercel.json         # Vercel 部署配置
└── package.json        # 项目配置
```

## 🃏 梗文化来源

基于《杀戮尖塔》中文社区的丰富梗文化，包括但不限于：
- 鸡煲笑话（故障机器人第四强、还在启动）
- 卡牌名双关（偏差认知、凡庸、耗尽）
- 社区黑话（鬼抽、回响形态复读机、小红严父）
- 尖塔语系统（用卡牌评价日常生活）

## 📄 License

MIT

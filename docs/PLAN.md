# Prompt 管理平台 - 项目规划

## 🎯 产品定位

**一句话**：AI 时代的内容素材市场——买 Prompt，卖 Prompt，像逛淘宝一样找 AI 指令。

**核心差异**：
- 不是另一个"AI 聊天工具"，而是 **Prompt 交易市场**
- 创作者上传优质 Prompt 赚钱，用户花几块钱买现成的用
- 平台抽佣 20%，类似设计师素材平台模式

---

## 🏗️ 技术架构

| 层 | 技术 | 理由 |
|----|------|------|
| **前端** | HTML/CSS/JS（单页应用） | 跟合规检测一样，GitHub Pages 直接部署 |
| **后端** | Supabase | 提供数据库、用户认证、文件存储，免费额度够 MVP |
| **部署** | GitHub Pages | 已有账号，零成本 |
| **域名** | 短网址 / 后续买域名 | 隐藏 GitHub 用户名 |

### 为什么不用：
- ❌ Vercel/Next.js → 国外手机验证
- ❌ 微信小程序 → 需要企业认证、审核周期长
- ❌ Node.js 自建后端 → 部署复杂、需要服务器
- ✅ Supabase → 免费、无手机验证、JavaScript 直接调

---

## 📦 需要注册的账户

| 服务 | 用途 | 链接 | 费用 |
|------|------|------|:--:|
| **Supabase** | 数据库 + 认证 | [supabase.com](https://supabase.com) | ¥0 |
| **爱发电** | 收款（可选，先不做） | [afdian.com](https://afdian.com) | ¥0 |

> 🔑 你需要做的：用 GitHub 账号登录 [supabase.com](https://supabase.com)，创建一个项目，把 API key 给我。

---

## 📱 MVP 功能（2 周）

```
v1.0 核心功能：

1. 🏠 首页：Prompt 分类浏览
   - 分类导航：文案 / 设计 / 编程 / 教育 / 营销 / 生活 / 办公
   - 搜索 + 排序（热门 / 最新 / 价格）

2. 📄 Prompt 详情页
   - Prompt 内容（可一键复制）
   - 效果截图
   - 适用 AI 平台标签（ChatGPT/Claude/Kimi/豆包/DeepSeek）
   - 价格 + 购买按钮

3. ✍️ 创作者上传
   - 标题、描述、Prompt 正文、截图、分类、平台标签、定价
   - GitHub 账号登录即创作者

4. 🔍 搜索 + 筛选
   - 按关键词搜索
   - 按分类、AI 平台、价格区间筛选

5. 📋 一键使用
   - 购买后复制 Prompt
   - 一键跳转到对应 AI 平台
```

---

## 📁 项目结构

```
prompt-market/
├── index.html              # 首页
├── browse.html             # 分类浏览
├── prompt.html             # Prompt 详情
├── create.html             # 创作者上传
├── profile.html            # 个人中心
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── supabase.js         # Supabase 初始化
│   ├── auth.js             # 登录/注册
│   ├── prompts.js          # Prompt CRUD 逻辑
│   └── utils.js            # 工具函数
├── public/
│   └── favicon.svg
└── docs/
    └── SUPABASE-SETUP.md   # Supabase 配置指南
```

---

## 🗄️ 数据库设计

```
表: prompts
├── id (uuid)
├── title (text)           # Prompt 标题
├── description (text)     # 使用说明
├── content (text)         # Prompt 正文
├── category (text)        # 分类
├── platforms (text[])     # 适用平台: ['ChatGPT','Claude']
├── price (integer)        # 价格(分)，0=免费
├── cover_url (text)       # 封面/截图
├── author_id (uuid)       # 作者
├── downloads (integer)    # 下载/购买数
├── rating (float)         # 评分
├── created_at (timestamp)

表: profiles
├── id (uuid)
├── username (text)
├── avatar_url (text)
├── bio (text)

表: purchases
├── id (uuid)
├── user_id (uuid)
├── prompt_id (uuid)
├── purchased_at (timestamp)
```

---

## 🔨 下周执行计划

| 天 | 任务 |
|----|------|
| Day 1 | 注册 Supabase → 建数据库表 → 初始化项目框架 |
| Day 2 | 首页 UI + 分类浏览 + Supabase 数据读取 |
| Day 3 | Prompt 详情页 + 一键复制 + 搜索功能 |
| Day 4 | 用户注册/登录（GitHub OAuth） + 创作者上传 |
| Day 5 | 购买流程 + 个人中心 + 我的收藏 |
| Day 6 | 测试部署 + 短网址 |
| Day 7 | 推广文案（小红书 + 知乎 + V2EX） |

---

## ⚡ 第一步

去 [supabase.com](https://supabase.com) → 用 GitHub 登录 → 创建项目 → 把 **Project URL** 和 **anon public key** 发给我。我就开始写代码。

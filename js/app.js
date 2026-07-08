
// ============================================
// 提示词PRO - 主应用逻辑
// ============================================

// 路由
function getRoute() {
  var hash = location.hash.slice(1) || "/";
  if (hash.startsWith("/prompt/")) return { page: "detail", id: hash.split("/")[2] };
  if (hash.startsWith("/category/")) return { page: "home", category: hash.split("/")[2] };
  return { page: hash.slice(1) || "home" };
}

async function render() {
  var route = getRoute();
  var app = document.getElementById("app");
  await checkAuth();

  if (route.page === "home") await renderHome(route.category);
  else if (route.page === "detail") await renderDetail(route.id);
  else if (route.page === "create") renderCreate();
  else if (route.page === "login") renderLogin();
  else if (route.page === "profile") renderProfile();
  else renderHome();
}

function navigateTo(path) {
  location.hash = "#" + path;
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

// ========== 首页 ==========
async function renderHome(category) {
  var app = document.getElementById("app");
  app.innerHTML = `
    <div class="hero">
      <h1>🪄 发现优质 AI 提示词</h1>
      <p>覆盖文案、设计、编程、教育等 7 大分类</p>
      <p style="font-size:13px;margin-top:4px">创作者发布赚钱 · 用户一键复制使用 · 平台抽佣透明</p>
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="search-input" placeholder="搜索提示词... 如：小红书文案、Midjourney、Python">
    </div>
    <div class="categories" id="cat-tabs">
      <span class="cat-tab${!category?' active':''}" data-cat="" onclick="filterByCategory('')">🔥 全部</span>
      ${CATEGORIES.map(function(c){
        return '<span class="cat-tab'+(category===c.id?' active':'')+'" data-cat="'+c.id+'" onclick="filterByCategory(\''+c.id+'\')">'+c.icon+' '+c.name+'</span>';
      }).join("")}
    </div>
    <div id="prompt-grid" class="grid"><div class="empty" style="grid-column:1/-1"><div class="icon">⏳</div><p>加载中...</p></div></div>
  `;

  loadPrompts(category);

  // 搜索
  var timer;
  document.getElementById("search-input").addEventListener("input", function(){
    clearTimeout(timer);
    timer = setTimeout(function(){ loadPrompts(category, this.value); }.bind(this), 400);
  });
}

function filterByCategory(cat) {
  document.querySelectorAll(".cat-tab").forEach(function(t){ t.classList.toggle("active", t.dataset.cat === cat); });
  loadPrompts(cat, document.getElementById("search-input")?.value || "");
}

async function loadPrompts(category, search) {
  var grid = document.getElementById("prompt-grid");
  if (!grid) return;
  try {
    var prompts = await getPrompts({ category: category || undefined, search: search || undefined, sort: "newest" });
    if (prompts.length === 0) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="icon">📭</div><p>暂无提示词</p><p style="font-size:13px;margin-top:4px">成为第一个发布的人吧！</p></div>';
      return;
    }
    grid.innerHTML = prompts.map(function(p){
      return '<a href="#/prompt/'+p.id+'" class="card" onclick="navigateTo(\'/prompt/'+p.id+'\')">'+
        '<div class="card-cat">'+getCatIcon(p.category)+' '+getCatName(p.category)+'</div>'+
        '<h3>'+escapeHtml(p.title)+'</h3>'+
        '<div class="card-desc">'+escapeHtml(p.description || "暂无描述")+'</div>'+
        '<div class="card-meta">'+
          '<span class="card-price'+(p.price===0?' free':'')+'">'+(p.price===0?'免费':'¥'+(p.price/100).toFixed(2))+'</span>'+
          '<span class="card-stats">📥 '+(p.downloads||0)+' ⭐ '+(p.rating||0)+'</span>'+
        '</div>'+
        '<div class="platform-tags">'+(p.platforms||[]).map(function(pl){ return '<span class="ptag">'+pl+'</span>'; }).join("")+'</div>'+
      '</a>';
    }).join("");
  } catch(e) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="icon">❌</div><p>加载失败</p></div>';
  }
}

// ========== 详情页 ==========
async function renderDetail(id) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="detail"><div class="empty"><div class="icon">⏳</div><p>加载中...</p></div></div>';

  var prompt = await getPrompt(id);
  if (!prompt) {
    app.innerHTML = '<div class="detail"><div class="empty"><div class="icon">❌</div><p>提示词不存在</p></div></div>';
    return;
  }

  // 增加浏览量
  supabase.from("prompts").update({ downloads: (prompt.downloads||0)+1 }).eq("id", id).then(function(){});

  app.innerHTML = `
    <div class="detail">
      <a href="#/" class="back-btn">← 返回列表</a>
      <h1>${escapeHtml(prompt.title)}</h1>
      <div class="meta-row">
        <span>${getCatIcon(prompt.category)} ${getCatName(prompt.category)}</span>
        <span>作者：${escapeHtml(prompt.author_name||"匿名")}</span>
        <span>📥 ${prompt.downloads||0} 次使用</span>
        <span>发布于 ${new Date(prompt.created_at).toLocaleDateString("zh-CN")}</span>
      </div>
      <div class="platform-tags" style="margin-bottom:16px">
        ${(prompt.platforms||[]).map(function(p){ return '<span class="ptag">'+p+'</span>'; }).join("")}
      </div>
      ${prompt.description?'<p style="color:#94a3b8;margin-bottom:20px;line-height:1.8">'+escapeHtml(prompt.description)+'</p>':''}
      <div class="prompt-box">
        <button class="copy-btn" onclick="copyPrompt(\'${escapeAttr(prompt.content)}\')">📋 复制</button>
        <code>${escapeHtml(prompt.content)}</code>
      </div>
      ${prompt.price>0?'<div style="text-align:center;margin-top:16px"><span style="font-size:20px;font-weight:800;color:#34d399">¥'+(prompt.price/100).toFixed(2)+'</span><br><button class="btn-primary" style="margin-top:12px" onclick="purchase(\''+prompt.id+'\')">💰 购买并解锁</button></div>':''}
    </div>
  `;
}

function copyPrompt(text) {
  navigator.clipboard.writeText(text).then(function(){
    showToast("✅ 已复制到剪贴板！去 AI 平台粘贴使用吧");
  });
}

async function purchase(promptId) {
  if (!currentUser) { alert("请先登录"); navigateTo("/login"); return; }
  var { error } = await supabase.from("purchases").insert({ user_id: currentUser.id, prompt_id: promptId });
  if (error) { alert("购买失败："+error.message); return; }
  showToast("🎉 购买成功！");
  renderDetail(promptId);
}

// ========== 创建页 ==========
function renderCreate() {
  if (!currentUser) { navigateTo("/login"); return; }
  var app = document.getElementById("app");
  app.innerHTML = `
    <div class="detail">
      <h1 style="margin-bottom:24px">✍️ 发布新提示词</h1>
      <div class="form-group">
        <label>标题 *</label>
        <input type="text" id="new-title" placeholder="例：小红书爆款文案生成器">
      </div>
      <div class="form-group">
        <label>分类 *</label>
        <select id="new-category">
          ${CATEGORIES.map(function(c){ return '<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>'; }).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>适用平台</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px" id="platform-tags">
          ${PLATFORMS.map(function(p){ return '<span class="cat-tab" data-p="'+p+'" onclick="this.classList.toggle(\'active\')">'+p+'</span>'; }).join("")}
        </div>
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="new-desc" placeholder="简要说明这个 Prompt 的用途和效果"></textarea>
      </div>
      <div class="form-group">
        <label>Prompt 正文 *</label>
        <textarea id="new-content" placeholder="粘贴你的 Prompt..." style="min-height:200px"></textarea>
      </div>
      <div class="form-group">
        <label>价格（元）</label>
        <input type="number" id="new-price" value="0" min="0" max="999" step="0.01" style="width:200px">
        <span style="color:#64748b;font-size:12px;margin-left:8px">0=免费，平台抽佣20%</span>
      </div>
      <button class="btn-primary" id="submit-btn" onclick="submitPrompt()">🚀 发布</button>
    </div>
  `;
}

async function submitPrompt() {
  var title = document.getElementById("new-title").value.trim();
  var content = document.getElementById("new-content").value.trim();
  if (!title || !content) { alert("标题和内容不能为空"); return; }

  var platforms = [];
  document.querySelectorAll("#platform-tags .cat-tab.active").forEach(function(t){ platforms.push(t.dataset.p); });

  var btn = document.getElementById("submit-btn");
  btn.disabled = true; btn.textContent = "发布中...";

  var prompt = {
    title: title,
    category: document.getElementById("new-category").value,
    platforms: platforms,
    description: document.getElementById("new-desc").value.trim(),
    content: content,
    price: Math.round(parseFloat(document.getElementById("new-price").value || 0) * 100)
  };

  var result = await createPrompt(prompt);
  if (result) {
    showToast("🎉 发布成功！");
    navigateTo("/prompt/" + result.id);
  } else {
    btn.disabled = false; btn.textContent = "🚀 发布";
  }
}

// ========== 登录页 ==========
function renderLogin() {
  if (currentUser) { navigateTo("/"); return; }
  document.getElementById("app").innerHTML = `
    <div class="login-box">
      <h2>🪄 登录提示词PRO</h2>
      <p style="color:#64748b;margin-bottom:32px">用 GitHub 账号登录，即可发布和购买提示词</p>
      <button class="btn-primary" onclick="loginWithGitHub()" style="width:100%;padding:14px">🔑 使用 GitHub 登录</button>
    </div>
  `;
}

// ========== 个人中心 ==========
function renderProfile() {
  if (!currentUser) { navigateTo("/login"); return; }
  document.getElementById("app").innerHTML = `
    <div class="detail">
      <h1>👤 个人中心</h1>
      <p style="color:#94a3b8;margin:12px 0">${currentUser.user_metadata?.full_name || currentUser.email}</p>
      <button class="btn-secondary" onclick="logout()" style="margin-top:16px">退出登录</button>
    </div>
  `;
}

// ========== 工具函数 ==========
function getCatName(id) { var c = CATEGORIES.find(function(x){return x.id===id}); return c?c.name:id; }
function getCatIcon(id) { var c = CATEGORIES.find(function(x){return x.id===id}); return c?c.icon:"📌"; }
function escapeHtml(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function escapeAttr(s) { return s.replace(/'/g,"\'").replace(/"/g,"\"").replace(/\n/g,"\\n"); }
function showToast(msg) {
  var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2500);
}

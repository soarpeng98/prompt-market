// DEBUG: catch all errors
window.addEventListener("error", function(e) {
  var app = document.getElementById("app");
  if (app) app.innerHTML = '<div style="padding:40px;color:red;text-align:center"><h2>❌ JS Error</h2><pre style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:left;overflow:auto;color:#f87171">' + (e.message || e.error?.message || "unknown") + '\n\n' + (e.filename || "") + ':' + (e.lineno || "") + ':' + (e.colno || "") + '</pre></div>';
});
// ============================================
// 提示词PRO - 主应用逻辑 v1.1
// ============================================

function getRoute() {
  var hash = location.hash.slice(1) || "/";
  if (hash.startsWith("/prompt/")) return { page: "detail", id: hash.split("/")[2] };
  if (hash.startsWith("/collection/")) return { page: "collection", id: hash.split("/")[2] };
  if (hash.startsWith("/author/")) return { page: "author", id: hash.split("/")[2] };
  if (hash.startsWith("/category/")) return { page: "home", category: hash.split("/")[2] };
  if (hash === "/collections") return { page: "collections" };
  if (hash === "/stats") return { page: "stats" };
  if (hash.startsWith("/reset-password")) return { page: "resetPassword" };
  if (hash === "/forgot") return { page: "forgot" };
  return { page: hash.slice(1) || "home" };
}

async function render() {
  try {
    var route = getRoute();
    try { await checkAuth(); } catch(e) { console.log("Auth check failed:", e.message); }
    if (route.page === "home") await renderHome(route.category);
    else if (route.page === "detail") await renderDetail(route.id);
    else if (route.page === "create") renderCreate();
    else if (route.page === "login") renderLogin();
    else if (route.page === "profile") renderProfile();
  else if (route.page === "author") renderAuthor(route.id);
  else if (route.page === "collections") renderCollections();
  else if (route.page === "collection") renderCollectionDetail(route.id);
  else if (route.page === "stats") renderStats();
  else if (route.page === "resetPassword") handleResetPassword();
  else if (route.page === "forgot") renderForgotPassword();
    else renderHome();
  } catch(e) {
    var a = document.getElementById("app");
    if (a) a.innerHTML = '<div style="padding:40px;color:red;text-align:center"><h2>❌ 运行时错误</h2><pre style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:left;color:#f87171;overflow:auto">' + e.message + '\n\n' + (e.stack || "") + '</pre></div>';
  }
}
function navigateTo(path) { location.hash = "#" + path; }
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

// ========== 首页 ==========
async function renderHome(category) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="hero"><h1>🪄 发现优质 AI 提示词</h1><p>覆盖文案、设计、编程、教育等 7 大分类</p><p style="font-size:13px;margin-top:4px">创作者发布赚钱 · 用户一键复制使用</p></div><div style="text-align:center;margin-bottom:20px"><span class="cat-tab active" id="sort-new" onclick="setSort(\'newest\')">🆕 最新</span><span class="cat-tab" id="sort-popular" onclick="setSort(\'popular\')">🔥 最热</span><span class="cat-tab" id="sort-free" onclick="setSort(\'free\')">🆓 免费</span></div><div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="搜索提示词..."></div><div class="categories" id="cat-tabs"><span class="cat-tab'+(category?'':' active')+'" data-cat="" onclick="filterByCategory(\'\')">🔥 全部</span>'+CATEGORIES.map(function(c){return '<span class="cat-tab'+(category===c.id?' active':'')+'" data-cat="'+c.id+'" onclick="filterByCategory(\''+c.id+'\')">'+c.icon+' '+c.name+'</span>';}).join("")+'</div><div id="prompt-grid" class="grid"><div class="empty" style="grid-column:1/-1"><div class="icon">⏳</div><p>加载中...</p></div></div>';
  loadPrompts(category);
  var timer;
  document.getElementById("search-input").addEventListener("input", function(){clearTimeout(timer);var q=this.value;timer=setTimeout(function(){loadPrompts(category,q);},400);});
}

var currentSort = "newest";
var currentCategory = "";
function setSort(sort){
  currentSort = sort;
  document.querySelectorAll("#sort-new,#sort-hot,#sort-free").forEach(function(t){t.classList.remove("active");});
  document.getElementById("sort-"+sort).classList.add("active");
  loadPrompts(currentCategory, document.getElementById("search-input")?.value||"");
}
function filterByCategory(cat){document.querySelectorAll(".cat-tab").forEach(function(t){t.classList.toggle("active",t.dataset.cat===cat);});loadPrompts(cat,document.getElementById("search-input")?.value||"");}

async function loadPrompts(category, search) { currentCategory = category||"";
  var grid = document.getElementById("prompt-grid");if(!grid)return;
  try{var prompts=await getPrompts({category:category||undefined,search:search||undefined,sort:currentSort,price:currentSort==="free"?0:undefined});if(prompts.length===0){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="icon">📭</div><p>暂无提示词</p><p style="font-size:13px">成为第一个发布的人！</p></div>';return;}
  grid.innerHTML=prompts.map(function(p){return '<a href="#/prompt/'+p.id+'" class="card"><div class="card-cat">'+getCatIcon(p.category)+' '+getCatName(p.category)+'</div><h3>'+escapeHtml(p.title)+'</h3><div class="card-desc">'+escapeHtml(p.description||"暂无描述")+'</div><div class="card-meta"><span class="card-price'+(p.price===0?' free':'')+'">'+(p.price===0?'免费':'¥'+(p.price/100).toFixed(2))+'</span><span class="card-stats">📥 '+(p.downloads||0)+' ⭐ '+(p.rating||0)+'</span></div><div class="platform-tags">'+(p.platforms||[]).map(function(pl){return '<span class="ptag">'+pl+'</span>';}).join("")+'<div class="tag-row">'+(p.tags||[]).slice(0,3).map(function(t){return '<span class="tag-badge">#'+escapeHtml(t)+'</span>';}).join("")+'</div></div></a>';}).join("");}catch(e){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="icon">❌</div><p>加载失败</p></div>';}
}

// ========== 详情页 ==========
async function renderDetail(id) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="detail"><div class="empty"><div class="icon">⏳</div><p>加载中...</p></div></div>';
  var prompt = await getPrompt(id);
  if (!prompt) {app.innerHTML='<div class="detail"><div class="empty"><div class="icon">❌</div><p>提示词不存在</p></div></div>';return;}
  supabase.from("prompts").update({downloads:(prompt.downloads||0)+1}).eq("id",id).then(function(){});
  var html='<div class="detail"><a href="#/" class="back-btn">← 返回列表</a><h1>'+escapeHtml(prompt.title)+'</h1><div class="meta-row"><span>'+getCatIcon(prompt.category)+' '+getCatName(prompt.category)+'</span><span>作者：'+escapeHtml(prompt.author_name||"匿名")+'</span><span>📥 '+(prompt.downloads||0)+' 次</span><span>'+new Date(prompt.created_at).toLocaleDateString("zh-CN")+'</span></div><div class="platform-tags" style="margin-bottom:16px">'+(prompt.platforms||[]).map(function(p){return '<span class="ptag">'+p+'</span>';}).join("")+'</div>';
  if(prompt.description)html+='<p style="color:#94a3b8;margin-bottom:20px;line-height:1.8">'+escapeHtml(prompt.description)+'</p>';
  html+='<div class="prompt-box"><button id="fav-btn" class="copy-btn" style="right:110px;background:#1e293b" onclick="handleFavorite(\''+prompt.id+'\')">☆ 收藏</button><button class="copy-btn" style="right:110px;background:#1e293b" onclick="showCollectionPicker(\''+prompt.id+'\')">📁 合集</button><button class="copy-btn" onclick="copyPrompt(\''+prompt.id+'\')">☆ 收藏</button><button class="copy-btn" onclick="copyPrompt(\''+escapeAttr(prompt.content)+'\')">📋 复制</button><code>'+escapeHtml(prompt.content)+'</code></div>';
  if(prompt.price>0)html+='<div style="text-align:center;margin-top:16px"><span style="font-size:20px;font-weight:800;color:#34d399">¥'+(prompt.price/100).toFixed(2)+'</span><br><button class="btn-primary" style="margin-top:12px" onclick="purchase(\''+prompt.id+'\')">💰 购买并解锁</button></div>';
  if(currentUser&&currentUser.id===prompt.author_id){html+='<div style="margin-top:20px;display:flex;gap:8px"><button class="btn-secondary" onclick="editPrompt(\''+prompt.id+'\')">✏️ 编辑</button><button class="btn-secondary" style="color:#ef4444" onclick="if(confirm(\'确定删除？\'))deletePromptAndGo(\''+prompt.id+'\')">🗑️ 删除</button></div>';}html+=renderComments(prompt.id);html+='</div>';
  app.innerHTML=html;
  if(currentUser){isFavorited(prompt.id).then(function(faved){var btn=document.getElementById("fav-btn");if(btn){btn.textContent=faved?"★ 已收藏":"☆ 收藏";btn.style.background=faved?"#7c3aed":"#1e293b";}});}
}

async function handleFavorite(promptId){if(!currentUser){navigateTo("/login");return;}var faved=await toggleFavorite(promptId);var btn=document.getElementById("fav-btn");if(btn){btn.textContent=faved?"★ 已收藏":"☆ 收藏";btn.style.background=faved?"#7c3aed":"#1e293b";}}
function copyPrompt(text){navigator.clipboard.writeText(text).then(function(){showToast("✅ 已复制！去 AI 平台粘贴使用");});}
async function purchase(promptId){if(!currentUser){navigateTo("/login");return;}var{error}=await supabase.from("purchases").insert({user_id:currentUser.id,prompt_id:promptId});if(error){alert("购买失败："+error.message);return;}showToast("🎉 购买成功！");renderDetail(promptId);}

// ========== 创建页 ==========
function renderCreate(){var app=document.getElementById("app");if(!currentUser){navigateTo("/login");return;}
app.innerHTML='<div class="detail"><h1 style="margin-bottom:24px">✍️ 发布新提示词</h1><div class="form-group"><label>标题 *</label><input type="text" id="new-title" placeholder="例：小红书爆款文案生成器"></div><div class="form-group"><label>分类 *</label><select id="new-category">'+CATEGORIES.map(function(c){return'<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>';}).join("")+'</select></div><div class="form-group"><label>适用平台</label><div style="display:flex;flex-wrap:wrap;gap:6px" id="platform-tags">'+PLATFORMS.map(function(p){return'<span class="cat-tab" data-p="'+p+'" onclick="this.classList.toggle(\'active\')">'+p+'</span>';}).join("")+'</div></div><div class="form-group"><label>描述</label><textarea id="new-desc" placeholder="简要说明用途和效果"></textarea></div><div class="form-group"><label>Prompt 正文 *</label><textarea id="new-content" placeholder="粘贴你的 Prompt..." style="min-height:200px"></textarea></div><div class="form-group"><label>标签（用逗号分隔，如: SEO,电商,写作）</label><input type="text" id="new-tags" placeholder="SEO,电商,写作"></div><div class="form-group"><label>价格（元）</label><input type="number" id="new-price" value="0" min="0" max="999" step="0.01" style="width:200px"><span style="color:#64748b;font-size:12px;margin-left:8px">0=免费</span></div><button class="btn-primary" id="submit-btn" onclick="submitPrompt()">🚀 发布</button></div>';}

async function submitPrompt(){var title=document.getElementById("new-title").value.trim();var content=document.getElementById("new-content").value.trim();if(!title||!content){alert("标题和内容不能为空");return;}var platforms=[];document.querySelectorAll("#platform-tags .cat-tab.active").forEach(function(t){platforms.push(t.dataset.p);});var btn=document.getElementById("submit-btn");btn.disabled=true;btn.textContent="发布中...";var prompt={title:title,category:document.getElementById("new-category").value,platforms:platforms,description:document.getElementById("new-desc").value.trim(),content:content,tags:tags,price:Math.round(parseFloat(document.getElementById("new-price").value||0)*100)};var result=await createPrompt(prompt);if(result){showToast("🎉 发布成功！");navigateTo("/prompt/"+result.id);}else{btn.disabled=false;btn.textContent="🚀 发布";}}

// ========== 登录页 ==========
function renderLogin(tab){var app=document.getElementById("app");if(currentUser){navigateTo("/");return;}tab=tab||"login";
app.innerHTML='<div class="login-box"><h2>🪄 提示词PRO</h2><p style="color:#64748b;margin-bottom:8px">登录即可发布和购买提示词</p><div style="display:flex;gap:6px;justify-content:center;margin:16px 0"><span class="cat-tab'+(tab==="login"?" active":"")+'" onclick="renderLogin(\'login\')">登录</span><span class="cat-tab'+(tab==="signup"?" active":"")+'" onclick="renderLogin(\'signup\')">注册</span></div>';
if(tab==="signup"){
  app.innerHTML+='<form onsubmit="event.preventDefault();var email=document.getElementById(\'signup-email\').value;var pwd=document.getElementById(\'signup-pwd\').value;var name=document.getElementById(\'signup-name\').value;if(!email||!pwd)alert(\'请填写邮箱和密码\');else signupWithEmail(email,pwd,name);"><div class="form-group"><input type="text" id="signup-name" placeholder="昵称（选填）"></div><div class="form-group"><input type="email" id="signup-email" placeholder="邮箱 *" required></div><div class="form-group"><input type="password" id="signup-pwd" placeholder="密码（6位以上）*" required minlength="6"></div><button type="submit" class="btn-primary" style="width:100%">📧 注册</button></form>';
}else{
  app.innerHTML+='<form onsubmit="event.preventDefault();var email=document.getElementById(\'login-email\').value;var pwd=document.getElementById(\'login-pwd\').value;if(!email||!pwd)alert(\'请填写邮箱和密码\');else loginWithEmail(email,pwd);"><div class="form-group"><input type="email" id="login-email" placeholder="邮箱" required></div><div class="form-group"><input type="password" id="login-pwd" placeholder="密码" required></div><button type="submit" class="btn-primary" style="width:100%">📧 登录</button><p style="margin-top:10px;font-size:13px;text-align:right"><a href="javascript:void(0)" onclick="renderForgotPassword()" style="color:#818cf8;text-decoration:none">忘记密码？</a></p></form>';
}
app.innerHTML+='<div style="margin-top:20px;padding-top:20px;border-top:1px solid #1e293b;text-align:center"><p style="color:#64748b;font-size:12px;margin-bottom:12px">或使用第三方账号</p><button class="btn-primary" onclick="loginWithGitHub()" style="width:100%;background:linear-gradient(135deg,#1f2937,#374151);border:1px solid #4b5563">🔑 GitHub 登录</button></div></div>';}

// ========== 个人中心 ==========
function renderProfile(tab){var app=document.getElementById("app");if(!currentUser){navigateTo("/login");return;}tab=tab||"published";
app.innerHTML='<div class="detail"><h1>👤 个人中心</h1><p style="color:#94a3b8;margin:8px 0">'+(currentUser.user_metadata?.full_name||currentUser.email)+'</p><div style="display:flex;gap:6px;margin:20px 0;flex-wrap:wrap"><span class="cat-tab'+(tab==="published"?" active":"")+'" onclick="renderProfile(\'published\')">📤 我的发布</span><span class="cat-tab'+(tab==="favorites"?" active":"")+'" onclick="renderProfile(\'favorites\')">⭐ 我的收藏</span><span class="cat-tab'+(tab==="purchases"?" active":"")+'" onclick="renderProfile(\'purchases\')">🛒 已购买</span></div><div id="profile-content"><div class="empty"><div class="icon">⏳</div><p>加载中...</p></div></div><button class="btn-secondary" onclick="logout()" style="margin-top:24px">退出登录</button></div>';
loadProfileContent(tab);}

async function loadProfileContent(tab){var container=document.getElementById("profile-content");if(!container)return;var prompts;if(tab==="published")prompts=await getMyPrompts();else if(tab==="favorites")prompts=await getMyFavorites();else prompts=await getMyPurchases();if(!prompts||prompts.length===0){container.innerHTML='<div class="empty"><div class="icon">📭</div><p>暂无内容</p></div>';return;}container.innerHTML=prompts.map(function(p){return'<a href="#/prompt/'+p.id+'" class="card" style="margin-bottom:12px"><div class="card-cat">'+getCatIcon(p.category)+' '+getCatName(p.category)+'</div><h3>'+escapeHtml(p.title)+'</h3><div class="card-desc">'+escapeHtml(p.description||"")+'</div><div class="card-meta"><span class="card-price'+(p.price===0?' free':'')+'">'+(p.price===0?'免费':'¥'+(p.price/100).toFixed(2))+'</span><span class="card-stats">📥 '+(p.downloads||0)+'</span></div></a>';}).join("");}


// ========== 创作者主页 ==========
async function renderAuthor(authorId) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="empty"><div class="icon">⏳</div><p>加载中...</p></div>';
  var info = await getAuthorInfo(authorId);
  var prompts = await getAuthorPrompts(authorId);
  var name = info ? (info.username || "匿名创作者") : "创作者";
  var html = '<div class="author-header"><a href="#/" class="back-btn">← 返回</a><div style="text-align:center;padding:32px 0"><div class="author-avatar">' + (name[0] || "?") + '</div><h1 style="font-size:24px;margin:12px 0 4px">' + escapeHtml(name) + '</h1><p style="color:#94a3b8;font-size:14px">📝 ' + prompts.length + ' 个提示词</p></div></div>';
  if (prompts.length === 0) {
    html += '<div class="empty"><div class="icon">📭</div><p>暂无作品</p></div>';
  } else {
    html += '<div class="grid">' + prompts.map(function(p) {
      return '<a href="#/prompt/' + p.id + '" class="card"><div class="card-cat">' + getCatIcon(p.category) + ' ' + getCatName(p.category) + '</div><h3>' + escapeHtml(p.title) + '</h3><div class="card-desc">' + escapeHtml(p.description || "") + '</div><div class="card-meta"><span class="card-price' + (p.price === 0 ? ' free' : '') + '">' + (p.price === 0 ? '免费' : '¥' + (p.price / 100).toFixed(2)) + '</span><span class="card-stats">📥 ' + (p.downloads || 0) + ' ⭐ ' + (p.rating || 0) + '</span></div></a>';
    }).join("") + '</div>';
  }
  app.innerHTML = html;
}





// ========== 重置密码处理 ==========
async function handleResetPassword() {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="login-box"><h2>⏳</h2><p style="color:#94a3b8">正在验证重置链接...</p></div>';
  
  var hash = location.hash;
  var hasToken = hash.includes("type=recovery") || hash.includes("access_token");
  
  if (hasToken) {
    try {
      // Parse tokens from hash fragment
      var params = {};
      var hashStr = hash.substring(1);
      hashStr.split("&").forEach(function(p) {
        var parts = p.split("=");
        if (parts.length === 2) params[parts[0]] = decodeURIComponent(parts[1]);
      });
      
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token
        });
      }
    } catch(e) {
      console.log("Session setup:", e.message);
    }
    
    app.innerHTML = '<div class="login-box"><h2>🔑 设置新密码</h2><p style="color:#64748b;margin-bottom:16px">请输入你的新密码</p><form onsubmit="event.preventDefault();var pwd=document.getElementById(\'new-pwd\').value;var pwd2=document.getElementById(\'new-pwd2\').value;if(!pwd||pwd.length<6){alert(\'密码至少6位\');return;}if(pwd!==pwd2){alert(\'两次密码不一致\');return;}completeReset(pwd);"><div class="form-group"><input type="password" id="new-pwd" placeholder="新密码（6位以上）*" required minlength="6"></div><div class="form-group"><input type="password" id="new-pwd2" placeholder="确认新密码 *" required minlength="6"></div><button type="submit" class="btn-primary" style="width:100%">💾 重置密码</button></form></div>';
  } else {
    app.innerHTML = '<div class="login-box"><h2>🔗 无效的重置链接</h2><p style="color:#94a3b8;margin:16px 0">此链接无效或已过期，请重新申请密码重置。</p><a href="#/login" class="btn-primary" style="display:block;text-align:center">返回登录</a></div>';
  }
}

async function completeReset(newPassword) {
  var { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    alert("重置失败: " + error.message);
  } else {
    var app = document.getElementById("app");
    app.innerHTML = '<div class="login-box"><h2>✅ 密码已重置</h2><p style="color:#94a3b8;margin:16px 0">请使用新密码登录</p><a href="#/login" class="btn-primary" style="display:block;text-align:center">去登录</a></div>';
  }
}

// ========== 忘记密码 ==========
function renderForgotPassword() {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="login-box"><h2>🔑 重置密码</h2><p style="color:#64748b;margin-bottom:16px">输入注册邮箱，我们将发送重置链接</p><form onsubmit="event.preventDefault();var email=document.getElementById(\'reset-email\').value;if(!email){alert(\'请输入邮箱\');return;}resetPassword(email);"><div class="form-group"><input type="email" id="reset-email" placeholder="注册邮箱 *" required></div><button type="submit" class="btn-primary" style="width:100%">📧 发送重置链接</button></form><p style="margin-top:16px;font-size:13px"><a href="javascript:void(0)" onclick="navigateTo(\'/login\')" style="color:#818cf8;text-decoration:none">← 返回登录</a></p></div>';
}

async function resetPassword(email) {
  var { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname + "#/reset-password"
  });
  if (error) {
    alert("发送失败: " + error.message);
  } else {
    var app = document.getElementById("app");
    app.innerHTML = '<div class="login-box"><h2>📧 邮件已发送</h2><p style="color:#94a3b8;margin:16px 0">请检查 <b>' + email + '</b> 的收件箱，点击邮件中的链接重置密码。</p><p style="font-size:13px;color:#64748b">没收到？检查垃圾邮件箱</p><a href="#/login" class="btn-primary" style="display:block;margin-top:20px;text-align:center">返回登录</a></div>';
  }
}

// ========== 精选轮播 ==========
async function renderFeatured() {
  var section = document.getElementById("featured-section");
  if (!section) return;
  var featured = await getFeaturedPrompts();
  if (!featured.length) { section.innerHTML = ""; return; }
  var html = '<div class="featured-wrap"><div class="featured-title">⭐ 精选推荐</div><div class="featured-scroll">' +
    featured.map(function(p) {
      return '<a href="#/prompt/' + p.id + '" class="featured-card"><span class="featured-cat">' + getCatIcon(p.category) + ' ' + getCatName(p.category) + '</span><h4>' + escapeHtml(p.title) + '</h4><span class="featured-meta">⭐ ' + (p.rating || 0) + ' 📥 ' + (p.downloads || 0) + '</span></a>';
    }).join("") + '</div></div>';
  section.innerHTML = html;
}

// ========== 标签筛选 ==========
var currentTag = "";
function filterByTag(tag) {
  currentTag = tag;
  var input = document.getElementById("search-input");
  if (input) input.value = "#" + tag;
  loadPrompts(currentCategory, "#" + tag);
}

// ========== 合集管理 ==========
async function renderCollections() {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="empty"><div class="icon">⏳</div><p>加载中...</p></div>';
  var collections = await getMyCollections();
  var html = '<div class="detail"><a href="#/profile" class="back-btn">← 返回</a><div style="display:flex;justify-content:space-between;align-items:center"><h1>📁 我的合集</h1><button class="btn-primary" onclick="showCreateCollection()" style="padding:8px 16px;font-size:14px">+ 新建合集</button></div>';
  if (!collections.length) {
    html += '<div class="empty"><div class="icon">📭</div><p>还没有合集</p></div>';
  } else {
    html += '<div class="grid" style="margin-top:20px">' + collections.map(function(c) {
      return '<a href="#/collection/' + c.id + '" class="card"><h3>📁 ' + escapeHtml(c.name) + '</h3><div class="card-desc">' + escapeHtml(c.description || "暂无描述") + '</div><div class="card-meta"><span style="color:#64748b;font-size:12px">' + (c.is_public ? "🌐 公开" : "🔒 私密") + '</span></div></a>';
    }).join("") + '</div>';
  }
  html += '</div>';
  app.innerHTML = html;
}

function showCreateCollection() {
  var name = prompt("合集名称：");
  if (!name) return;
  var desc = prompt("合集描述（可选）：");
  createCollection(name, desc).then(function(c) {
    if (c) renderCollections();
  });
}

async function renderCollectionDetail(id) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="empty"><div class="icon">⏳</div><p>加载中...</p></div>';
  var items = await getCollectionItems(id);
  var { data: collections } = await supabase.from("collections").select("*").eq("id", id).single();
  var col = collections;
  if (!col) { app.innerHTML = '<div class="empty"><div class="icon">❌</div><p>合集不存在</p></div>'; return; }
  var html = '<div class="detail"><a href="#/collections" class="back-btn">← 返回合集</a><h1>📁 ' + escapeHtml(col.name) + '</h1><p style="color:#94a3b8;margin-bottom:20px">' + escapeHtml(col.description || "") + '</p>';
  if (!items.length) {
    html += '<div class="empty"><div class="icon">📭</div><p>合集为空</p></div>';
  } else {
    html += '<div class="grid">' + items.map(function(p) {
      return '<a href="#/prompt/' + p.id + '" class="card"><div class="card-cat">' + getCatIcon(p.category) + ' ' + getCatName(p.category) + '</div><h3>' + escapeHtml(p.title) + '</h3><div class="card-desc">' + escapeHtml(p.description || "") + '</div></a>';
    }).join("") + '</div>';
  }
  html += '<div style="margin-top:20px;text-align:center"><button class="btn-secondary" onclick="deleteCollection(\'' + id + '\');navigateTo(\'#/collections\')">🗑️ 删除合集</button></div></div>';
  app.innerHTML = html;
}

// ========== 数据统计 ==========
async function renderStats() {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="empty"><div class="icon">⏳</div><p>加载中...</p></div>';
  var stats = await getMyStats();
  var prompts = await getMyPrompts();
  var html = '<div class="detail"><a href="#/profile" class="back-btn">← 返回</a><h1>📊 数据统计</h1><div class="stats-grid"><div class="stat-card"><div class="stat-num">' + stats.promptCount + '</div><div class="stat-label">发布数量</div></div><div class="stat-card"><div class="stat-num">' + stats.totalDownloads + '</div><div class="stat-label">总下载</div></div><div class="stat-card"><div class="stat-num">' + stats.totalFavorites + '</div><div class="stat-label">总收藏</div></div></div>';
  if (prompts.length) {
    html += '<h3 style="margin:24px 0 16px">📋 各 Prompt 表现</h3><div style="display:flex;flex-direction:column;gap:8px">' + prompts.map(function(p) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#111827;border:1px solid #1e293b;border-radius:10px"><div><strong>' + escapeHtml(p.title) + '</strong><div style="font-size:12px;color:#64748b;margin-top:2px">' + getCatName(p.category) + '</div></div><div style="display:flex;gap:16px;font-size:13px;color:#94a3b8"><span>📥 ' + (p.downloads || 0) + '</span><span>⭐ ' + (p.rating || 0) + '</span></div></div>';
    }).join("") + '</div>';
  }
  html += '</div>';
  app.innerHTML = html;
}



// ========== 添加到合集 ==========
async function showCollectionPicker(promptId) {
  if (!currentUser) { alert("请先登录"); return; }
  var collections = await getMyCollections();
  if (!collections.length) {
    if (confirm("还没有合集，是否创建一个？")) {
      var name = prompt("合集名称：");
      if (name) {
        var col = await createCollection(name, "");
        if (col) await addToCollection(col.id, promptId);
        showToast("✅ 已添加到合集");
      }
    }
    return;
  }
  var list = collections.map(function(c) {
    return '<div style="padding:10px 14px;cursor:pointer;border-radius:8px;margin:4px 0;background:#1e293b" onclick="addToCollection(\'' + c.id + '\',\'' + promptId + '\');var el=document.getElementById(\'collection-picker\');if(el)el.remove();showToast(\'✅ 已添加到「' + escapeHtml(c.name) + '\'\)">📁 ' + escapeHtml(c.name) + '</div>';
  }).join("");
  var overlay = document.createElement("div");
  overlay.id = "collection-picker";
  overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:999;display:flex;align-items:center;justify-content:center";
  overlay.innerHTML = '<div style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:24px;max-width:360px;width:90%;max-height:60vh;overflow-y:auto"><h3 style="margin-bottom:12px">📁 添加到合集</h3>' + list + '<button class="btn-secondary" style="width:100%;margin-top:8px" onclick="this.parentElement.parentElement.remove()">取消</button></div>';
  overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ========== 工具函数 ==========
function getCatName(id){var c=CATEGORIES.find(function(x){return x.id===id});return c?c.name:id;}
function getCatIcon(id){var c=CATEGORIES.find(function(x){return x.id===id});return c?c.icon:"📌";}
function escapeHtml(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function escapeAttr(s){return s.replace(/'/g,"\'").replace(/"/g,'\"').replace(/\n/g,"\\n");}

async function editPrompt(id){
  var prompt = await getPrompt(id);
  var app = document.getElementById("app");
  app.innerHTML='<div class="detail"><h1 style="margin-bottom:24px">✏️ 编辑提示词</h1><div class="form-group"><label>标题</label><input type="text" id="edit-title" value="'+escapeAttr(prompt.title)+'"></div><div class="form-group"><label>描述</label><textarea id="edit-desc">'+escapeHtml(prompt.description||"")+'</textarea></div><div class="form-group"><label>Prompt 正文</label><textarea id="edit-content" style="min-height:200px">'+escapeHtml(prompt.content)+'</textarea></div><div class="form-group"><label>价格（元）</label><input type="number" id="edit-price" value="'+(prompt.price/100)+'" min="0" step="0.01" style="width:200px"></div><button class="btn-primary" onclick="saveEdit(\''+id+'\')">💾 保存</button><button class="btn-secondary" style="margin-left:8px" onclick="navigateTo(\'/prompt/'+id+'\')">取消</button></div>';
}

async function saveEdit(id){
  var title=document.getElementById("edit-title").value.trim();
  var content=document.getElementById("edit-content").value.trim();
  if(!title||!content){alert("标题和内容不能为空");return;}
  var ok=await updatePrompt(id,{title:title,description:document.getElementById("edit-desc").value.trim(),content:content,tags:tags,price:Math.round(parseFloat(document.getElementById("edit-price").value||0)*100)});
  if(ok){showToast("✅ 已保存");navigateTo("/prompt/"+id);}
}

async function deletePromptAndGo(id){
  await deletePrompt(id);
  showToast("已删除");
  navigateTo("/");
}

// 5. Comments
function renderComments(promptId){
  var containerId = "comments-"+promptId;
  getComments(promptId).then(function(comments){
    var div = document.getElementById(containerId);
    if(!div)return;
    var html='<div style="margin-top:24px;border-top:1px solid #1e293b;padding-top:16px"><h3 style="margin-bottom:12px">💬 评论 ('+comments.length+')</h3>';
    if(currentUser){
      html+='<div style="display:flex;gap:8px;margin-bottom:16px"><input type="text" id="comment-input-'+promptId+'" placeholder="写评论..." style="flex:1;padding:8px 12px;border-radius:8px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-size:13px"><select id="rating-input-'+promptId+'" style="width:80px;padding:8px;border-radius:8px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-size:13px"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select><button class="btn-primary" style="padding:8px 16px;font-size:13px" onclick="submitComment(\''+promptId+'\')">发送</button></div>';
    }
    if(comments.length===0){html+='<p style="color:#475569;font-size:13px">暂无评论</p>';}
    else{for(var i=0;i<comments.length;i++){var c=comments[i];html+='<div style="padding:10px 0;border-bottom:1px solid #1e293b"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:13px">'+escapeHtml(c.user_name||"匿名")+'</span><span style="color:#f59e0b;font-size:12px">'+('⭐'.repeat(c.rating||0))+'</span></div><p style="color:#94a3b8;font-size:13px;margin-top:4px">'+escapeHtml(c.content)+'</p><span style="color:#475569;font-size:11px">'+new Date(c.created_at).toLocaleDateString("zh-CN")+'</span></div>';}}
    html+='</div>';
    div.innerHTML=html;
  });
  return '<div id="'+containerId+'"><div style="padding:12px 0;color:#475569;font-size:13px">⏳ 加载评论...</div></div>';
}

async function submitComment(promptId){
  var input=document.getElementById("comment-input-"+promptId);
  var rating=document.getElementById("rating-input-"+promptId);
  var content=input.value.trim();
  if(!content){alert("请输入评论内容");return;}
  var ok=await addComment(promptId,content,parseInt(rating.value));
  if(ok){input.value="";renderDetail(promptId);}
}

function showToast(msg){var t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},2500);}

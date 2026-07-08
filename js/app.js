// ============================================
// 提示词PRO - 主应用逻辑 v1.1
// ============================================

function getRoute() {
  var hash = location.hash.slice(1) || "/";
  if (hash.startsWith("/prompt/")) return { page: "detail", id: hash.split("/")[2] };
  if (hash.startsWith("/category/")) return { page: "home", category: hash.split("/")[2] };
  return { page: hash.slice(1) || "home" };
}

async function render() {
  var route = getRoute();
  await checkAuth();
  if (route.page === "home") await renderHome(route.category);
  else if (route.page === "detail") await renderDetail(route.id);
  else if (route.page === "create") renderCreate();
  else if (route.page === "login") renderLogin();
  else if (route.page === "profile") renderProfile();
  else renderHome();
}

function navigateTo(path) { location.hash = "#" + path; }
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

// ========== 首页 ==========
async function renderHome(category) {
  var app = document.getElementById("app");
  app.innerHTML = '<div class="hero"><h1>🪄 发现优质 AI 提示词</h1><p>覆盖文案、设计、编程、教育等 7 大分类</p><p style="font-size:13px;margin-top:4px">创作者发布赚钱 · 用户一键复制使用</p></div><div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="搜索提示词..."></div><div class="categories" id="cat-tabs"><span class="cat-tab'+(category?'':' active')+'" data-cat="" onclick="filterByCategory(\'\')">🔥 全部</span>'+CATEGORIES.map(function(c){return '<span class="cat-tab'+(category===c.id?' active':'')+'" data-cat="'+c.id+'" onclick="filterByCategory(\''+c.id+'\')">'+c.icon+' '+c.name+'</span>';}).join("")+'</div><div id="prompt-grid" class="grid"><div class="empty" style="grid-column:1/-1"><div class="icon">⏳</div><p>加载中...</p></div></div>';
  loadPrompts(category);
  var timer;
  document.getElementById("search-input").addEventListener("input", function(){clearTimeout(timer);var q=this.value;timer=setTimeout(function(){loadPrompts(category,q);},400);});
}

function filterByCategory(cat){document.querySelectorAll(".cat-tab").forEach(function(t){t.classList.toggle("active",t.dataset.cat===cat);});loadPrompts(cat,document.getElementById("search-input")?.value||"");}

async function loadPrompts(category, search) {
  var grid = document.getElementById("prompt-grid");if(!grid)return;
  try{var prompts=await getPrompts({category:category||undefined,search:search||undefined,sort:"newest"});if(prompts.length===0){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="icon">📭</div><p>暂无提示词</p><p style="font-size:13px">成为第一个发布的人！</p></div>';return;}
  grid.innerHTML=prompts.map(function(p){return '<a href="#/prompt/'+p.id+'" class="card"><div class="card-cat">'+getCatIcon(p.category)+' '+getCatName(p.category)+'</div><h3>'+escapeHtml(p.title)+'</h3><div class="card-desc">'+escapeHtml(p.description||"暂无描述")+'</div><div class="card-meta"><span class="card-price'+(p.price===0?' free':'')+'">'+(p.price===0?'免费':'¥'+(p.price/100).toFixed(2))+'</span><span class="card-stats">📥 '+(p.downloads||0)+' ⭐ '+(p.rating||0)+'</span></div><div class="platform-tags">'+(p.platforms||[]).map(function(pl){return '<span class="ptag">'+pl+'</span>';}).join("")+'</div></a>';}).join("");}catch(e){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="icon">❌</div><p>加载失败</p></div>';}
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
  html+='<div class="prompt-box"><button id="fav-btn" class="copy-btn" style="right:110px;background:#1e293b" onclick="handleFavorite(\''+prompt.id+'\')">☆ 收藏</button><button class="copy-btn" onclick="copyPrompt(\''+escapeAttr(prompt.content)+'\')">📋 复制</button><code>'+escapeHtml(prompt.content)+'</code></div>';
  if(prompt.price>0)html+='<div style="text-align:center;margin-top:16px"><span style="font-size:20px;font-weight:800;color:#34d399">¥'+(prompt.price/100).toFixed(2)+'</span><br><button class="btn-primary" style="margin-top:12px" onclick="purchase(\''+prompt.id+'\')">💰 购买并解锁</button></div>';
  html+='</div>';
  app.innerHTML=html;
  if(currentUser){isFavorited(prompt.id).then(function(faved){var btn=document.getElementById("fav-btn");if(btn){btn.textContent=faved?"★ 已收藏":"☆ 收藏";btn.style.background=faved?"#7c3aed":"#1e293b";}});}
}

async function handleFavorite(promptId){if(!currentUser){navigateTo("/login");return;}var faved=await toggleFavorite(promptId);var btn=document.getElementById("fav-btn");if(btn){btn.textContent=faved?"★ 已收藏":"☆ 收藏";btn.style.background=faved?"#7c3aed":"#1e293b";}}
function copyPrompt(text){navigator.clipboard.writeText(text).then(function(){showToast("✅ 已复制！去 AI 平台粘贴使用");});}
async function purchase(promptId){if(!currentUser){navigateTo("/login");return;}var{error}=await supabase.from("purchases").insert({user_id:currentUser.id,prompt_id:promptId});if(error){alert("购买失败："+error.message);return;}showToast("🎉 购买成功！");renderDetail(promptId);}

// ========== 创建页 ==========
function renderCreate(){var app=document.getElementById("app");if(!currentUser){navigateTo("/login");return;}
app.innerHTML='<div class="detail"><h1 style="margin-bottom:24px">✍️ 发布新提示词</h1><div class="form-group"><label>标题 *</label><input type="text" id="new-title" placeholder="例：小红书爆款文案生成器"></div><div class="form-group"><label>分类 *</label><select id="new-category">'+CATEGORIES.map(function(c){return'<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>';}).join("")+'</select></div><div class="form-group"><label>适用平台</label><div style="display:flex;flex-wrap:wrap;gap:6px" id="platform-tags">'+PLATFORMS.map(function(p){return'<span class="cat-tab" data-p="'+p+'" onclick="this.classList.toggle(\'active\')">'+p+'</span>';}).join("")+'</div></div><div class="form-group"><label>描述</label><textarea id="new-desc" placeholder="简要说明用途和效果"></textarea></div><div class="form-group"><label>Prompt 正文 *</label><textarea id="new-content" placeholder="粘贴你的 Prompt..." style="min-height:200px"></textarea></div><div class="form-group"><label>价格（元）</label><input type="number" id="new-price" value="0" min="0" max="999" step="0.01" style="width:200px"><span style="color:#64748b;font-size:12px;margin-left:8px">0=免费</span></div><button class="btn-primary" id="submit-btn" onclick="submitPrompt()">🚀 发布</button></div>';}

async function submitPrompt(){var title=document.getElementById("new-title").value.trim();var content=document.getElementById("new-content").value.trim();if(!title||!content){alert("标题和内容不能为空");return;}var platforms=[];document.querySelectorAll("#platform-tags .cat-tab.active").forEach(function(t){platforms.push(t.dataset.p);});var btn=document.getElementById("submit-btn");btn.disabled=true;btn.textContent="发布中...";var prompt={title:title,category:document.getElementById("new-category").value,platforms:platforms,description:document.getElementById("new-desc").value.trim(),content:content,price:Math.round(parseFloat(document.getElementById("new-price").value||0)*100)};var result=await createPrompt(prompt);if(result){showToast("🎉 发布成功！");navigateTo("/prompt/"+result.id);}else{btn.disabled=false;btn.textContent="🚀 发布";}}

// ========== 登录页 ==========
function renderLogin(){if(currentUser){navigateTo("/");return;}document.getElementById("app").innerHTML='<div class="login-box"><h2>🪄 登录提示词PRO</h2><p style="color:#64748b;margin-bottom:32px">用 GitHub 账号登录，即可发布和购买提示词</p><button class="btn-primary" onclick="loginWithGitHub()" style="width:100%;padding:14px">🔑 使用 GitHub 登录</button></div>';}

// ========== 个人中心 ==========
function renderProfile(tab){var app=document.getElementById("app");if(!currentUser){navigateTo("/login");return;}tab=tab||"published";
app.innerHTML='<div class="detail"><h1>👤 个人中心</h1><p style="color:#94a3b8;margin:8px 0">'+(currentUser.user_metadata?.full_name||currentUser.email)+'</p><div style="display:flex;gap:6px;margin:20px 0;flex-wrap:wrap"><span class="cat-tab'+(tab==="published"?" active":"")+'" onclick="renderProfile(\'published\')">📤 我的发布</span><span class="cat-tab'+(tab==="favorites"?" active":"")+'" onclick="renderProfile(\'favorites\')">⭐ 我的收藏</span><span class="cat-tab'+(tab==="purchases"?" active":"")+'" onclick="renderProfile(\'purchases\')">🛒 已购买</span></div><div id="profile-content"><div class="empty"><div class="icon">⏳</div><p>加载中...</p></div></div><button class="btn-secondary" onclick="logout()" style="margin-top:24px">退出登录</button></div>';
loadProfileContent(tab);}

async function loadProfileContent(tab){var container=document.getElementById("profile-content");if(!container)return;var prompts;if(tab==="published")prompts=await getMyPrompts();else if(tab==="favorites")prompts=await getMyFavorites();else prompts=await getMyPurchases();if(!prompts||prompts.length===0){container.innerHTML='<div class="empty"><div class="icon">📭</div><p>暂无内容</p></div>';return;}container.innerHTML=prompts.map(function(p){return'<a href="#/prompt/'+p.id+'" class="card" style="margin-bottom:12px"><div class="card-cat">'+getCatIcon(p.category)+' '+getCatName(p.category)+'</div><h3>'+escapeHtml(p.title)+'</h3><div class="card-desc">'+escapeHtml(p.description||"")+'</div><div class="card-meta"><span class="card-price'+(p.price===0?' free':'')+'">'+(p.price===0?'免费':'¥'+(p.price/100).toFixed(2))+'</span><span class="card-stats">📥 '+(p.downloads||0)+'</span></div></a>';}).join("");}

// ========== 工具函数 ==========
function getCatName(id){var c=CATEGORIES.find(function(x){return x.id===id});return c?c.name:id;}
function getCatIcon(id){var c=CATEGORIES.find(function(x){return x.id===id});return c?c.icon:"📌";}
function escapeHtml(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function escapeAttr(s){return s.replace(/'/g,"\'").replace(/"/g,'\"').replace(/\n/g,"\\n");}
function showToast(msg){var t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},2500);}

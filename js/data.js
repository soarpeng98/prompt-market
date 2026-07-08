var CATEGORIES = [
  { id:"writing", name:"文案写作", icon:"✍️", desc:"公众号/小红书/营销文案" },
  { id:"design", name:"设计创意", icon:"🎨", desc:"Midjourney/Stable Diffusion" },
  { id:"coding", name:"编程开发", icon:"💻", desc:"Cursor/Copilot 提示词" },
  { id:"education", name:"教育教学", icon:"📚", desc:"课程设计/备课/论文" },
  { id:"marketing", name:"营销增长", icon:"📈", desc:"SEO/广告/增长策略" },
  { id:"lifestyle", name:"生活效率", icon:"🏠", desc:"健身/旅行/理财/日常" },
  { id:"office", name:"办公助手", icon:"📋", desc:"PPT/Excel/邮件/会议" },
];
var PLATFORMS = ["ChatGPT","Claude","Kimi","豆包","DeepSeek","通义千问","文心一言"];
async function getPrompts(options) {
  var query = supabase.from("prompts").select("*");
  if (options?.category) query = query.eq("category", options.category);
  if (options?.search) query = query.or("title.ilike.%"+options.search+"%,description.ilike.%"+options.search+"%");
  if (options?.sort === "popular") query = query.order("downloads", { ascending: false });
  else if (options?.sort === "price") query = query.order("price", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  query = query.limit(options?.limit || 50);
  var { data, error } = await query;
  return data || [];
}
async function getPrompt(id) {
  var { data } = await supabase.from("prompts").select("*").eq("id", id).single();
  return data;
}
async function createPrompt(prompt) {
  prompt.author_id = currentUser.id;
  prompt.author_name = currentUser.user_metadata?.full_name || currentUser.email;
  var { data, error } = await supabase.from("prompts").insert(prompt).select().single();
  if (error) alert("创建失败: " + error.message);
  return data;
}

async function toggleFavorite(promptId) {
  if (!currentUser) return false;
  var { data: existing } = await supabase.from("favorites").select("*").eq("user_id", currentUser.id).eq("prompt_id", promptId).single();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("favorites").insert({ user_id: currentUser.id, prompt_id: promptId });
    return true;
  }
}
async function isFavorited(promptId) {
  if (!currentUser) return false;
  var { data } = await supabase.from("favorites").select("*").eq("user_id", currentUser.id).eq("prompt_id", promptId).single();
  return !!data;
}
async function getMyFavorites() {
  if (!currentUser) return [];
  var { data } = await supabase.from("favorites").select("prompt_id, prompts(*)").eq("user_id", currentUser.id);
  return (data||[]).map(function(f){ return f.prompts; }).filter(Boolean);
}
async function getMyPrompts() {
  if (!currentUser) return [];
  var { data } = await supabase.from("prompts").select("*").eq("author_id", currentUser.id).order("created_at", { ascending: false });
  return data || [];
}
async function getMyPurchases() {
  if (!currentUser) return [];
  var { data } = await supabase.from("purchases").select("prompt_id, prompts(*)").eq("user_id", currentUser.id);
  return (data||[]).map(function(p){ return p.prompts; }).filter(Boolean);
}

// 编辑 prompt
async function updatePrompt(id, updates) {
  var { error } = await supabase.from("prompts").update(updates).eq("id", id).eq("author_id", currentUser.id);
  return !error;
}

// 删除 prompt
async function deletePrompt(id) {
  var { error } = await supabase.from("prompts").delete().eq("id", id).eq("author_id", currentUser.id);
  return !error;
}

// 评论
async function getComments(promptId) {
  var { data } = await supabase.from("comments").select("*").eq("prompt_id", promptId).order("created_at", {ascending: false});
  return data || [];
}

async function addComment(promptId, content, rating) {
  var { data, error } = await supabase.from("comments").insert({
    prompt_id: promptId, user_id: currentUser.id, content: content, rating: rating,
    user_name: currentUser.user_metadata?.full_name || currentUser.email
  }).select().single();
  if (error) { alert("评论失败: "+error.message); return null; }
  return data;
}

async function deleteComment(id) {
  await supabase.from("comments").delete().eq("id", id).eq("user_id", currentUser.id);
}

// 作者主页
async function getAuthorPrompts(authorId) {
  var { data } = await supabase.from("prompts").select("*").eq("author_id", authorId).order("created_at", { ascending: false });
  return data || [];
}
async function getAuthorInfo(authorId) {
  var { data } = await supabase.from("profiles").select("*").eq("id", authorId).single();
  return data;
}


// 精选推荐
async function getFeaturedPrompts() {
  var { data } = await supabase.from("prompts").select("*").eq("featured", true).order("rating", { ascending: false }).limit(6);
  return data || [];
}

// 合集
async function createCollection(name, description) {
  var { data, error } = await supabase.from("collections").insert({
    user_id: currentUser.id, name: name, description: description || ""
  }).select().single();
  if (error) { alert("创建失败: " + error.message); return null; }
  return data;
}
async function getMyCollections() {
  if (!currentUser) return [];
  var { data } = await supabase.from("collections").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false });
  return data || [];
}
async function getPublicCollections(userId) {
  var query = supabase.from("collections").select("*").eq("is_public", true).order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  var { data } = await query;
  return data || [];
}
async function getCollectionItems(collectionId) {
  var { data } = await supabase.from("collection_items").select("prompt_id, prompts(*)").eq("collection_id", collectionId).order("sort_order", { ascending: true });
  return (data || []).map(function(i) { return i.prompts; }).filter(Boolean);
}
async function addToCollection(collectionId, promptId) {
  var { error } = await supabase.from("collection_items").insert({
    collection_id: collectionId, prompt_id: promptId
  });
  return !error;
}
async function removeFromCollection(collectionId, promptId) {
  var { error } = await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("prompt_id", promptId);
  return !error;
}
async function deleteCollection(collectionId) {
  await supabase.from("collections").delete().eq("id", collectionId).eq("user_id", currentUser.id);
}

// 统计
async function getMyStats() {
  if (!currentUser) return { totalViews: 0, totalDownloads: 0, totalFavorites: 0, prompts: [] };
  var all = await getMyPrompts();
  var totalViews = 0, totalDownloads = 0, totalFavorites = 0;
  all.forEach(function(p) {
    totalDownloads += (p.downloads || 0);
  });
  // Get favorites count
  var { data: favs } = await supabase.from("favorites").select("prompt_id").in("prompt_id", all.map(function(p) { return p.id; }));
  totalFavorites = (favs || []).length;
  // Recent stats
  var sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  var { data: stats } = await supabase.from("prompt_stats").select("*").in("prompt_id", all.map(function(p) { return p.id; })).gte("stat_date", sevenDaysAgo.toISOString().split("T")[0]);
  (stats || []).forEach(function(s) {
    totalViews += (s.view_count || 0);
    totalDownloads += (s.download_count || 0);
    totalFavorites += (s.favorite_count || 0);
  });
  return { totalViews: totalViews, totalDownloads: totalDownloads, totalFavorites: totalFavorites, promptCount: all.length };
}
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
  if (options?.search) query = query.ilike("title", "%"+options.search+"%");
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

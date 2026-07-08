
var currentUser = null;

async function checkAuth() {
  var { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  updateAuthUI();
  return currentUser;
}

function updateAuthUI() {
  var btn = document.getElementById("auth-btn");
  if (!btn) return;
  if (currentUser) {
    var name = currentUser.user_metadata?.full_name || currentUser.email || "我的";
    btn.textContent = name.length > 8 ? name.slice(0,8)+".." : name;
    btn.href = "#/profile";
    btn.style.background = "linear-gradient(135deg,#7c3aed,#a78bfa)";
  } else {
    btn.textContent = "登录";
    btn.href = "#/login";
    btn.style.background = "linear-gradient(135deg,#2563eb,#7c3aed)";
  }
}

// GitHub OAuth
async function loginWithGitHub() {
  await supabase.auth.signInWithOAuth({ 
    provider: "github", 
    options: { redirectTo: location.origin + location.pathname }
  });
}

// Email signup
async function signupWithEmail(email, password, name) {
  var { data, error } = await supabase.auth.signUp({ 
    email: email, 
    password: password,
    options: { data: { full_name: name } }
  });
  if (error) { alert("注册失败: " + error.message); return false; }
  if (data.user && data.session) {
    currentUser = data.user;
    updateAuthUI();
    navigateTo("/");
    showToast("✅ 注册成功！欢迎 " + (name || email));
  } else {
    showToast("📧 注册成功！请检查邮箱确认（如已关闭确认则直接登录）");
  }
  return true;
}

// Email login
async function loginWithEmail(email, password) {
  var { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { alert("登录失败: " + error.message); return false; }
  currentUser = data.user;
  updateAuthUI();
  navigateTo("/");
  showToast("✅ 登录成功！");
  return true;
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  updateAuthUI();
  navigateTo("/");
}

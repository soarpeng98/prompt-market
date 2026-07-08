
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


// 监听密码重置事件
supabase.auth.onAuthStateChange(function(event, session) {
  if (event === "PASSWORD_RECOVERY") {
    // 有session了，直接显示设置密码页
    var app = document.getElementById("app");
    if (app) {
      app.innerHTML = '<div class="login-box"><h2>🔑 设置新密码</h2><p style="color:#64748b;margin-bottom:16px">请输入你的新密码</p><form onsubmit="event.preventDefault();var pwd=document.getElementById(\'new-pwd\').value;var pwd2=document.getElementById(\'new-pwd2\').value;if(!pwd||pwd.length<6){alert(\'密码至少6位\');return;}if(pwd!==pwd2){alert(\'两次密码不一致\');return;}completeResetNow(pwd);"><div class="form-group"><input type="password" id="new-pwd" placeholder="新密码（6位以上）*" required minlength="6"></div><div class="form-group"><input type="password" id="new-pwd2" placeholder="确认新密码 *" required minlength="6"></div><button type="submit" class="btn-primary" style="width:100%">💾 重置密码</button></form></div>';
    }
  }
});

async function completeResetNow(newPassword) {
  var { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    alert("重置失败: " + error.message);
  } else {
    await supabase.auth.signOut();
    var app = document.getElementById("app");
    app.innerHTML = '<div class="login-box"><h2>✅ 密码已重置</h2><p style="color:#94a3b8;margin:16px 0">请使用新密码登录</p><a href="#/login" class="btn-primary" style="display:block;text-align:center">去登录</a></div>';
  }
}

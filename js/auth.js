var currentUser = null;
async function checkAuth() {
  var { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  updateAuthUI();
  return currentUser;
}
function updateAuthUI() {
  var btn = document.getElementById("auth-btn");
  var avatar = document.getElementById("user-avatar");
  if (!btn) return;
  if (currentUser) {
    btn.textContent = currentUser.user_metadata?.full_name || currentUser.email || "我的";
    btn.href = "#/profile";
    if (avatar) avatar.style.display = "block";
  } else {
    btn.textContent = "登录";
    btn.href = "#/login";
    if (avatar) avatar.style.display = "none";
  }
}
async function loginWithGitHub() {
  await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: location.origin + location.pathname } });
}
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  updateAuthUI();
  navigateTo("/");
}

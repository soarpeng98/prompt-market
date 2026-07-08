-- ==========================================
-- Prompt 管理平台 - 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行
-- ==========================================

-- 1. 创建 prompts 表
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  price INTEGER DEFAULT 0,           -- 价格(分)，0=免费
  cover_url TEXT DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT '',
  downloads INTEGER DEFAULT 0,
  rating FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建 profiles 表（用户资料）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 purchases 表（购买记录）
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 4. 创建 favorites 表（收藏）
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 5. 索引
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_author ON prompts(author_id);
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX idx_purchases_user ON purchases(user_id);

-- 6. 自动创建 profile（用户注册时触发）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. 权限策略（允许所有人读取 prompts）
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都能查看prompts" ON prompts FOR SELECT USING (true);
CREATE POLICY "登录用户可以创建prompts" ON prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "作者可以更新自己的prompts" ON prompts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "作者可以删除自己的prompts" ON prompts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人都能查看profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户可以更新自己的profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户查看自己的购买记录" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建购买记录" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户查看自己的收藏" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以收藏" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以取消收藏" ON favorites FOR DELETE USING (auth.uid() = user_id);

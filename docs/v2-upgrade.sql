-- ==========================================
-- V2 升级脚本：标签 + 精选 + 合集 + 统计
-- 在 Supabase SQL Editor 中运行
-- ==========================================

-- 1. 标签列
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. 精选标记
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(featured);

-- 3. 合集表
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, prompt_id)
);

-- 合集权限
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "查看公开合集" ON collections;
CREATE POLICY "查看公开合集" ON collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "创建合集" ON collections;
CREATE POLICY "创建合集" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "管理自己的合集" ON collections;
CREATE POLICY "管理自己的合集" ON collections FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "删除自己的合集" ON collections;
CREATE POLICY "删除自己的合集" ON collections FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "查看合集内容" ON collection_items;
CREATE POLICY "查看合集内容" ON collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND (is_public = true OR user_id = auth.uid()))
);
DROP POLICY IF EXISTS "添加合集项" ON collection_items;
CREATE POLICY "添加合集项" ON collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "删除合集项" ON collection_items;
CREATE POLICY "删除合集项" ON collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
);

-- 4. 统计表
CREATE TABLE IF NOT EXISTS prompt_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  stat_date DATE DEFAULT CURRENT_DATE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  UNIQUE(prompt_id, stat_date)
);

ALTER TABLE prompt_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "作者查看自己prompt统计" ON prompt_stats;
CREATE POLICY "作者查看自己prompt统计" ON prompt_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND author_id = auth.uid())
);
DROP POLICY IF EXISTS "系统插入统计" ON prompt_stats;
CREATE POLICY "系统插入统计" ON prompt_stats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "系统更新统计" ON prompt_stats;
CREATE POLICY "系统更新统计" ON prompt_stats FOR UPDATE USING (true);

-- 5. 更新种子数据加上标签
UPDATE prompts SET tags = ARRAY['小红书','种草','文案'] WHERE title = '小红书爆款文案生成器';
UPDATE prompts SET tags = ARRAY['公众号','写作','深度文章'] WHERE title = '公众号长文写作助手';
UPDATE prompts SET tags = ARRAY['Midjourney','摄影','电商'] WHERE title = 'Midjourney 产品摄影提示词';
UPDATE prompts SET tags = ARRAY['Python','爬虫','代码'] WHERE title = 'Python爬虫代码生成器';
UPDATE prompts SET tags = ARRAY['英语','口语','雅思'] WHERE title = '英语口语陪练老师';

-- 6. 精选2个种子prompt
UPDATE prompts SET featured = true WHERE title IN ('小红书爆款文案生成器', 'Midjourney 产品摄影提示词');

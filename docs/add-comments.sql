-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动更新 prompts 评分
CREATE OR REPLACE FUNCTION update_prompt_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prompts SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1) FROM comments WHERE prompt_id = NEW.prompt_id
  ) WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_insert ON comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION update_prompt_rating();

-- 权限
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "任何人都能查看评论" ON comments;
CREATE POLICY "任何人都能查看评论" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "登录用户可以评论" ON comments;
CREATE POLICY "登录用户可以评论" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;
CREATE POLICY "用户可以删除自己的评论" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 编辑权限：作者可以更新自己的prompts
DROP POLICY IF EXISTS "作者可以更新自己的prompts" ON prompts;
CREATE POLICY "作者可以更新自己的prompts" ON prompts FOR UPDATE USING (auth.uid() = author_id);

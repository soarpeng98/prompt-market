-- 🌱 种子数据：在 Supabase SQL Editor 中运行
-- 先清空再插入（避免重复）
DELETE FROM prompts;

INSERT INTO prompts (title, description, content, category, platforms, price, author_name, downloads, rating) VALUES
('小红书爆款文案生成器', '输入产品信息，自动生成符合小红书调性的种草文案，包含emoji和热门话题标签', '你是一个小红书文案专家。请根据以下产品信息生成一篇小红书风格种草笔记：

产品名称：{product_name}
产品特点：{features}
目标人群：{audience}

要求：
1. 标题吸引眼球，使用emoji
2. 正文口语化，像闺蜜聊天
3. 包含2-3个热门话题标签
4. 长度300-500字', 'writing', ARRAY['ChatGPT','Kimi','豆包','通义千问'], 299, '小陈不会写文案', 156, 4.8),
('公众号长文写作助手', '从选题到成稿，AI辅助完成3000字公众号深度文章', '请帮我写一篇公众号文章，要求如下：

主题：{topic}
风格：深度分析
字数：2500-3500字
目标读者：{audience}

结构：
1. 开头：用热点事件或数据引入
2. 正文：分3-4个论点展开，每个配案例
3. 结尾：金句收尾，引发讨论

注意：用短句，每段不超过4行', 'writing', ARRAY['ChatGPT','Claude','DeepSeek'], 199, '老李写稿', 89, 4.6),
('Midjourney 产品摄影提示词', '生成高品质电商产品图，白底/场景图一键生成', 'Product photography, {product_description}, shot on Canon EOS R5, 85mm lens, professional studio lighting, soft shadows, clean white background, ultra HD, commercial photography style --ar 3:4 --v 6.0', 'design', ARRAY['ChatGPT'], 0, '设计师阿杰', 234, 4.9),
('Python爬虫代码生成器', '描述需求，自动生成完整Python爬虫代码，含注释和错误处理', '你是一个Python爬虫专家。根据需求生成完整的爬虫代码：

需求：{requirement}
目标网站：{target_url}

要求：
1. 使用requests+BeautifulSoup
2. 包含headers伪装和延时
3. try-except错误处理
4. 结果保存为CSV
5. 详细中文注释', 'coding', ARRAY['ChatGPT','Claude','DeepSeek','Cursor'], 499, '码农张三', 312, 4.7),
('英语口语陪练老师', 'AI扮演英语外教，纠正发音和语法，适合雅思口语备考', 'You are an IELTS speaking tutor. Please have a conversation with me on the topic of {topic}. 

Rules:
1. Use natural, conversational English
2. Correct my grammar mistakes gently
3. After each response, ask a follow-up question
4. Rate my fluency (1-5)', 'education', ARRAY['ChatGPT','Claude','Kimi'], 99, '英语学习笔记', 178, 4.5),
('会议纪要自动生成器', '输入会议录音文字，自动整理为专业会议纪要', '请将以下会议记录整理为专业的会议纪要：

会议记录：
{transcript}

格式要求：
1. 会议主题和时间
2. 参会人员
3. 讨论要点（分条）
4. 决议事项
5. 待办任务（负责人+截止日期）', 'office', ARRAY['ChatGPT','豆包','通义千问','文心一言'], 0, '职场效率控', 67, 4.4),
('健身计划定制教练', '根据身体状况和目标，生成科学健身和饮食计划', '你是一名持证健身教练和营养师。请根据以下信息定制计划：

年龄：{age} 性别：{gender}
身高体重：{height}cm / {weight}kg
目标：{goal}
运动经验：{experience}
每周可运动天数：{days}

输出：
1. 每周训练计划（具体动作+组数）
2. 每日饮食建议
3. 注意事项和进步记录建议', 'lifestyle', ARRAY['ChatGPT','Kimi','DeepSeek'], 199, '铁馆小王子', 145, 4.8),
('SEO文章优化助手', '分析文章SEO表现，给出标题、关键词和结构优化建议', '你是SEO优化专家。分析并优化以下文章：

文章标题：{title}
文章内容：
{content}

分析维度：
1. 标题SEO优化建议（含3个备选标题）
2. 关键词密度和布局分析
3. 内链和外链建议
4. 结构化数据建议
5. 对标竞品内容差距分析', 'marketing', ARRAY['ChatGPT','Claude'], 299, '增长黑客小北', 203, 4.6);

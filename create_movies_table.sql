-- moviesテーブル作成SQL
-- Supabase Dashboard > SQL Editor で実行してください

CREATE TABLE movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_id VARCHAR(255), -- Cloudflare Images ID
  video_id VARCHAR(255), -- Cloudflare Stream ID
  category VARCHAR(100) DEFAULT 'おすすめ',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) を有効化
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能なポリシー
CREATE POLICY "movies_read_policy" ON movies 
  FOR SELECT USING (true);

-- 認証ユーザーのみ書き込み可能なポリシー
CREATE POLICY "movies_write_policy" ON movies 
  FOR ALL USING (auth.role() = 'authenticated');

-- サンプルデータ投入
INSERT INTO movies (title, description, image_id, video_id, category) VALUES
('魔法学校', '魔法使いの少年が魔法学校で冒険する物語', '06e7c5e1-4ff2-45a1-b682-595a1ba91400', 'sample-video-id-2', 'あなたにおすすめ'),
('マイクを止めるな', '低予算で制作されたゾンビ映画の撮影現場で巻き起こる予期せぬ出来事', '3b91e694-0008-4ec9-c7e2-2d749f6b4b00', 'sample-video-id-1', 'フィーチャー'),
('インセプション', '夢の中の夢を描いたSFスリラー', NULL, 'sample-video-id-3', 'あなたにおすすめ'),
('インターステラー', '宇宙を舞台にした壮大なSF映画', NULL, 'sample-video-id-4', 'あなたにおすすめ');
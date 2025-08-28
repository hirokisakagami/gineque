-- handle_updated_at関数を作成（存在しない場合）
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 視聴履歴テーブルを作成
CREATE TABLE IF NOT EXISTS viewing_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid NOT NULL,
  progress_time real DEFAULT 0,
  progress_percentage real DEFAULT 0,
  last_watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLSを有効化
ALTER TABLE viewing_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の視聴履歴のみ閲覧・編集可能
CREATE POLICY "Users can view own viewing history" 
  ON viewing_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own viewing history" 
  ON viewing_history FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own viewing history" 
  ON viewing_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own viewing history" 
  ON viewing_history FOR DELETE 
  USING (auth.uid() = user_id);

-- updated_at自動更新トリガー
CREATE TRIGGER viewing_history_updated_at
  BEFORE UPDATE ON viewing_history
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_viewing_history_user_id ON viewing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_history_movie_id ON viewing_history(movie_id);
CREATE INDEX IF NOT EXISTS idx_viewing_history_last_watched ON viewing_history(last_watched_at);
-- マイリストテーブルを作成
CREATE TABLE IF NOT EXISTS my_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 同じユーザーが同じ映画を重複して追加できないようにする
  UNIQUE(user_id, movie_id)
);

-- RLSを有効化
ALTER TABLE my_list ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のマイリストのみ閲覧・編集可能
CREATE POLICY "Users can view own my_list" 
  ON my_list FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own my_list" 
  ON my_list FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own my_list" 
  ON my_list FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own my_list" 
  ON my_list FOR DELETE 
  USING (auth.uid() = user_id);

-- updated_at自動更新トリガー
CREATE TRIGGER my_list_updated_at
  BEFORE UPDATE ON my_list
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_my_list_user_id ON my_list(user_id);
CREATE INDEX IF NOT EXISTS idx_my_list_movie_id ON my_list(movie_id);
CREATE INDEX IF NOT EXISTS idx_my_list_added_at ON my_list(added_at);
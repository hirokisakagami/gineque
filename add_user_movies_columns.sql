-- moviesテーブルにユーザー投稿用カラムを追加するSQL
-- Supabase Dashboard > SQL Editor で実行してください

-- ユーザー作成者情報カラムを追加
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_movies_created_by ON movies(created_by);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_user_role ON movies(user_role);

-- RLSポリシーを更新（ユーザー投稿の作品に対する権限管理）

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "movies_write_policy" ON movies;

-- 新しい書き込みポリシー：認証済みユーザーは自分の作品を作成・編集可能
CREATE POLICY "movies_insert_policy" ON movies 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "movies_update_own_policy" ON movies 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- 管理者は全ての作品を編集可能（将来の管理機能用）
CREATE POLICY "movies_admin_policy" ON movies 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_role = 'admin'
    )
  );

-- デフォルト値を設定する関数を作成（作品投稿時に自動でcreated_byとuser_roleを設定）
CREATE OR REPLACE FUNCTION set_movie_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- created_byが設定されていない場合、現在のユーザーIDを設定
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  
  -- user_roleが設定されていない場合、プロフィールから取得
  IF NEW.user_role IS NULL THEN
    SELECT profiles.user_role INTO NEW.user_role
    FROM profiles 
    WHERE profiles.id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成
CREATE OR REPLACE TRIGGER movies_set_creator_trigger
  BEFORE INSERT ON movies
  FOR EACH ROW
  EXECUTE FUNCTION set_movie_creator();

-- コメント追加
COMMENT ON COLUMN movies.created_by IS 'ユーザー投稿作品の作成者ID';
COMMENT ON COLUMN movies.user_role IS '投稿時の作成者ロール（filmmaker, admin等）';
COMMENT ON COLUMN movies.status IS '作品ステータス（published, draft, private等）';

-- 確認用クエリ
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;
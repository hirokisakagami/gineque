-- Supabaseダッシュボードで手動実行する必要があるSQL

-- profilesテーブルにuser_roleカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'viewer' 
CHECK (user_role IN ('viewer', 'filmmaker', 'actor'));

-- 既存のユーザーのuser_roleをデフォルトの'viewer'に設定
UPDATE profiles 
SET user_role = 'viewer' 
WHERE user_role IS NULL;

-- インデックスを追加してクエリパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);

-- コメント追加
COMMENT ON COLUMN profiles.user_role IS 'ユーザーの役割: viewer(視聴者), filmmaker(映像作家), actor(役者)';

-- 例: ロール別にユーザーを取得するクエリ
-- SELECT * FROM profiles WHERE user_role = 'filmmaker';
-- SELECT * FROM profiles WHERE user_role = 'actor';
-- SELECT * FROM profiles WHERE user_role = 'viewer';

-- ロール別のユーザー数を取得
-- SELECT user_role, COUNT(*) as user_count FROM profiles GROUP BY user_role;
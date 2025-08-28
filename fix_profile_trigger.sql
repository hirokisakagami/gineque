-- プロフィール自動作成トリガーを修正
-- user_metadataからuser_roleを取得するように更新

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, user_role)
  VALUES (
    NEW.id, 
    split_part(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
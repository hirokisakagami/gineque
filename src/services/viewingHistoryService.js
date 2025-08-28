import { supabase } from '../config/supabase';

// 視聴履歴を記録
export const recordViewingHistory = async (movieId, progressTime = 0, duration = 0) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const progressPercentage = duration > 0 ? (progressTime / duration) * 100 : 0;

    // 既存の視聴履歴があるかチェック
    const { data: existingHistory } = await supabase
      .from('viewing_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single();

    if (existingHistory) {
      // 既存の履歴を更新
      const { data, error } = await supabase
        .from('viewing_history')
        .update({
          progress_time: progressTime,
          progress_percentage: progressPercentage,
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .select()
        .single();

      if (error) {
        console.error('Viewing history update error:', error);
        throw error;
      }

      return data;
    } else {
      // 新しい視聴履歴を作成
      const { data, error } = await supabase
        .from('viewing_history')
        .insert([{
          user_id: user.id,
          movie_id: movieId,
          progress_time: progressTime,
          progress_percentage: progressPercentage,
          last_watched_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Viewing history creation error:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Record viewing history error:', error);
    throw error;
  }
};

// ユーザーの視聴履歴を取得
export const getUserViewingHistory = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // まず視聴履歴を取得
    const { data: historyData, error: historyError } = await supabase
      .from('viewing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false });

    if (historyError) {
      console.error('Get viewing history error:', historyError);
      return [];
    }

    if (!historyData || historyData.length === 0) {
      return [];
    }

    // 映画IDの配列を取得
    const movieIds = historyData.map(item => item.movie_id);

    // 映画情報を別途取得
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, description, image_id, video_id, category')
      .in('id', movieIds);

    if (moviesError) {
      console.error('Get movies error:', moviesError);
      // 映画情報が取得できなくても履歴データは返す
    }

    // 履歴データと映画データを結合
    const combinedData = historyData.map(historyItem => {
      const movieInfo = moviesData?.find(movie => movie.id === historyItem.movie_id);
      return {
        ...historyItem,
        movies: movieInfo || null
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Get viewing history service error:', error);
    return [];
  }
};

// 続きから視聴する映画を取得（進捗が5%以上95%未満）
export const getContinueWatchingMovies = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // まず視聴履歴を取得（進捗条件付き）
    const { data: historyData, error: historyError } = await supabase
      .from('viewing_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('progress_percentage', 5)  // 5%以上
      .lt('progress_percentage', 95)  // 95%未満
      .order('last_watched_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Get continue watching error:', historyError);
      return [];
    }

    if (!historyData || historyData.length === 0) {
      return [];
    }

    // 映画IDの配列を取得
    const movieIds = historyData.map(item => item.movie_id);

    // 映画情報を別途取得
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, description, image_id, video_id, category')
      .in('id', movieIds);

    if (moviesError) {
      console.error('Get movies error:', moviesError);
      // 映画情報が取得できなくても履歴データは返す
    }

    // 履歴データと映画データを結合
    const combinedData = historyData.map(historyItem => {
      const movieInfo = moviesData?.find(movie => movie.id === historyItem.movie_id);
      return {
        ...historyItem,
        movies: movieInfo || null
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Get continue watching service error:', error);
    return [];
  }
};

// 視聴履歴を削除
export const deleteViewingHistory = async (movieId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('viewing_history')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Delete viewing history error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete viewing history service error:', error);
    throw error;
  }
};

// 視聴完了をマーク（100%にする）
export const markAsWatched = async (movieId, duration = 0) => {
  try {
    return await recordViewingHistory(movieId, duration, duration);
  } catch (error) {
    console.error('Mark as watched error:', error);
    throw error;
  }
};

// 進捗時間をフォーマット
export const formatProgressTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

// 進捗パーセンテージをフォーマット
export const formatProgressPercentage = (percentage) => {
  return Math.round(percentage);
};
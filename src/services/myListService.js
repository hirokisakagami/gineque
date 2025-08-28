import { supabase } from '../config/supabase';

// マイリストに映画を追加
export const addToMyList = async (movieId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('my_list')
      .insert([{
        user_id: user.id,
        movie_id: movieId,
      }])
      .select()
      .single();

    if (error) {
      // 既に追加済みの場合のエラーハンドリング
      if (error.code === '23505') { // UNIQUE constraint violation
        throw new Error('この映画は既にマイリストに追加されています');
      }
      console.error('Add to my list error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Add to my list service error:', error);
    throw error;
  }
};

// マイリストから映画を削除
export const removeFromMyList = async (movieId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('my_list')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Remove from my list error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Remove from my list service error:', error);
    throw error;
  }
};

// 映画がマイリストに追加されているかチェック
export const isInMyList = async (movieId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('my_list')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Check my list error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Is in my list service error:', error);
    return false;
  }
};

// ユーザーのマイリストを取得
export const getMyList = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // まずマイリストを取得
    const { data: myListData, error: myListError } = await supabase
      .from('my_list')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (myListError) {
      console.error('Get my list error:', myListError);
      return [];
    }

    if (!myListData || myListData.length === 0) {
      return [];
    }

    // 映画IDの配列を取得
    const movieIds = myListData.map(item => item.movie_id);

    // 映画情報を別途取得
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, description, image_id, video_id, category')
      .in('id', movieIds);

    if (moviesError) {
      console.error('Get movies for my list error:', moviesError);
      // 映画情報が取得できなくてもマイリストデータは返す
    }

    // マイリストデータと映画データを結合
    const combinedData = myListData.map(listItem => {
      const movieInfo = moviesData?.find(movie => movie.id === listItem.movie_id);
      return {
        ...listItem,
        movies: movieInfo || null
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Get my list service error:', error);
    return [];
  }
};

// マイリストの映画数を取得
export const getMyListCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('my_list')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Get my list count error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get my list count service error:', error);
    return 0;
  }
};
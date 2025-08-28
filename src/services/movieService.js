import { supabase } from '../config/supabase';

// 映画データを取得（審査中の作品は除外）
export const getMovies = async (category = null) => {
  try {
    let query = supabase
      .from('movies')
      .select('*')
      .neq('category', '審査中') // 審査中の作品を除外
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Movies fetch error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Movies service error:', error);
    return [];
  }
};

// 映画を作成
export const createMovie = async (movieData) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .insert([movieData])
      .select()
      .single();

    if (error) {
      console.error('Movie creation error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Create movie error:', error);
    throw error;
  }
};

// ユーザー投稿作品を作成（Cloudflareアップロード用）
export const createUserMovie = async (movieData, userId, userRole = 'filmmaker') => {
  try {
    // 作品データにユーザー情報を追加
    const userMovieData = {
      ...movieData,
      created_by: userId,
      user_role: userRole,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating user movie with data:', userMovieData);

    const { data, error } = await supabase
      .from('movies')
      .insert([userMovieData])
      .select('*')
      .single();

    if (error) {
      console.error('User movie creation error:', error);
      throw error;
    }

    console.log('User movie created successfully:', data);
    return data;
  } catch (error) {
    console.error('Create user movie error:', error);
    throw error;
  }
};

// 自分の投稿作品を取得
export const getUserMovies = async () => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        *,
        profiles:created_by (
          nickname,
          user_role
        )
      `)
      .eq('created_by', supabase.auth.getUser().then(res => res.data.user?.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user movies error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('User movies fetch error:', error);
    return [];
  }
};

// 特定ユーザーの投稿作品を取得（審査中の作品は除外）
export const getMoviesByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('created_by', userId)
      .neq('category', '審査中') // 審査中の作品を除外
      .eq('status', 'published') // 公開済みのみ
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get movies by user error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Movies by user fetch error:', error);
    return [];
  }
};

// 映画を更新
export const updateMovie = async (id, updateData) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Movie update error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Update movie error:', error);
    throw error;
  }
};

// 映画を削除
export const deleteMovie = async (id) => {
  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Movie deletion error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete movie error:', error);
    throw error;
  }
};

// カテゴリ別映画取得（審査中の作品は除外）
export const getMoviesByCategory = async () => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .neq('category', '審査中') // 審査中の作品を除外
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Movies by category fetch error:', error);
      return {};
    }

    // カテゴリごとにグループ化
    const categorizedMovies = {};
    (data || []).forEach(movie => {
      const category = movie.category || 'おすすめ';
      if (!categorizedMovies[category]) {
        categorizedMovies[category] = [];
      }
      categorizedMovies[category].push(movie);
    });

    return categorizedMovies;
  } catch (error) {
    console.error('Movies by category service error:', error);
    return {};
  }
};

// 映画を検索（部分一致、審査中の作品は除外）
export const searchMovies = async (searchQuery) => {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', `%${searchQuery.trim()}%`)
      .neq('category', '審査中') // 審査中の作品を除外
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Movie search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Search movies service error:', error);
    return [];
  }
};

// サンプルデータ投入
export const insertSampleMovies = async () => {
  const sampleMovies = [
    {
      title: '魔法学校',
      description: '魔法使いの少年が魔法学校で冒険する物語',
      image_id: '06e7c5e1-4ff2-45a1-b682-595a1ba91400',
      video_id: 'sample-video-id-2',
      category: 'あなたにおすすめ'
    },
    {
      title: 'マイクを止めるな',
      description: '低予算で制作されたゾンビ映画の撮影現場で巻き起こる予期せぬ出来事',
      image_id: '3b91e694-0008-4ec9-c7e2-2d749f6b4b00',
      video_id: 'sample-video-id-1',
      category: 'フィーチャー'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('movies')
      .insert(sampleMovies)
      .select();

    if (error) {
      console.error('Sample movies insertion error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Insert sample movies error:', error);
    throw error;
  }
};
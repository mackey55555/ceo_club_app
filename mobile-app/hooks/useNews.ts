import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { News } from '../types';

export function useNews() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // 公開済みのお知らせを取得
      const { data, error: fetchError } = await supabase
        .from('news')
        .select('*')
        .eq('status_id', '00000000-0000-0000-0000-000000000102') // published
        .or('publish_at.is.null,publish_at.lte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNews(data as News[]);
    } catch (err: any) {
      setError(err.message || 'お知らせの取得に失敗しました');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  return { news, loading, error, refetch: fetchNews };
}


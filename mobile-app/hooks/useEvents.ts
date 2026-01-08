import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // 公開済みのイベントを取得
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('status_id', '00000000-0000-0000-0000-000000000202') // published
        .or('publish_at.is.null,publish_at.lte.' + new Date().toISOString())
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      setEvents(data as Event[]);
    } catch (err: any) {
      setError(err.message || 'イベントの取得に失敗しました');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, refetch: fetchEvents };
}


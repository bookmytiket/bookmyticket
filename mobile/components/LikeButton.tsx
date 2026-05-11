import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Pressable, View, Text, Vibration } from 'react-native';
import { Heart } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';

interface LikeButtonProps {
  itemId: string;
  type: 'event' | 'service';
  initialCount?: number;
  size?: number;
  showCount?: boolean;
}

export interface LikeButtonRef {
  toggleLike: () => void;
  isLiked: boolean;
}

const LikeButton = forwardRef<LikeButtonRef, LikeButtonProps>(({ itemId, type, initialCount = 0, size = 20, showCount = true }, ref) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    toggleLike: () => {
      if (!liked) toggleLike();
    },
    isLiked: liked
  }));

  // Fetch initial like state and count
  useEffect(() => {
    if (!itemId) return;

    const fetchLikeState = async () => {
      // Fetch total count from the cached table
      const countTable = type === 'event' ? 'event_like_counts' : 'service_like_counts';
      const idColumn = type === 'event' ? 'event_id' : 'service_id';
      
      const { data: countData } = await supabase
        .from(countTable)
        .select('total_likes')
        .eq(idColumn, itemId)
        .single();
      
      if (countData) setCount(countData.total_likes);

      // Check if current user liked it
      if (user) {
        const likeTable = type === 'event' ? 'event_likes' : 'service_likes';
        const { data: likeData } = await supabase
          .from(likeTable)
          .select('id')
          .eq(idColumn, itemId)
          .eq('user_id', user.id)
          .single();
        
        setLiked(!!likeData);
      }
    };

    fetchLikeState();

    // Subscribe to realtime count updates
    const countTable = type === 'event' ? 'event_like_counts' : 'service_like_counts';
    const idColumn = type === 'event' ? 'event_id' : 'service_id';
    
    const channel = supabase
      .channel(`count-${type}-${itemId}-${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: countTable,
        filter: `${idColumn}=eq.${itemId}`
      }, (payload) => {
        setCount(payload.new.total_likes);
      })
      .subscribe();

    // 2. Subscribe to individual like changes to sync heart color
    let likeSubscription = null;
    if (user) {
      const likeTable = type === 'event' ? 'event_likes' : 'service_likes';
      likeSubscription = supabase
        .channel(`user-likes-${type}-${itemId}-${user.id}-${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: likeTable,
          filter: `user_id=eq.${user.id} AND ${idColumn}=eq.${itemId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') setLiked(true);
          if (payload.eventType === 'DELETE') setLiked(false);
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
      if (likeSubscription) supabase.removeChannel(likeSubscription);
    };
  }, [itemId, type, user]);

  const toggleLike = useCallback(async () => {
    if (!user) {
      // Handle guest like attempt (maybe show login alert)
      return;
    }

    const likeTable = type === 'event' ? 'event_likes' : 'service_likes';
    const idColumn = type === 'event' ? 'event_id' : 'service_id';

    // Optimistic Update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    setIsAnimating(true);
    
    if (newLiked) Vibration.vibrate(10); // Subtle haptic

    try {
      if (newLiked) {
        await supabase
          .from(likeTable)
          .insert({ [idColumn]: itemId, user_id: user.id });
      } else {
        await supabase
          .from(likeTable)
          .delete()
          .eq(idColumn, itemId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error('Like toggle failed:', error);
    } finally {
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [liked, user, itemId, type]);

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleLike} style={styles.button}>
        <MotiView
          animate={{
            scale: isAnimating && liked ? [1, 1.5, 1] : 1,
          }}
          transition={{
            type: 'spring',
            damping: 10,
            stiffness: 200,
          }}
        >
          <Heart 
            size={size} 
            color={liked ? '#f844a4' : '#64748b'} 
            fill={liked ? '#f844a4' : 'transparent'} 
          />
        </MotiView>
        
        {/* Floating Heart Effect */}
        <AnimatePresence>
          {isAnimating && liked && (
            <MotiView
              from={{ opacity: 1, translateY: 0, scale: 1 }}
              animate={{ opacity: 0, translateY: -40, scale: 1.5 }}
              exit={{ opacity: 0 }}
              style={styles.floatingHeart}
            >
              <Heart size={size * 0.8} color="#f844a4" fill="#f844a4" />
            </MotiView>
          )}
        </AnimatePresence>
      </Pressable>
      
      {showCount && (
        <Text style={[styles.count, { color: liked ? '#f844a4' : '#64748b' }]}>
          {count > 0 ? count : ''}
        </Text>
      )}
    </View>
  );
});

export default LikeButton;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    position: 'relative',
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 10,
  },
  floatingHeart: {
    position: 'absolute',
    top: 0,
    left: 6,
    zIndex: 10,
  }
});

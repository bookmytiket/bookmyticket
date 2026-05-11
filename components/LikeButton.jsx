"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

const LikeButton = ({ itemId, type, initialCount = 0, size = 20, showCount = true }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchLikeState = async () => {
      // Fetch total count
      const countTable = type === 'event' ? 'event_like_counts' : 'service_like_counts';
      const idColumn = type === 'event' ? 'event_id' : 'service_id';
      
      const { data: countData } = await supabase
        .from(countTable)
        .select('total_likes')
        .eq(idColumn, itemId)
        .single();
      
      if (countData) setCount(countData.total_likes);

      // Check if user liked
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

    // Realtime subscription
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

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      // Trigger login modal or alert
      return;
    }

    const likeTable = type === 'event' ? 'event_likes' : 'service_likes';
    const idColumn = type === 'event' ? 'event_id' : 'service_id';

    const newLiked = !liked;
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    setIsAnimating(true);

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
      setLiked(!newLiked);
      setCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error('Like toggle failed:', error);
    } finally {
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  return (
    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={toggleLike}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`relative p-2 rounded-full transition-colors ${
          liked ? 'bg-pink-50' : 'bg-gray-100 group-hover:bg-gray-200'
        }`}
      >
        <Heart 
          size={size} 
          className={`transition-all ${
            liked ? 'fill-pink-500 text-pink-500' : 'text-gray-500'
          }`}
        />
        
        <AnimatePresence>
          {isAnimating && liked && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -25, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart size={size * 0.8} className="fill-pink-500 text-pink-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {showCount && (
        <span className={`text-xs font-bold ${liked ? 'text-pink-500' : 'text-gray-500'}`}>
          {count > 0 ? count.toLocaleString() : ''}
        </span>
      )}
    </div>
  );
};

export default LikeButton;

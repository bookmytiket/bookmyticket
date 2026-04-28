"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EMOJIS = ['❤️', '🔥', '🎉', '😂', '😍', '✨', '🚀', '⭐', '🎈', '🎁', '🎟️', '🎵', '🎸', '🏟️', '⚡'];

const EmojiBackground = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Generate random positions only on the client
    const newItems = Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: `${Math.random() * 105 - 5}%`,
      top: `${Math.random() * 105 - 5}%`,
      size: Math.random() * (40 - 18) + 18,
      duration: Math.random() * (20 - 10) + 10,
      delay: Math.random() * 10,
      driftX: Math.random() * 40 - 20,
      driftY: Math.random() * 40 - 20,
    }));
    setItems(newItems);
  }, []);

  return (
    <div 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none', 
        zIndex: 0,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        opacity: 0.8
      }}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          style={{
            position: 'absolute',
            left: item.left,
            top: item.top,
            fontSize: `${item.size}px`,
            filter: 'opacity(0.6)',
            userSelect: 'none',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
      
      {/* Subtle overlay to soften the background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(248, 250, 252, 0.4) 100%)' }} />
    </div>
  );
};

export default EmojiBackground;

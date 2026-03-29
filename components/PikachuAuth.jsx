"use client";
import React from "react";
import { motion } from "framer-motion";

const PikachuAuth = ({ focusedField, showPassword }) => {
  const isHiding = focusedField === "password" && !showPassword;
  const isPeeking = focusedField === "password" && showPassword;
  const isLooking = focusedField === "username";

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "-10px", marginTop: "10px" }}>
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Pikachu Ears */}
        {/* Left Ear */}
        <motion.path
          d="M30 35 L15 5 L25 10 Z"
          fill="#FFD700"
          stroke="#000"
          strokeWidth="1.5"
          animate={{ rotate: isHiding ? -10 : 0, transition: { duration: 0.3 } }}
        />
        <path d="M15 5 L18 8 L22 10 Z" fill="#000" /> {/* Tail tip style black point */}

        {/* Right Ear */}
        <motion.path
          d="M70 35 L85 5 L75 10 Z"
          fill="#FFD700"
          stroke="#000"
          strokeWidth="1.5"
          animate={{ rotate: isHiding ? 10 : 0, transition: { duration: 0.3 } }}
        />
        <path d="M85 5 L82 8 L78 10 Z" fill="#000" />

        {/* Pikachu Body/Head */}
        <ellipse cx="50" cy="65" rx="35" ry="32" fill="#FFD700" stroke="#000" strokeWidth="2" />

        {/* Red Cheeks */}
        <circle cx="28" cy="72" r="6" fill="#FF0000" />
        <circle cx="72" cy="72" r="6" fill="#FF0000" />

        {/* Eyes (Hideable) */}
        <motion.g
          animate={{
            opacity: isHiding ? 0 : 1,
            scaleY: isLooking ? 1.2 : 1,
            transition: { duration: 0.2 }
          }}
        >
          {/* Left Eye */}
          <circle cx="38" cy="58" r="3.5" fill="#000" />
          <circle cx="39" cy="57" r="1.2" fill="#FFF" />
          
          {/* Right Eye */}
          <circle cx="62" cy="58" r="3.5" fill="#000" />
          <circle cx="63" cy="57" r="1.2" fill="#FFF" />
        </motion.g>

        {/* Peeking Eyes (Only when showing password) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: isPeeking ? 1 : 0 }}>
          <path d="M35 58 Q38 55 41 58" stroke="#000" strokeWidth="1.5" fill="none" />
          <path d="M59 58 Q62 55 65 58" stroke="#000" strokeWidth="1.5" fill="none" />
        </motion.g>

        {/* Mouth */}
        <motion.path
          d="M46 72 Q50 75 54 72"
          stroke="#000"
          strokeWidth="1.5"
          fill="none"
          animate={{
            d: isHiding ? "M47 73 Q50 72 53 73" : "M46 72 Q50 75 54 72",
            transition: { duration: 0.3 }
          }}
        />

        {/* Nose */}
        <circle cx="50" cy="68" r="1" fill="#000" />

        {/* Hands/Paws (Hide Activity) */}
        {/* Left Hand */}
        <motion.path
          d="M25 85 Q20 80 25 75"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="#FFD700"
          animate={{
            x: isHiding ? 10 : (isPeeking ? 5 : 0),
            y: isHiding ? -25 : (isPeeking ? -15 : 0),
            rotate: isHiding ? 45 : (isPeeking ? 25 : 0),
            transition: { type: "spring", damping: 10 }
          }}
        />

        {/* Right Hand */}
        <motion.path
          d="M75 85 Q80 80 75 75"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="#FFD700"
          animate={{
            x: isHiding ? -10 : (isPeeking ? -5 : 0),
            y: isHiding ? -25 : (isPeeking ? -15 : 0),
            rotate: isHiding ? -45 : (isPeeking ? -25 : 0),
            transition: { type: "spring", damping: 10 }
          }}
        />

      </svg>
    </div>
  );
};

export default PikachuAuth;

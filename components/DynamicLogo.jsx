"use client";
import React from 'react';
import { motion } from 'framer-motion';

const DynamicLogo = ({ size = 70, color = "#000", animated = true }) => {
    const scale = size / 70;
    
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.2
            }
        }
    };

    const letterDrop = {
        hidden: { y: -100, opacity: 0, rotate: -15, scale: 0.5 },
        visible: {
            y: 0,
            opacity: 1,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200
            }
        }
    };

    const phoneThrow = {
        hidden: { x: -30, y: 30, opacity: 0, rotate: -30, scale: 0 },
        visible: {
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring",
                damping: 15,
                stiffness: 150,
                delay: 0.4
            }
        }
    };

    const textStyle = {
        fontSize: `${36 * scale}px`,
        fontWeight: "normal",
        fontFamily: "'Gochi Hand', cursive",
        color: color,
        display: "inline-block",
        lineHeight: 1
    };

    const renderLetters = (text) => {
        return text.split("").map((char, i) => (
            <motion.span
                key={i}
                variants={animated ? letterDrop : {}}
                style={{ ...textStyle, display: "inline-block" }}
            >
                {char}
            </motion.span>
        ));
    };

    return (
        <div style={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap');
            ` }} />
            
            <motion.div
                initial="hidden"
                animate="visible"
                variants={container}
                style={{ display: "flex", alignItems: "center", gap: `${2 * scale}px` }}
            >
                {/* "book" */}
                <div style={{ display: "flex", gap: `${1 * scale}px`, paddingRight: `${4 * scale}px` }}>
                    {renderLetters("book")}
                </div>

                {/* Phone Icon Wrapper */}
                <motion.div
                    variants={animated ? phoneThrow : {}}
                    style={{ 
                        position: "relative", 
                        width: `${32 * scale}px`, 
                        height: `${58 * scale}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: `0 ${2 * scale}px`
                    }}
                >
                    {/* Phone Body */}
                    <svg width={32 * scale} height={58 * scale} viewBox="0 0 32 58" fill="none" style={{ overflow: "visible" }}>
                        {/* 3 lines above top right */}
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                            <path d="M26 4L30 -2" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <path d="M32 8L38 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
                            <path d="M34 14L42 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
                        </motion.g>

                        {/* Phone Main Body */}
                        <rect x="1" y="1" width="30" height="56" rx="6" stroke={color} strokeWidth="2.5" />
                        
                        {/* Notch Area */}
                        <path d="M12 2H20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                        
                        {/* Bottom Home Indicator Line */}
                        <path d="M10 54H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    </svg>

                    {/* "my" inside phone - centered in top half */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 0.4 }}
                        style={{
                            position: "absolute",
                            top: "12px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <div style={{
                            fontSize: `${14 * scale}px`,
                            fontFamily: "'Gochi Hand', cursive",
                            color: color,
                            border: `1.5px solid ${color}`,
                            padding: `${1 * scale}px ${3 * scale}px`,
                            borderRadius: `${3 * scale}px`,
                            transform: "rotate(-5deg)",
                            lineHeight: 1
                        }}>
                            my
                        </div>
                    </motion.div>

                    {/* Ticket icon inside phone - centered in bottom half */}
                    <motion.div
                         initial={{ y: 5, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 1.4 }}
                         style={{ 
                            position: "absolute", 
                            bottom: "10px", 
                            left: "50%",
                            transform: "translateX(-50%) rotate(5deg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <svg width={20 * scale} height={14 * scale} viewBox="0 0 24 16" fill="none">
                            <rect x="1" y="1" width="22" height="14" rx="2" stroke={color} strokeWidth="2" />
                            <path d="M7 1V4" stroke={color} strokeWidth="1.5" />
                            <path d="M7 12V15" stroke={color} strokeWidth="1.5" />
                            <path d="M17 1V4" stroke={color} strokeWidth="1.5" />
                            <path d="M17 12V15" stroke={color} strokeWidth="1.5" />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* "ticket" */}
                <div style={{ display: "flex", gap: `${1 * scale}px`, paddingLeft: `${4 * scale}px` }}>
                    {renderLetters("ticket")}
                </div>
            </motion.div>
        </div>
    );
};

export default DynamicLogo;

"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger" // 'danger' | 'warning' | 'info'
}) {
    const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");

    const colors = {
        danger: {
            bg: "bg-gradient-to-r from-[#f84464] to-[#c026d3]",
            text: "text-[#f84464]",
            border: "border-[#f84464]/20",
            shadow: "shadow-[#f84464]/20"
        },
        branding: {
            bg: "bg-gradient-to-r from-[#f84464] to-[#c026d3]",
            text: "text-[#f84464]",
            border: "border-[#f84464]/20",
            shadow: "shadow-[#f84464]/20"
        },
        warning: {
            bg: "bg-amber-500",
            text: "text-amber-500",
            border: "border-amber-500/20",
            shadow: "shadow-amber-500/20"
        },
        info: {
            bg: "bg-blue-500",
            text: "text-blue-500",
            border: "border-blue-500/20",
            shadow: "shadow-blue-500/20"
        }
    };

    const currentColors = colors[type] || colors.danger;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900`}
                    >
                        <div className="flex flex-col items-center text-center">
                            {/* Icon Wrapper */}
                            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${currentColors.bg} bg-opacity-10 ${currentColors.text}`}>
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="mb-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                                {title}
                            </h3>
                            <p className="mb-8 text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {message}
                            </p>

                            <div className="flex w-full gap-4">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 rounded-2xl ${currentColors.bg} px-6 py-4 text-sm font-black text-white shadow-lg ${currentColors.shadow} transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Close Button X */}
                        <button
                            onClick={onCancel}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

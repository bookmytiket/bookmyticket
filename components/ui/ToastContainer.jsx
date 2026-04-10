'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={20} />,
        error: <XCircle className="text-rose-500" size={20} />,
        info: <Info className="text-sky-500" size={20} />
    };

    const backgrounds = {
        success: 'from-emerald-50/90 to-emerald-100/90 border-emerald-200',
        error: 'from-rose-50/90 to-rose-100/90 border-rose-200',
        info: 'from-sky-50/90 to-sky-100/90 border-sky-200'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 p-4 pr-12 rounded-2xl shadow-lg border backdrop-blur-md bg-gradient-to-br min-w-[300px] relative overflow-hidden ${backgrounds[toast.type] || backgrounds.info}`}
        >
            <div className="flex-shrink-0 bg-white/50 p-2 rounded-xl border border-white/80 shadow-sm">
                {icons[toast.type] || icons.info}
            </div>
            
            <div className="flex-grow">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                    {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice'}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                    {toast.message}
                </p>
            </div>

            <button 
                onClick={() => onRemove(toast.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
            >
                <X size={16} />
            </button>

            {/* Progress Bar Decorator */}
            <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3.5, ease: "linear" }}
                className={`absolute bottom-0 left-0 right-0 h-1 origin-left ${
                    toast.type === 'success' ? 'bg-emerald-500/30' : 
                    toast.type === 'error' ? 'bg-rose-500/30' : 
                    'bg-sky-500/30'
                }`}
            />
        </motion.div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-8 right-8 z-[9999999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;

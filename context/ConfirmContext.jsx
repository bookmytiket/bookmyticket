"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [config, setConfig] = useState(null);

    const confirm = useCallback((title, message, options = {}) => {
        return new Promise((resolve) => {
            setConfig({
                title,
                message,
                options,
                resolve
            });
        });
    }, []);

    const handleConfirm = () => {
        const resolve = config.resolve;
        setConfig(null);
        resolve(true);
    };

    const handleCancel = () => {
        const resolve = config.resolve;
        setConfig(null);
        resolve(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {config && (
                <ConfirmDialog
                    isOpen={!!config}
                    title={config.title}
                    message={config.message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    {...config.options}
                />
            )}
        </ConfirmContext.Provider>
    );
};

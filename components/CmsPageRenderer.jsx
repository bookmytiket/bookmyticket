"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Head from "next/head";
import ReactMarkdown from "react-markdown";
import Footer from "@/components/Footer";

export default function CmsPageRenderer({ pageKey, defaultTitle }) {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("cms_pages")
                    .select("*")
                    .eq("page_key", pageKey)
                    .eq("status", "published")
                    .maybeSingle();

                if (data) {
                    setPageData(data);
                }
            } catch (err) {
                console.error("Failed to load page content", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [pageKey]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 uppercase">Page Not Found</h1>
                    <p className="text-slate-500">The content you are looking for is currently unavailable.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Head>
                <title>{pageData.page_title} - BookMyTicket</title>
                <meta name="description" content={pageData.page_content?.substring(0, 160) || ""} />
            </Head>
            <div className="max-w-6xl mx-auto pt-36 pb-24 px-6 md:px-12">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-12 capitalize tracking-tight text-center">
                    {pageData.page_title}
                </h1>
                <div className="prose prose-slate prose-pink max-w-none md:prose-lg prose-headings:font-bold prose-headings:text-slate-900 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 prose-p:font-medium prose-p:leading-loose prose-a:text-pink-600 prose-a:font-bold hover:prose-a:text-pink-700">
                    <ReactMarkdown>
                        {pageData.page_content}
                    </ReactMarkdown>
                </div>
            </div>
            <Footer />
        </div>
    );
}

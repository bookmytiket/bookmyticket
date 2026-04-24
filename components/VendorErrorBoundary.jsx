"use client";

import React from "react";

/**
 * Convex useQuery throws when the server returns a query error (missing function,
 * schema mismatch, etc.). This boundary keeps the vendor shell usable and shows a retry UI.
 */
export default class VendorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetNonce: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[VendorErrorBoundary]", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({
      error: null,
      resetNonce: s.resetNonce + 1,
    }));
  };

  render() {
    if (this.state.error) {
      const msg =
        this.state.error?.message ||
        "Vendor data could not be loaded. Please refresh the page or check your connection.";
      return (
        <div className="max-w-lg mx-auto rounded-[2rem] border border-red-500/30 bg-red-500/10 p-10 text-center space-y-6">
          <div className="text-red-400 text-sm font-bold uppercase tracking-widest">
            Something went wrong
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{msg}</p>
          <p className="text-slate-500 text-xs">
            This module is powered by our real-time database. If the issue persists, please contact support or try again later.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-stretch sm:items-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="w-full sm:w-auto min-w-[10rem] px-6 py-3 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-colors whitespace-nowrap"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/organiser";
              }}
              className="w-full sm:w-auto min-w-[10rem] px-6 py-3 rounded-xl border border-slate-600 text-slate-300 text-xs font-bold uppercase tracking-widest hover:border-pink-500 hover:text-pink-400 transition-colors whitespace-nowrap"
            >
              Vendor Panel
            </button>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetNonce}>{this.props.children}</React.Fragment>
    );
  }
}

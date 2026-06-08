"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa_install_dismissed_until";

export function PwaInstallBanner() {
    const [promptEvent, setPromptEvent] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Already installed as standalone — don't show
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        // User dismissed recently — don't show
        const until = localStorage.getItem(DISMISS_KEY);
        if (until && Date.now() < Number(until)) return;

        // If the event already fired before our listener attached (cached by browser),
        // it won't re-fire on refresh. Listen for it.
        const handler = (e) => {
            e.preventDefault(); // stop Chrome mini-infobar
            setPromptEvent(e);
            setVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    if (!visible || !promptEvent) return null;

    async function install() {
        try {
            promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;
            if (outcome === "accepted") setVisible(false);
        } catch {
            setVisible(false);
        }
    }

    function dismiss() {
        setVisible(false);
        // Don't show again for 7 days
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }

    return (
        <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 sm:bottom-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-white shadow-xl shadow-blue-900/10 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl cricket-gradient flex items-center justify-center shadow-sm">
                        <span className="text-xl">🏏</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-tight">Install CricketApp</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                            Add to home screen for faster access &amp; live alerts
                        </p>
                    </div>
                    <button
                        onClick={dismiss}
                        className="shrink-0 -mr-1 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                        aria-label="Dismiss"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
                <div className="border-t border-gray-100 flex">
                    <button
                        onClick={dismiss}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Not now
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                        onClick={install}
                        className="flex-1 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}

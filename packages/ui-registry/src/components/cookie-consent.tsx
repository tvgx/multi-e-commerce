"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user already gave consent
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookie-consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-sm text-foreground">
                <p>
                    We use cookies to improve your experience on our platform, analyze traffic, and ensure security. By continuing to use our site, you agree to our use of cookies.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={acceptCookies}
                    className="whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Accept & Continue
                </button>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

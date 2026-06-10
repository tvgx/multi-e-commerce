'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PreviewContextType {
    isPreview: boolean;
    globalComponents: any[] | null;
    theme: any | null;
    pageComponents: any[] | null;
}

const PreviewContext = createContext<PreviewContextType>({
    isPreview: false,
    globalComponents: null,
    theme: null,
    pageComponents: null,
});

export const usePreview = () => useContext(PreviewContext);

export function StorefrontPreviewProvider({ children }: { children: React.ReactNode }) {
    // Read the preview flag from window.location instead of useSearchParams():
    // this provider wraps every storefront page, and useSearchParams without a
    // Suspense boundary opts the whole route out of static/ISR rendering.
    // Preview mode only exists inside the builder iframe, so detecting it
    // after hydration is fine.
    const [isPreview, setIsPreview] = useState(false);

    const [globalComponents, setGlobalComponents] = useState<any[] | null>(null);
    const [theme, setTheme] = useState<any | null>(null);
    const [pageComponents, setPageComponents] = useState<any[] | null>(null);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('preview') === 'true') {
            setIsPreview(true);
        }
    }, []);

    useEffect(() => {
        if (!isPreview) return;

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data?.type === 'BUILDER_UPDATE' && data.payload) {
                setGlobalComponents(data.payload.globalComponents || null);
                setTheme(data.payload.theme || null);
                if (data.payload.pages && data.payload.pages['home']) {
                    setPageComponents(data.payload.pages['home']);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isPreview]);

    useEffect(() => {
        if (!isPreview) return;
        const handleClick = (e: MouseEvent) => {
            const link = (e.target as HTMLElement).closest('a');
            if (link) {
                e.preventDefault(); // Block navigation trong preview
                e.stopPropagation();
            }
        };
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [isPreview]);

    return (
        <PreviewContext.Provider value={{ isPreview, globalComponents, theme, pageComponents }}>
            {children}
        </PreviewContext.Provider>
    );
}

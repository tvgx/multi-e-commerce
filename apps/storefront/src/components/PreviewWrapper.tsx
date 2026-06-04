'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DynamicRenderer } from '@/lib/layout/dynamic-loader';

interface PreviewWrapperProps {
    children: React.ReactNode;
    initialGlobalComponents: any[];
    initialTheme: any;
}

export function PreviewWrapper({ children, initialGlobalComponents, initialTheme }: PreviewWrapperProps) {
    const searchParams = useSearchParams();
    const isPreview = searchParams?.get('preview') === 'true';

    const [globalComponents, setGlobalComponents] = useState(initialGlobalComponents);
    const [theme, setTheme] = useState(initialTheme);
    const [pageComponents, setPageComponents] = useState<any[] | null>(null);

    useEffect(() => {
        if (!isPreview) return;

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data?.type === 'BUILDER_UPDATE' && data.payload) {
                setGlobalComponents(data.payload.globalComponents || initialGlobalComponents);
                setTheme(data.payload.theme || initialTheme);
                if (data.payload.pages && data.payload.pages['home']) {
                    setPageComponents(data.payload.pages['home']);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isPreview, initialGlobalComponents, initialTheme]);

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

    if (!isPreview) {
        return <>{children}</>;
    }

    const headerComps = globalComponents.filter((c: any) => c.componentId.toLowerCase().includes('header'));
    const footerComps = globalComponents.filter((c: any) => c.componentId.toLowerCase().includes('footer'));

    return (
        <div 
            className="flex flex-col min-h-screen preview-mode storefront-layout-wrapper"
            style={{
                '--theme-primary': theme?.primaryColor || '#000',
                fontFamily: theme?.fontFamily || 'Inter, sans-serif',
            } as React.CSSProperties}
        >
            {headerComps.length > 0 && (
                <div>
                    <DynamicRenderer components={headerComps} />
                </div>
            )}
            
            <main className="flex-1">
                {pageComponents ? (
                    <DynamicRenderer components={pageComponents} />
                ) : (
                    children
                )}
            </main>

            {footerComps.length > 0 && (
                <div>
                    <DynamicRenderer components={footerComps} />
                </div>
            )}
        </div>
    );
}

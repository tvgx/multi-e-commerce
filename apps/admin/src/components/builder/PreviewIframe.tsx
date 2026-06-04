'use client';

import React, { useEffect, useRef } from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';

export function PreviewIframe({ shopId }: { shopId: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { pages, theme, globalComponents, deviceMode } = useBuilderStore();

    // Send state to iframe whenever it changes
    useEffect(() => {
        if (!iframeRef.current?.contentWindow) return;

        const message = {
            type: 'BUILDER_UPDATE',
            payload: {
                pages,
                theme,
                globalComponents
            }
        };

        iframeRef.current.contentWindow.postMessage(message, '*');
    }, [pages, theme, globalComponents]);

    return (
        <div 
            className={`transition-all duration-300 ease-in-out bg-white rounded-xl overflow-hidden shadow-2xl border border-white/10 ${
                deviceMode === 'mobile' 
                    ? 'w-[375px] h-[812px]' // iPhone X dimensions
                    : 'w-full h-full'
            }`}
        >
            <iframe 
                ref={iframeRef}
                src={`http://localhost:3001/${shopId}?preview=true`}
                className="w-full h-full border-0 bg-white"
                title="Storefront Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
        </div>
    );
}

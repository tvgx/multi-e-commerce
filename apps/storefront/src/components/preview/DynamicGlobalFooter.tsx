'use client';

import React from 'react';
import { usePreview } from './StorefrontPreviewProvider';
import { DynamicRenderer } from '@/lib/layout/dynamic-loader';

interface DynamicGlobalFooterProps {
    children: React.ReactNode;
    initialComponents: any[];
}

export function DynamicGlobalFooter({ children, initialComponents }: DynamicGlobalFooterProps) {
    const { isPreview, globalComponents } = usePreview();

    const comps = (isPreview && globalComponents) ? globalComponents : initialComponents;
    const footerComps = comps?.filter(c => c.componentId.toLowerCase().includes('footer')) || [];

    if (footerComps.length > 0) {
        return <DynamicRenderer components={footerComps} />;
    }

    return <>{children}</>;
}

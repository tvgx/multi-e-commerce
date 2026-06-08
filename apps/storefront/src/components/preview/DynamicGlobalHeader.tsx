'use client';

import React from 'react';
import { usePreview } from './StorefrontPreviewProvider';
import { DynamicRenderer } from '@/lib/layout/dynamic-loader';

interface DynamicGlobalHeaderProps {
    children: React.ReactNode;
    initialComponents: any[];
}

export function DynamicGlobalHeader({ children, initialComponents }: DynamicGlobalHeaderProps) {
    const { isPreview, globalComponents } = usePreview();

    const comps = (isPreview && globalComponents) ? globalComponents : initialComponents;
    const headerComps = comps?.filter(c => c.componentId.toLowerCase().includes('header')) || [];

    if (headerComps.length > 0) {
        return <DynamicRenderer components={headerComps} />;
    }

    return <>{children}</>;
}

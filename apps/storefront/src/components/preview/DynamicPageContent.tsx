'use client';

import React from 'react';
import { usePreview } from './StorefrontPreviewProvider';
import { DynamicRenderer } from '@/lib/layout/dynamic-loader';

interface DynamicPageContentProps {
    children: React.ReactNode;
}

export function DynamicPageContent({ children }: DynamicPageContentProps) {
    const { isPreview, pageComponents } = usePreview();

    if (isPreview && pageComponents) {
        return <DynamicRenderer components={pageComponents} />;
    }

    return <>{children}</>;
}

import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';

interface LargeLogoProps {
    logoUrl?: string;
    title?: string;
    shopName?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

export function LargeLogo({ logoUrl, title, shopName, backgroundColor, textColor, fontFamily }: LargeLogoProps) {
    const containerStyle = {
        backgroundColor: backgroundColor || '#ffffff',
        color: textColor || '#0f172a',
        fontFamily: fontFamily || 'inherit',
    };

    return (
        <section className="w-full py-24 md:py-40 flex items-center justify-center" style={containerStyle}>
            {logoUrl ? (
                <SmartImage
                    src={logoUrl}
                    fallbackSrc={DEFAULT_IMG}
                    alt={shopName || title || 'Logo'}
                    className="max-h-48 max-w-[80%] object-contain"
                    sizes="80vw"
                    priority
                />
            ) : (
                <h1 className="text-[15vw] md:text-[8rem] font-black tracking-tighter uppercase leading-none drop-shadow-xl select-none text-center">
                    {title || shopName || 'BRAND'}
                </h1>
            )}
        </section>
    );
}

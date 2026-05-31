import React from 'react';

interface LargeLogoProps {
    title?: string;
    shopName?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

export function LargeLogo({ title, shopName, backgroundColor, textColor, fontFamily }: LargeLogoProps) {
    const containerStyle = {
        backgroundColor: backgroundColor || '#ffffff',
        color: textColor || '#0f172a',
        fontFamily: fontFamily || 'inherit',
    };

    return (
        <section className="w-full py-24 md:py-40 flex items-center justify-center" style={containerStyle}>
            <h1 className="text-[15vw] md:text-[8rem] font-black tracking-tighter uppercase leading-none drop-shadow-xl select-none text-center">
                {title || shopName || "BRAND"}
            </h1>
        </section>
    );
}

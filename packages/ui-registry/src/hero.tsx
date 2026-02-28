import React from 'react';

export interface HeroProps {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
}

export const Hero: React.FC<HeroProps> = ({ title, subtitle, backgroundImageUrl, ctaText, ctaLink }) => {
    return (
        <div className="relative w-full h-[500px] flex items-center justify-center bg-gray-900 text-white" style={{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined, backgroundSize: 'cover' }}>
            <div className="z-10 text-center p-8 bg-black bg-opacity-50 blur-sm rounded-lg backdrop-blur-md">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
                {subtitle && <p className="text-xl mb-6">{subtitle}</p>}
                {ctaText && ctaLink && (
                    <a href={ctaLink} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300">
                        {ctaText}
                    </a>
                )}
            </div>
        </div>
    );
};

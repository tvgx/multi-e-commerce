import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface CollectionListsBentoProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
}

export function CollectionListsBento({
    title,
    subtitle,
    backgroundImageUrl,
    backgroundColor,
    textColor,
}: CollectionListsBentoProps) {
    const featuredImg = backgroundImageUrl || DEFAULT_IMG;

    return (
        <section className="w-full py-20 px-4 md:px-12" style={{ backgroundColor: backgroundColor || '#f8fafc' }}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4" style={{ color: textColor || '#0f172a' }}>{title || 'Shop by Category'}</h2>
                    {subtitle && <p className="text-lg opacity-70" style={{ color: textColor || '#0f172a' }}>{subtitle}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
                    {/* Large Featured */}
                    <a href="#" className="relative md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden group">
                        <SmartImage
                            src={featuredImg}
                            alt="Women"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white text-3xl font-bold drop-shadow-md">Womenswear</div>
                    </a>

                    {/* Top Right */}
                    <a href="#" className="relative md:col-span-2 rounded-2xl overflow-hidden group">
                        <SmartImage
                            src={DEFAULT_IMG}
                            alt="Accessories"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white text-2xl font-bold drop-shadow-md">Accessories</div>
                    </a>

                    {/* Bottom Right 1 */}
                    <a href="#" className="relative rounded-2xl overflow-hidden group">
                        <SmartImage
                            src={DEFAULT_IMG}
                            alt="Beauty"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white text-xl font-bold drop-shadow-md">Beauty</div>
                    </a>

                    {/* Bottom Right 2 */}
                    <a href="#" className="relative rounded-2xl overflow-hidden group">
                        <SmartImage
                            src={DEFAULT_IMG}
                            alt="Mens"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white text-xl font-bold drop-shadow-md">Menswear</div>
                    </a>
                </div>
            </div>
        </section>
    );
}

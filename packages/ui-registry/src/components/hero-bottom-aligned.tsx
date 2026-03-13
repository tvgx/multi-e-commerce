

export interface HeroBottomAlignedProps {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
}

export const HeroBottomAligned: React.FC<HeroBottomAlignedProps> = ({ title, subtitle, backgroundImageUrl, ctaText, ctaLink }) => {
    const bgImage = backgroundImageUrl || '/hero-bg.png';
    return (
        <div
            className="relative w-full h-[600px] flex items-end justify-start bg-zinc-900 text-white p-8 md:p-16"
            style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0"></div>

            <div className="z-10 max-w-2xl">
                <p className="text-sm font-semibold tracking-widest text-zinc-300 uppercase mb-3">Introduced by</p>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 clash-display text-white">{title}</h1>
                {subtitle && <p className="text-lg md:text-xl mb-6 text-zinc-200">{subtitle}</p>}
                {ctaText && ctaLink && (
                    <a href={ctaLink} className="inline-block bg-white text-zinc-900 hover:bg-zinc-100 font-semibold py-3 px-8 rounded-full transition duration-300">
                        {ctaText}
                    </a>
                )}
            </div>
        </div>
    );
};

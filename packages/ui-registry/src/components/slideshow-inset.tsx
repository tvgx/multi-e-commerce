

export interface SlideshowInsetProps {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
}

export const SlideshowInset: React.FC<SlideshowInsetProps> = ({ title, subtitle, backgroundImageUrl, ctaText, ctaLink }) => {
    const bgImage = backgroundImageUrl || '/shapes-bg.png';
    return (
        <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div
                className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden flex items-center justify-start p-8 md:p-16 bg-zinc-100"
                style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="z-10 max-w-md">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 drop-shadow-sm">{title}</h2>
                    {subtitle && <p className="text-lg md:text-xl mb-6 text-zinc-800 font-medium drop-shadow-sm">{subtitle}</p>}
                    {ctaText && ctaLink && (
                        <a href={ctaLink} className="inline-block bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-8 rounded-full transition duration-300">
                            {ctaText}
                        </a>
                    )}
                </div>
                {/* Dots placeholder for slideshow */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <span className="block w-2.5 h-2.5 rounded-full bg-zinc-900"></span>
                    <span className="block w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                    <span className="block w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                </div>
            </div>
        </section>
    );
};

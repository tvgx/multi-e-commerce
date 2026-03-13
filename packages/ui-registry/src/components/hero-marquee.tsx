

export interface HeroMarqueeProps {
    marqueeText: string;
    backgroundImageUrl?: string;
}

export const HeroMarquee: React.FC<HeroMarqueeProps> = ({ marqueeText, backgroundImageUrl }) => {
    const bgImage = backgroundImageUrl || '/hero-bg.png';

    // Duplicate text a few times to ensure seamless infinite scroll visually
    const repeatedText = Array(10).fill(marqueeText).join(" • ");

    return (
        <div
            className="relative w-full h-[500px] flex items-center justify-center bg-zinc-900 text-white overflow-hidden"
            style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* The infinite marquee container */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap overflow-hidden z-10">
                <div className="inline-block animate-marquee mix-blend-difference opacity-90">
                    <h1 className="text-7xl md:text-9xl font-black uppercase text-white tracking-widest px-8">
                        {repeatedText}
                    </h1>
                </div>
            </div>

            {/* Small styling inline for animation or use tailwind config */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
            `}} />
        </div>
    );
};

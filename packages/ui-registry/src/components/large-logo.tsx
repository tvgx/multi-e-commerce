

export interface LargeLogoProps {
    text: string;
    subtext?: string;
}

export const LargeLogo: React.FC<LargeLogoProps> = ({ text, subtext }) => {
    return (
        <section className="w-full py-24 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-center px-4">
            {subtext && <p className="text-sm font-medium tracking-widest text-zinc-500 uppercase mb-4">{subtext}</p>}
            <h2 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">
                {text}
            </h2>
        </section>
    );
};

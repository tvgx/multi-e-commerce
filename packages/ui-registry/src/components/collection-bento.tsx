

export interface CollectionBentoItem {
    id: string;
    title: string;
    imageUrl?: string;
    link: string;
    colSpan?: 1 | 2;
    rowSpan?: 1 | 2;
}

export interface CollectionBentoProps {
    heading?: string;
    items: CollectionBentoItem[];
}

export const CollectionBento: React.FC<CollectionBentoProps> = ({ heading, items }) => {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {heading && <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 mb-8">{heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4">
                {items.map((item) => {
                    const colSpanClass = item.colSpan === 2 ? 'md:col-span-2' : 'col-span-1';
                    const rowSpanClass = item.rowSpan === 2 ? 'row-span-2' : 'row-span-1';
                    const bgImage = item.imageUrl || '/shapes-bg.png';

                    return (
                        <a
                            key={item.id}
                            href={item.link}
                            className={`group relative rounded-2xl overflow-hidden block ${colSpanClass} ${rowSpanClass} bg-zinc-100 flex items-end p-6 hover:shadow-lg transition duration-300`}
                        >
                            <div
                                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                            />
                            {/* Gradient Overlay for text readability */}
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                            <h3 className="relative z-20 text-xl md:text-2xl font-semibold text-white group-hover:underline underline-offset-4 decoration-2">
                                {item.title}
                            </h3>
                        </a>
                    );
                })}
            </div>
        </section>
    );
};

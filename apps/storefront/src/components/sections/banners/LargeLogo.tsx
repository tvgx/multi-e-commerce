import React from 'react';

export default function LargeLogo({ shopName }: { shopName?: string }) {
    return (
        <section className="w-full py-24 md:py-40 bg-white flex items-center justify-center">
            <h1 className="text-[15vw] md:text-[8rem] font-black text-slate-900 tracking-tighter uppercase leading-none drop-shadow-xl select-none">
                {shopName || "BRAND"}
            </h1>
        </section>
    );
}

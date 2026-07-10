import React from 'react';

/**
 * Injects a JSON-LD structured-data block. Server component — rendered inline
 * in the page so crawlers (Google rich results / product cards) see it on the
 * first HTML response. `data` is trusted, shop-derived content; we still escape
 * `<` to prevent breaking out of the <script> tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    return (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: json }}
        />
    );
}

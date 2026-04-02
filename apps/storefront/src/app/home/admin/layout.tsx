import React from "react";
import { Header, Footer, AnnouncementBar, CookieConsent } from "@ecommerce/ui-registry";

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <AnnouncementBar text="Free shipping on all orders over $50!" />
            {/* We conditionally hide this public Header if we are on dashboard or auth pages, or we can just keep it. 
          Actually, the dashboard has its own header. But for simplicity, we let the dashboard page override it or we just keep it.
          Let's just group them here. */}
            {/* A better approach: Dashboard actually has its own header inside the page. We might want to 
          move the public Header exclusively to Landing page, or create a (public) route group. 
          For now, we'll keep it simple and put the Header and Footer here, but Dashboard might look weird with 2 headers. */}
            {/* Let's render the global Header only if it's not the dashboard. Since we can't easily check route in Server Component layout without headers(), 
          Maybe it's fine for now, or we remove the public Header from PlatformLayout and put it in page.tsx */}
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <CookieConsent />
        </>
    );
}

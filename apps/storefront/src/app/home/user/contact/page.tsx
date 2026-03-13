export default function Contact() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-2xl">
            <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>
            <p className="text-lg text-muted-foreground text-center mb-12">
                We&apos;d love to hear from you. Please fill out the form below.
            </p>

            <form className="space-y-6 bg-card p-8 rounded-lg border shadow-sm">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                    <input type="text" id="name" className="w-full px-4 py-2 border rounded-md" placeholder="Your name" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="email" className="w-full px-4 py-2 border rounded-md" placeholder="you@example.com" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea id="message" rows={5} className="w-full px-4 py-2 border rounded-md" placeholder="How can we help?"></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                    Send Message
                </button>
            </form>
        </div>
    );
}

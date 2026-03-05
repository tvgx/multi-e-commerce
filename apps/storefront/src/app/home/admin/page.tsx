import React from "react";
import Link from "next/link";
import { Hero } from "@ecommerce/ui-registry"; // Reusing the generic Hero but customizing
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))]">
      {/* Hero Section */}
      <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-primary/5">
        <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl text-foreground">
              Build Your Dream Store. <span className="text-primary">No Coding Required.</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join thousands of creators who are launching their duck-tastic e-commerce empires today. Custom domains, drag-and-drop builder, and powerful analytics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Get Started for Free
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Learn More
            </Link>
          </div>

          {/* Main Duck Graphic / Dashboard Mockup Image */}
          <div className="w-full max-w-5xl mt-12 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
            {/* Mockup header */}
            <div className="h-8 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Mockup body */}
            <div className="aspect-[16/9] w-full bg-muted flex items-center justify-center relative">
              <img
                src="https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=1200&q=80"
                alt="Duck floating in water representing seamless experience"
                className="object-cover w-full h-full opacity-80 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent flex items-center justify-center">
                <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-xl border border-border">
                  <h3 className="text-2xl font-bold mb-2">Beautiful Duck Store Templates</h3>
                  <p className="text-muted-foreground">Select, customize, and launch in minutes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to paddle ahead</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform provides all the tools necessary out of the box so you can focus on building your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col p-6 space-y-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3 className="text-xl font-bold">No-Code Builder</h3>
              <p className="text-muted-foreground">Drag and drop components to create your perfect storefront without writing a single line of code.</p>
            </div>

            <div className="flex flex-col p-6 space-y-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>
              <h3 className="text-xl font-bold">Custom Domains</h3>
              <p className="text-muted-foreground">Claim your own corner of the internet with a free custom vanity domain for your store.</p>
            </div>

            <div className="flex flex-col p-6 space-y-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold">Seamless Payments</h3>
              <p className="text-muted-foreground">Accept payments instantly with our integrated payment gateway that scales with your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to make a splash?</h2>
          <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
            Start your free 14-day trial today. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-md bg-background px-8 text-sm font-bold text-primary shadow transition-colors hover:bg-muted"
          >
            Create Your Free Store
          </Link>
        </div>
      </section>
    </div>
  );
}

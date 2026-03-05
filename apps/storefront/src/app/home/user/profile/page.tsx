import React from 'react';
import { User, Package, Heart, Settings } from 'lucide-react';

export default function Profile() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                            JD
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">John Doe</h2>
                            <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                        </div>
                    </div>

                    <nav className="flex flex-col space-y-1">
                        <a href="#" className="flex items-center space-x-3 bg-muted px-4 py-3 rounded-md font-medium text-foreground">
                            <User className="h-5 w-5" />
                            <span>Personal Info</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 hover:bg-muted/50 px-4 py-3 rounded-md text-muted-foreground transition-colors">
                            <Package className="h-5 w-5" />
                            <span>Orders</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 hover:bg-muted/50 px-4 py-3 rounded-md text-muted-foreground transition-colors">
                            <Heart className="h-5 w-5" />
                            <span>Wishlist</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 hover:bg-muted/50 px-4 py-3 rounded-md text-muted-foreground transition-colors">
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                        </a>
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 bg-card rounded-lg border p-8">
                    <h3 className="text-2xl font-bold mb-6">Personal Information</h3>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">First Name</label>
                                <input type="text" defaultValue="John" className="w-full px-4 py-2 border rounded-md bg-background" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Last Name</label>
                                <input type="text" defaultValue="Doe" className="w-full px-4 py-2 border rounded-md bg-background" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <input type="email" defaultValue="john.doe@example.com" className="w-full px-4 py-2 border rounded-md bg-background" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Phone Number</label>
                                <input type="tel" defaultValue="+1 (555) 000-0000" className="w-full px-4 py-2 border rounded-md bg-background" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

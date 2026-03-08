import React from 'react';

export default function BuyerProfilePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Account</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="col-span-1 space-y-2">
                    <button className="w-full text-left px-4 py-2 bg-slate-100 font-medium rounded-lg text-emerald-600">Profile Details</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-lg">Order History</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-lg">Saved Addresses</button>
                    <button className="w-full text-left px-4 py-2 mt-4 text-red-500 hover:bg-red-50 rounded-lg">Sign Out</button>
                </aside>

                <div className="col-span-1 md:col-span-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                <input className="w-full border border-slate-300 rounded-lg px-4 py-2" defaultValue="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                <input className="w-full border border-slate-300 rounded-lg px-4 py-2" defaultValue="Doe" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-50" defaultValue="john.doe@example.com" disabled />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

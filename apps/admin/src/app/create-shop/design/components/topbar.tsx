"use client";

import { Save, ArrowLeft, Monitor, Smartphone, Undo2, Redo2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { useState } from "react";

export function Topbar({ onSave }: { onSave?: () => void }) {
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const { saveTemplate, deviceMode, setDeviceMode } = useBuilderStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await saveTemplate(shopId);
    setIsSaving(false);
    // You could also add a toast notification here
    if (onSave) onSave();
  };

  return (
    <div className="h-12 shrink-0 border-b border-gray-200 bg-white px-4 flex items-center justify-between z-10 text-gray-800 shadow-sm relative">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${shopId}/online-store/themes`} className="text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 p-1.5 rounded-md">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          Home page
          <span className="text-xs text-gray-400 font-normal">({shopId})</span>
        </div>
      </div>

      <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setDeviceMode('desktop')}
          className={`p-1.5 rounded-md transition-colors ${deviceMode === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setDeviceMode('mobile')}
          className={`p-1.5 rounded-md transition-colors ${deviceMode === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-3">
          <button className="p-1.5 text-gray-400 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors cursor-not-allowed opacity-50" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors cursor-not-allowed opacity-50" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          <Save className="w-4 h-4" /> {isSaving ? "Đang lưu..." : "Lưu nháp"}
        </button>
      </div>
    </div>
  );
}

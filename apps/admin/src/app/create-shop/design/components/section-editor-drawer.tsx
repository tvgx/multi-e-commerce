"use client";

import React from "react";
import { X, Type, Image as ImageIcon, Settings, Check } from "lucide-react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Playfair Display", "Lora", "Montserrat", 
  "Oswald", "Raleway", "Nunito", "Poppins", "Source Sans 3"
];

export function SectionEditorDrawer() {
  const { 
    isEditorOpen, 
    activeComponentId, 
    pendingProps, 
    closeSectionEditor, 
    commitPendingProps, 
    discardPendingProps,
    setPendingProp
  } = useBuilderStore();

  if (!isEditorOpen || !activeComponentId || !pendingProps) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[360px] bg-zinc-950 border-l border-white/10 shadow-2xl z-20 flex flex-col transform transition-transform duration-300 translate-x-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={discardPendingProps} className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white">Chỉnh sửa Section</span>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        {/* TEXT CONTENT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nội dung chữ</h3>
          
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Tiêu đề chính
              </span>
              <input 
                type="text" 
                value={(pendingProps.title as string) || ""}
                onChange={(e) => setPendingProp("title", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                placeholder="Nhập tiêu đề..."
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Phụ đề
              </span>
              <textarea 
                value={(pendingProps.subtitle as string) || ""}
                onChange={(e) => setPendingProp("subtitle", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow resize-none h-20"
                placeholder="Nhập phụ đề..."
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                Nút bấm (Text)
              </span>
              <input 
                type="text" 
                value={(pendingProps.ctaText as string) || ""}
                onChange={(e) => setPendingProp("ctaText", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                placeholder="Shop Now"
              />
            </label>
            
            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                Nút bấm (Link)
              </span>
              <input 
                type="text" 
                value={(pendingProps.ctaLink as string) || ""}
                onChange={(e) => setPendingProp("ctaLink", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                placeholder="/collections/all"
              />
            </label>
          </div>
        </div>

        {/* MEDIA */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hình ảnh</h3>
          
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Ảnh nền / Ảnh chính
              </span>
              {Boolean(pendingProps.backgroundImageUrl) && (
                <div className="mb-2 relative rounded-lg overflow-hidden border border-zinc-700 group h-32">
                  <img src={pendingProps.backgroundImageUrl as string} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPendingProp("backgroundImageUrl", "")}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={(pendingProps.backgroundImageUrl as string) || ""}
                  onChange={(e) => setPendingProp("backgroundImageUrl", e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                  placeholder="https://..."
                />
                <label className="shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
                  Upload
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real app, upload to MinIO here. For now, use FileReader for preview.
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setPendingProp("backgroundImageUrl", event.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </label>
          </div>
        </div>

        {/* TYPOGRAPHY */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Typography</h3>
          <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 block">Font chữ</span>
              <select 
                value={(pendingProps.fontFamily as string) || "Inter"}
                onChange={(e) => setPendingProp("fontFamily", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {GOOGLE_FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
          </label>
        </div>

        {/* COLORS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Màu sắc</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Nền
              </span>
              <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
                <input 
                  type="color" 
                  value={(pendingProps.backgroundColor as string) || "#ffffff"}
                  onChange={(e) => setPendingProp("backgroundColor", e.target.value)}
                  className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer shrink-0"
                />
                <input 
                  type="text" 
                  value={(pendingProps.backgroundColor as string) || "#ffffff"}
                  onChange={(e) => setPendingProp("backgroundColor", e.target.value)}
                  className="w-full bg-transparent border-0 px-2 text-sm text-white focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Chữ
              </span>
              <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
                <input 
                  type="color" 
                  value={(pendingProps.textColor as string) || "#000000"}
                  onChange={(e) => setPendingProp("textColor", e.target.value)}
                  className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer shrink-0"
                />
                <input 
                  type="text" 
                  value={(pendingProps.textColor as string) || "#000000"}
                  onChange={(e) => setPendingProp("textColor", e.target.value)}
                  className="w-full bg-transparent border-0 px-2 text-sm text-white focus:outline-none"
                />
              </div>
            </label>
          </div>
        </div>

        {/* Dummy space for scrolling */}
        <div className="h-10"></div>
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-white/10 bg-zinc-900/80 backdrop-blur-md shrink-0 flex gap-3">
        <button 
          onClick={discardPendingProps}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
        >
          Hủy
        </button>
        <button 
          onClick={commitPendingProps}
          className="flex-1 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Check className="w-4 h-4" /> Lưu
        </button>
      </div>
    </div>
  );
}

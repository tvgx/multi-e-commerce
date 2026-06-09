"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Image as ImageIcon, LayoutTemplate, Type, Layers, Monitor, Columns, Grid, Sliders, Book, Star, Target, ThumbsUp, HelpCircle, MessageSquare, Megaphone, Plus } from "lucide-react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { SECTION_CATEGORIES, SectionMeta } from "../section-registry-meta";

const ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  layout: LayoutTemplate,
  type: Type,
  layers: Layers,
  monitor: Monitor,
  columns: Columns,
  grid: Grid,
  slider: Sliders,
  book: Book,
  star: Star,
  target: Target,
  'thumbs-up': ThumbsUp,
  'help-circle': HelpCircle,
  'message-square': MessageSquare,
  megaphone: Megaphone,
  spotlight: Star
};

export function AddSectionModal({ onClose, insertIndex }: { onClose: () => void, insertIndex?: number }) {
  const [search, setSearch] = useState("");
  const [hoveredSection, setHoveredSection] = useState<SectionMeta | null>(null);
  const { addPageSection, activePage } = useBuilderStore();

  const handleAdd = (componentId: string) => {
    addPageSection(activePage, componentId, insertIndex);
    onClose();
  };

  const filteredCategories = useMemo(() => {
    if (!search) return SECTION_CATEGORIES;
    const lowerSearch = search.toLowerCase();
    return SECTION_CATEGORIES.map(cat => ({
      ...cat,
      sections: cat.sections.filter(sec =>
        sec.label.toLowerCase().includes(lowerSearch) ||
        sec.componentId.toLowerCase().includes(lowerSearch)
      )
    })).filter(cat => cat.sections.length > 0);
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">Thêm Section</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Section list */}
          <div className="w-[340px] border-r border-white/10 flex flex-col shrink-0 bg-zinc-950">
            <div className="p-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm section..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600 transition-shadow"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
              {filteredCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-2 pb-1">{cat.label}</h3>
                  <div className="space-y-0.5">
                    {cat.sections.map(sec => {
                      const Icon = ICONS[sec.icon] || LayoutTemplate;
                      const isHovered = hoveredSection?.componentId === sec.componentId;
                      return (
                        <button
                          key={sec.componentId}
                          onClick={() => handleAdd(sec.componentId)}
                          onMouseEnter={() => setHoveredSection(sec)}
                          onMouseLeave={() => setHoveredSection(null)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left group ${isHovered ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'hover:bg-zinc-800/80'}`}
                        >
                          {/* Thumbnail */}
                          <div className="shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                            {sec.previewImage ? (
                              <img
                                src={sec.previewImage}
                                alt={sec.label}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <Icon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate transition-colors ${isHovered ? 'text-indigo-300' : 'text-zinc-200 group-hover:text-white'}`}>
                              {sec.label}
                            </div>
                            <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{sec.desc}</div>
                          </div>
                          <Plus className={`w-4 h-4 shrink-0 transition-opacity ${isHovered ? 'text-indigo-400 opacity-100' : 'text-zinc-600 opacity-0 group-hover:opacity-100'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="text-center py-10 text-zinc-500 text-sm">Không tìm thấy section.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {hoveredSection ? (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 gap-4">
                <div className="w-full flex-1 max-h-[70%] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-white flex items-center justify-center">
                  {hoveredSection.previewImage ? (
                    <img
                      src={hoveredSection.previewImage}
                      alt={hoveredSection.label}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-400 py-16 px-8 w-full">
                      {React.createElement(ICONS[hoveredSection.icon] || LayoutTemplate, { className: "w-12 h-12 opacity-30" })}
                      <span className="text-sm font-medium">{hoveredSection.label}</span>
                      <span className="text-xs text-zinc-500 text-center">{hoveredSection.desc}</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{hoveredSection.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{hoveredSection.desc}</p>
                </div>
                <button
                  onClick={() => handleAdd(hoveredSection.componentId)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4" /> Thêm section này
                </button>
              </div>
            ) : (
              <div className="relative z-10 text-zinc-600 flex flex-col items-center gap-4">
                <LayoutTemplate className="w-16 h-16 opacity-20" />
                <p className="text-sm">Hover lên section để xem preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Image as ImageIcon, LayoutTemplate, Type, Layers, Monitor, Columns, Grid, Sliders, Book, Star, Target, ThumbsUp, HelpCircle, MessageSquare, Megaphone } from "lucide-react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { registry } from "@ecommerce/ui-registry";
import { SECTION_CATEGORIES } from "../section-registry-meta";

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
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
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
          <h2 className="text-lg font-bold text-white">Add Section</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: List */}
          <div className="w-[350px] border-r border-white/10 flex flex-col shrink-0 bg-zinc-950">
            <div className="p-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search sections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600 transition-shadow"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
              {filteredCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-2">{cat.label}</h3>
                  <div className="space-y-1">
                    {cat.sections.map(sec => {
                      const Icon = ICONS[sec.icon] || LayoutTemplate;
                      return (
                        <button
                          key={sec.componentId}
                          onClick={() => handleAdd(sec.componentId)}
                          onMouseEnter={() => setHoveredSection(sec.componentId)}
                          onMouseLeave={() => setHoveredSection(null)}
                          className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-800/80 transition-colors text-left group"
                        >
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{sec.label}</div>
                            <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{sec.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="text-center py-10 text-zinc-500 text-sm">No sections found.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
             
             {hoveredSection ? (
               <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
                 <div className="text-zinc-500 mb-6 font-mono text-sm uppercase tracking-widest">{hoveredSection} Preview</div>
                 <div className="w-[1000px] bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-800 transform scale-[0.4] origin-center pointer-events-none transition-transform duration-300">
                    {(() => {
                      const Component = registry[hoveredSection];
                      if (!Component) return <div className="p-20 text-center text-red-500">Component not found in registry</div>;
                      // Provide some dummy props for better preview
                      return <Component title="Preview Title" subtitle="This is a live preview of the section." ctaText="Click Me" backgroundImageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" />;
                    })()}
                 </div>
               </div>
             ) : (
               <div className="relative z-10 text-zinc-600 flex flex-col items-center gap-4">
                 <LayoutTemplate className="w-16 h-16 opacity-20" />
                 <p className="text-sm">Hover over a section to preview</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

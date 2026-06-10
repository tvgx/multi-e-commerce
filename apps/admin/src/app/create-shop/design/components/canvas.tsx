"use client";

import React from "react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { registry } from "@ecommerce/ui-registry";
import { Trash2, Edit } from "lucide-react";

function CanvasBlock({
  id,
  componentId,
  props,
  blocks,
  selected,
  onSelect,
  onRemove,
  onEdit
}: {
  id: string;
  componentId: string;
  props: any;
  blocks?: any[];
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const Component = registry[componentId];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative group transition-all ${
        selected ? "ring-4 ring-indigo-500 z-10" : "hover:ring-2 hover:ring-indigo-300/50 z-0"
      }`}
    >
      <div className="absolute right-4 top-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="pointer-events-none relative w-full overflow-hidden bg-white">
        {Component ? (
           <Component {...props} blocks={blocks || []} />
        ) : (
          <div className="h-32 bg-slate-100 border border-red-200 flex items-center justify-center text-red-500 font-mono text-sm">
            Component '{componentId}' not found
          </div>
        )}
      </div>
    </div>
  );
}

export function Canvas() {
  const globalComponents = useBuilderStore(s => s.globalComponents);
  const pages = useBuilderStore(s => s.pages);
  const activePage = useBuilderStore(s => s.activePage);
  const activeComponentId = useBuilderStore(s => s.activeComponentId);
  const setActiveComponent = useBuilderStore(s => s.setActiveComponent);
  const removePageSection = useBuilderStore(s => s.removePageSection);

  const pageComponents = pages[activePage] || [];
  const headerComp = globalComponents.find(c => c.id === "global-header");
  const footerComp = globalComponents.find(c => c.id === "global-footer");

  return (
    <div 
      className="w-full h-full mx-auto relative flex flex-col bg-gray-100 overflow-y-auto custom-scrollbar"
      onClick={() => setActiveComponent(null)}
    >
      <div className="w-full max-w-[1200px] mx-auto bg-white min-h-full shadow-2xl flex flex-col">
          {/* Header */}
          {headerComp && (
              <div 
                  className={`relative group ${activeComponentId === headerComp.id ? 'ring-4 ring-indigo-500 z-10' : 'hover:ring-2 hover:ring-indigo-300/50 z-0'}`}
                  onClick={(e) => { e.stopPropagation(); setActiveComponent(headerComp.id); }}
              >
                  <div className="pointer-events-none w-full">
                      {registry[headerComp.componentId] ? React.createElement(registry[headerComp.componentId], { ...headerComp.props, blocks: headerComp.blocks || [] }) : null}
                  </div>
              </div>
          )}

          {/* Sections */}
          <div className="flex-1 w-full flex flex-col">
            {pageComponents.length === 0 ? (
              <div className="h-[40vh] border-2 border-dashed border-gray-300 mx-4 my-8 rounded-3xl flex flex-col items-center justify-center text-gray-500 gap-4">
                <span className="text-lg">Trang của bạn đang trống!</span>
                <span className="text-sm bg-gray-100 rounded-full px-4 py-1">Click "Add section" ở sidebar bên trái để thêm khối</span>
              </div>
            ) : (
              pageComponents.map((node) => (
                <CanvasBlock
                  key={node.id}
                  id={node.id}
                  componentId={node.componentId}
                  props={node.props}
                  blocks={node.blocks}
                  selected={activeComponentId === node.id}
                  onSelect={() => setActiveComponent(node.id)}
                  onRemove={() => removePageSection(activePage, node.id)}
                  onEdit={() => setActiveComponent(node.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {footerComp && (
              <div 
                  className={`relative group mt-auto ${activeComponentId === footerComp.id ? 'ring-4 ring-indigo-500 z-10' : 'hover:ring-2 hover:ring-indigo-300/50 z-0'}`}
                  onClick={(e) => { e.stopPropagation(); setActiveComponent(footerComp.id); }}
              >
                  <div className="pointer-events-none w-full">
                      {registry[footerComp.componentId] ? React.createElement(registry[footerComp.componentId], { ...footerComp.props, blocks: footerComp.blocks || [] }) : null}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}


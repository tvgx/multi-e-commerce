"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { ComponentSchemas, FieldSchema } from "@ecommerce/ui-registry/src/component-schemas";
import { UIComponentRef } from "@ecommerce/schema";
import { ChevronLeft, Plus, Trash2, X, Image as ImageIcon, Type, Settings, Loader2 } from "lucide-react";
import { uploadFileToMinIO } from "@/lib/upload-minio";
import { useSearchParams } from "next/navigation";

export function PropertiesSidebar() {
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const { 
    activeComponentId,
    activeBlockId,
    setActiveBlock,
    setActiveComponent,
    globalComponents,
    pages,
    activePage,
    updateComponentProp,
    updateBlockProp,
    addBlock,
    removeBlock
  } = useBuilderStore();

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // We are not active if no component is selected
  if (!activeComponentId) return null;

  // Find active component ref
  const componentRef = globalComponents.find(c => c.id === activeComponentId) 
                    || (pages[activePage] || []).find(c => c.id === activeComponentId);

  if (!componentRef) return null;

  // Find active block ref if any
  let blockRef: UIComponentRef | undefined;
  if (activeBlockId) {
     blockRef = componentRef.blocks?.find(b => b.id === activeBlockId);
  }

  // Current scope for properties
  const isBlockLevel = !!activeBlockId && !!blockRef;
  const currentRef = isBlockLevel ? blockRef : componentRef;
  const currentSchemaId = currentRef?.componentId;
  const schema = currentSchemaId ? ComponentSchemas[currentSchemaId] : undefined;

  const handlePropChange = (key: string, value: any) => {
      if (isBlockLevel && blockRef) {
          updateBlockProp(blockRef.id, key, value);
      } else {
          updateComponentProp(componentRef.id, key, value);
      }
  };

  const handleAddBlock = () => {
     if (schema?.allowedBlocks && schema.allowedBlocks.length > 0) {
         addBlock(componentRef.id, schema.allowedBlocks[0]); // Just pick the first allowed block for now
     }
  };

  const renderField = (field: FieldSchema) => {
    if (!currentRef) return null;
    const value = currentRef.props?.[field.id] !== undefined ? currentRef.props[field.id] : (field.default || '');

    switch (field.type) {
      case 'text':
        return (
          <label key={field.id} className="block">
             <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
               <Type className="w-3.5 h-3.5" /> {field.label}
             </span>
             <input 
               type="text" 
               value={value}
               onChange={(e) => handlePropChange(field.id, e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
             />
          </label>
        );
      case 'textarea':
        return (
          <label key={field.id} className="block">
             <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
               <Type className="w-3.5 h-3.5" /> {field.label}
             </span>
             <textarea 
               value={value}
               onChange={(e) => handlePropChange(field.id, e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow resize-none h-20"
             />
          </label>
        );
      case 'color':
        return (
          <label key={field.id} className="block">
             <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
               <Settings className="w-3.5 h-3.5" /> {field.label}
             </span>
             <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
               <input 
                 type="color" 
                 value={value}
                 onChange={(e) => handlePropChange(field.id, e.target.value)}
                 className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer shrink-0"
               />
               <input 
                 type="text" 
                 value={value}
                 onChange={(e) => handlePropChange(field.id, e.target.value)}
                 className="w-full bg-transparent border-0 px-2 text-sm text-white focus:outline-none"
               />
             </div>
          </label>
        );
      case 'image':
        return (
          <div key={field.id} className="space-y-3">
             <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
               <ImageIcon className="w-3.5 h-3.5" /> {field.label}
             </span>
             {value && (
               <div className="mb-2 relative rounded-lg overflow-hidden border border-zinc-700 group h-32">
                 <img src={value} alt="Preview" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => handlePropChange(field.id, "")}
                   className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                 >
                   <X className="w-3.5 h-3.5" />
                 </button>
               </div>
             )}
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={value}
                 onChange={(e) => handlePropChange(field.id, e.target.value)}
                 className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                 placeholder="https://..."
               />
               <label className={`shrink-0 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                 isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
               }`}>
                 {isUploadingImage ? (
                   <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ...</>
                 ) : (
                   <>Upload</>
                 )}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="image/jpeg,image/png,image/webp"
                   disabled={isUploadingImage}
                   onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (!file) return;
                     setIsUploadingImage(true);
                     try {
                       const url = await uploadFileToMinIO(file, 'banner', shopId);
                       handlePropChange(field.id, url);
                     } catch (err) {
                       alert('Upload thất bại: ' + (err instanceof Error ? err.message : String(err)));
                     } finally {
                       setIsUploadingImage(false);
                       e.target.value = '';
                     }
                   }}
                 />
               </label>
             </div>
          </div>
        );
      case 'select':
        return (
          <label key={field.id} className="block">
              <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">{field.label}</span>
              <select 
                value={value}
                onChange={(e) => handlePropChange(field.id, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
          </label>
        );
      case 'number':
        return (
          <label key={field.id} className="block">
             <span className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
               <Type className="w-3.5 h-3.5" /> {field.label}
             </span>
             <input 
               type="number" 
               value={value}
               onChange={(e) => handlePropChange(field.id, parseFloat(e.target.value))}
               className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
             />
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-[360px] bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col h-full shrink-0">
      
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/10 shrink-0 bg-zinc-900/50 backdrop-blur-md">
        {isBlockLevel ? (
           <button onClick={() => setActiveBlock(null)} className="flex items-center text-sm font-semibold text-white hover:text-indigo-400 transition-colors">
             <ChevronLeft className="w-4 h-4 mr-1" />
             Quay lại {schema?.title || componentRef.componentId}
           </button>
        ) : (
           <div className="flex items-center justify-between w-full">
               <span className="text-sm font-semibold text-white">{schema?.title || currentSchemaId}</span>
               <button onClick={() => setActiveComponent(null)} className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                 <X className="w-4 h-4" />
               </button>
           </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          
          {!schema ? (
             <div className="text-zinc-400 text-sm">Component này chưa có schema cấu hình.</div>
          ) : (
             <div className="space-y-6">
                 {schema.settings.map(renderField)}
             </div>
          )}

          {/* Block List if Section Level */}
          {!isBlockLevel && schema?.allowedBlocks && schema.allowedBlocks.length > 0 && (
             <div className="pt-6 border-t border-white/10 mt-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                   Blocks
                   <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                      {componentRef.blocks?.length || 0}
                   </span>
                </h3>

                <div className="space-y-2">
                    {componentRef.blocks?.map((block, index) => {
                        const blockSchema = ComponentSchemas[block.componentId];
                        const blockTitle = (block.props?.title as string) || (block.props?.label as string) || blockSchema?.title || `Block ${index + 1}`;
                        return (
                            <div 
                                key={block.id} 
                                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 cursor-pointer group transition-colors"
                                onClick={() => setActiveBlock(block.id)}
                            >
                                <span className="text-sm text-zinc-300 font-medium truncate">{blockTitle}</span>
                                <button 
                                    className="text-zinc-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button 
                   onClick={handleAddBlock}
                   className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 transition-colors text-sm font-medium"
                >
                   <Plus className="w-4 h-4" /> Thêm Block
                </button>
             </div>
          )}
      </div>

    </div>
  );
}

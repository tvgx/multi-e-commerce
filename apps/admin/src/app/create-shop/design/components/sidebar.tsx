"use client";

import { useBuilder } from "./builder-provider";
import { registry } from "@ecommerce/ui-registry";

export function Sidebar() {
  const { insertComponent } = useBuilder();
  const componentKeys = Object.keys(registry || {}).filter(key => key && !key.includes("Card") && !key.includes("Button") && key !== "Input");

  return (
    <div className="w-64 border-r border-white/5 bg-black/40 overflow-y-auto flex flex-col pt-4">
      <div className="px-5 pb-4 border-b border-white/5 mb-4">
        <h3 className="font-semibold text-white tracking-wide text-sm">UI Registry Blocks</h3>
        <p className="text-xs text-slate-500 mt-1">Bốc khối vào Canvas</p>
      </div>
      <div className="flex-1 px-3 space-y-2">
        {componentKeys.length === 0 ? (
           <p className="text-xs text-slate-500 text-center py-10">Không tìm thấy component nào.</p>
        ) : (
          componentKeys.map((compKey) => (
            <button
              key={compKey}
              onClick={() => insertComponent(compKey)}
              className="w-full relative flex items-center justify-between group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 text-left"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                  {compKey}
                </span>
                <span className="text-[10px] text-slate-500">Thêm vào trang</span>
              </div>
              <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-xs">
                +
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";

interface ShopAnalyticsChartProps {
  type: "line" | "pie";
  data: any;
  title: string;
}

export const ShopAnalyticsChart: React.FC<ShopAnalyticsChartProps> = ({ type, data, title }) => {
  if (type === "line") {
    // Premium Line Chart with SVGs
    const maxVal = Math.max(...data.datasets[0].data);
    const points = data.datasets[0].data.map((val: number, i: number) => {
      const x = (i / (data.labels.length - 1)) * 100;
      const y = 100 - (val / maxVal) * 100;
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
        <h4 className="text-sm font-semibold text-slate-400 mb-6">{title}</h4>
        <div className="relative h-40 w-full group">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0,100 L ${points} L 100,100 Z`}
              fill="url(#lineFill)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700 hover:stroke-indigo-400"
            />
          </svg>
          <div className="flex justify-between mt-4">
            {data.labels.map((label: string, i: number) => (
              <span key={i} className="text-[10px] font-medium text-slate-500">{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Premium Pie Chart using Conic Gradient
  const total = data.reduce((acc: number, curr: any) => acc + curr.value, 0);
  let cumulativePercent = 0;
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

  const gradientParts = data.map((item: any, i: number) => {
    const start = cumulativePercent;
    cumulativePercent += item.percent;
    return `${colors[i % colors.length]} ${start}% ${cumulativePercent}%`;
  }).join(", ");

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
      <h4 className="text-sm font-semibold text-slate-400 mb-6">{title}</h4>
      <div className="flex items-center gap-8">
        <div 
          className="h-32 w-32 rounded-full relative" 
          style={{ background: `conic-gradient(${gradientParts})` }}
        >
          <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white text-center">
               Tổng<br/>{total}
            </span>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {data.map((item: any, i: number) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-slate-400">{item.label}</span>
              </div>
              <span className="font-semibold text-white">{item.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

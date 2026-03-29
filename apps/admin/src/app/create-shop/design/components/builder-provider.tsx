"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type BuilderNode = {
  id: string; // The unique id in canvas
  componentId: string; // Name in Registry e.g. "HeroBanner"
  props?: any;
  order: number;
};

type BuilderContextType = {
  nodes: BuilderNode[];
  setNodes: React.Dispatch<React.SetStateAction<BuilderNode[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  insertComponent: (componentId: string) => void;
  removeNode: (id: string) => void;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const insertComponent = useCallback((componentId: string) => {
    setNodes((prev) => {
      const newNode: BuilderNode = {
        id: crypto.randomUUID(),
        componentId,
        order: 0,
        props: {},
      };

      if (!selectedNodeId) {
        return [...prev, newNode].map((n, i) => ({ ...n, order: i }));
      }

      const selectedIndex = prev.findIndex((n) => n.id === selectedNodeId);
      if (selectedIndex === -1) {
        return [...prev, newNode].map((n, i) => ({ ...n, order: i }));
      }

      // Insert right after the selected node
      const updated = [
        ...prev.slice(0, selectedIndex + 1),
        newNode,
        ...prev.slice(selectedIndex + 1),
      ];
      
      return updated.map((n, i) => ({ ...n, order: i }));
    });
  }, [selectedNodeId]);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      return updated.map((n, i) => ({ ...n, order: i }));
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [selectedNodeId]);

  return (
    <BuilderContext.Provider value={{ nodes, setNodes, selectedNodeId, setSelectedNodeId, insertComponent, removeNode }}>
      {children}
    </BuilderContext.Provider>
  );
}

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) throw new Error("useBuilder must be used within BuilderProvider");
  return context;
};

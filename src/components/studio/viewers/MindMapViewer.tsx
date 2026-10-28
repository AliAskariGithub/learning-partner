'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ChevronDown,
  FileText,
  Sparkles,
  Info,
  X,
  FoldHorizontal,
  UnfoldHorizontal,
} from 'lucide-react';

export interface MindMapNode {
  id: string;
  label: string;
  snippet?: string;
  sourceId?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  title: string;
  root: MindMapNode;
}

export function MindMapViewer({
  content,
  onOpenSource,
  onClose,
}: {
  content: string;
  onOpenSource?: (sourceId: string) => void;
  onClose?: () => void;
}) {
  const parsedData = useMemo<MindMapData>(() => {
    try {
      const data = JSON.parse(content);
      if (data.root) return data;
      return {
        title: data.title || 'Mind Map',
        root: {
          id: 'root',
          label: data.title || 'Central Topic',
          children: data.nodes || [],
        },
      };
    } catch {
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      const rootNode: MindMapNode = {
        id: 'root',
        label: 'Central Topic',
        children: [],
      };
      lines.slice(0, 20).forEach((line, idx) => {
        const clean = line.replace(/^[-*#]+\s*/, '').trim();
        if (clean) {
          rootNode.children?.push({
            id: `node-${idx}`,
            label: clean,
          });
        }
      });
      return { title: 'Mind Map', root: rootNode };
    }
  }, [content]);

  const [zoom, setZoom] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Collect all branch IDs for Expand/Collapse All
  const allBranchIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (node: MindMapNode) => {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        node.children.forEach(traverse);
      }
    };
    if (parsedData.root) traverse(parsedData.root);
    return ids;
  }, [parsedData]);

  const handleCollapseAll = () => {
    setCollapsedNodes(new Set(allBranchIds.filter((id) => id !== 'root')));
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  // Recursive Tree Node Renderer
  const renderNode = (node: MindMapNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    const colors = [
      'bg-brand-500/20 border-brand-500/60 text-brand-200 hover:border-brand-400',
      'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 hover:border-cyan-400',
      'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 hover:border-emerald-400',
      'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:border-amber-400',
      'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:border-purple-400',
      'bg-rose-500/15 border-rose-500/40 text-rose-200 hover:border-rose-400',
    ];
    const nodeColor = colors[depth % colors.length];

    return (
      <div key={node.id} className="flex items-center gap-6 my-3">
        {/* Node Box */}
        <div
          onClick={() => setSelectedNode(node)}
          className={`group relative px-4 py-3 rounded-2xl border transition-all duration-150 cursor-pointer shadow-lg select-none flex items-center gap-3 shrink-0 ${nodeColor} ${
            isSelected ? 'ring-2 ring-brand-400 scale-105 shadow-brand-500/20' : 'hover:scale-[1.02]'
          }`}
        >
          {depth === 0 ? (
            <div className="w-7 h-7 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-current shrink-0 opacity-80" />
          )}

          <div className="flex flex-col">
            <span className={`text-xs font-display ${depth === 0 ? 'font-bold text-sm text-[#f4f4f2]' : 'font-semibold'}`}>
              {node.label}
            </span>
            {node.snippet && (
              <span className="text-[10px] text-muted-foreground font-serif line-clamp-1 max-w-[220px]">
                {node.snippet}
              </span>
            )}
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCollapse(node.id, e)}
              className="p-1 rounded-lg bg-black/25 hover:bg-black/40 transition-colors ml-1 text-[#9a9a94] hover:text-[#f4f4f2]"
              title={isCollapsed ? 'Expand branches' : 'Collapse branches'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {hasChildren && isCollapsed && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-[#9a9a94]">
              {node.children!.length}
            </span>
          )}
        </div>

        {/* Children Branches with dashed connector */}
        {hasChildren && !isCollapsed && (
          <div className="pl-6 border-l-2 border-dashed border-[#383838] flex flex-col justify-center relative before:absolute before:left-0 before:top-1/2 before:w-6 before:h-0.5 before:bg-[#383838]">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2] relative overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <GitFork className="w-4 h-4 text-brand-400 shrink-0" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {parsedData.title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 shrink-0 hidden sm:inline-block">
            Interactive Concept Graph
          </span>
        </div>

        {/* Graph Actions & Zoom Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Expand All Branches"
            >
              <UnfoldHorizontal className="w-3.5 h-3.5 mr-1" />
              Expand
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Collapse Branches"
            >
              <FoldHorizontal className="w-3.5 h-3.5 mr-1" />
              Collapse
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-[#262626] border border-[#303030] p-0.5 rounded-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-xs h-7 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-[#9a9a94] px-1.5 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-xs h-7 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="text-xs h-7 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Reset 100%"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
              title="Close Mind Map"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Workbench Canvas */}
      <div className="flex-1 overflow-auto p-10 md:p-16 relative flex items-center min-h-[450px] bg-[#141414] bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:20px_20px] scrollbar-thin scrollbar-thumb-[#303030]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="transition-transform duration-200 p-4"
        >
          {renderNode(parsedData.root, 0)}
        </div>
      </div>

      {/* Concept Inspector Slide-Over Drawer when a node is clicked */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 max-w-sm w-full p-5 rounded-3xl bg-[#212121]/95 backdrop-blur-md border border-[#383838] shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center">
                <Info className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-display font-bold text-xs text-[#f4f4f2]">
                {selectedNode.label}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-xs text-[#9a9a94] hover:text-[#f4f4f2] p-1 rounded-lg hover:bg-[#2a2a2a]"
            >
              ✕
            </button>
          </div>

          <p className="text-xs font-serif text-[#dcdcd8] leading-relaxed mb-4">
            {selectedNode.snippet || 'Key conceptual theme synthesized from active notebook sources.'}
          </p>

          {selectedNode.sourceId && onOpenSource && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenSource(selectedNode.sourceId!)}
              className="text-xs h-8 w-full font-display"
            >
              <FileText className="w-3 h-3 mr-1.5" />
              Open Source Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

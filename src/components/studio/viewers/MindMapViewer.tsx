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
}: {
  content: string;
  onOpenSource?: (sourceId: string) => void;
}) {
  const parsedData = useMemo<MindMapData>(() => {
    try {
      const data = JSON.parse(content);
      if (data.root) return data;
      // Fallback object structure
      return {
        title: data.title || 'Mind Map',
        root: {
          id: 'root',
          label: data.title || 'Central Topic',
          children: data.nodes || [],
        },
      };
    } catch {
      // Parse markdown bullets as fallback
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      const rootNode: MindMapNode = {
        id: 'root',
        label: 'Central Topic',
        children: [],
      };
      lines.slice(0, 15).forEach((line, idx) => {
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

  const handleZoomIn = () => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  // Recursive Tree Node Renderer
  const renderNode = (node: MindMapNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    const colors = [
      'bg-brand-500/20 border-brand-500/60 text-brand-200',
      'bg-cyan-500/15 border-cyan-500/40 text-cyan-200',
      'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
      'bg-amber-500/15 border-amber-500/40 text-amber-200',
      'bg-purple-500/15 border-purple-500/40 text-purple-200',
    ];
    const nodeColor = colors[depth % colors.length];

    return (
      <div key={node.id} className="flex items-center gap-4 my-2">
        {/* Node Box */}
        <div
          onClick={() => setSelectedNode(node)}
          className={`group relative px-4 py-2.5 rounded-2xl border transition-all cursor-pointer shadow-md select-none flex items-center gap-2 max-w-xs sm:max-w-sm ${nodeColor} ${
            isSelected ? 'ring-2 ring-brand-400 scale-105' : 'hover:scale-[1.02]'
          }`}
        >
          {depth === 0 ? (
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-current shrink-0 opacity-70" />
          )}

          <span className={`text-xs font-display ${depth === 0 ? 'font-bold text-sm text-[#f4f4f2]' : 'font-medium'}`}>
            {node.label}
          </span>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCollapse(node.id, e)}
              className="p-1 rounded-lg hover:bg-black/30 transition-colors ml-1 text-[#9a9a94] hover:text-[#f4f4f2]"
              title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {node.snippet && (
            <span
              className="text-[10px] p-0.5 px-1.5 rounded-full bg-black/40 text-brand-300 font-mono ml-auto"
              title="Click node to view source chunk excerpt"
            >
              info
            </span>
          )}
        </div>

        {/* Children Branches */}
        {hasChildren && !isCollapsed && (
          <div className="pl-4 border-l-2 border-dashed border-[#383838] flex flex-col justify-center">
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
        <div className="flex items-center gap-2.5">
          <GitFork className="w-4 h-4 text-brand-400" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {parsedData.title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 hidden sm:inline-block">
            Interactive Graph
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#262626] border border-[#303030] p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-xs h-7 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] font-mono text-[#9a9a94] px-1.5">
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
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="flex-1 overflow-auto p-8 md:p-14 relative flex items-center min-h-[400px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="transition-transform duration-200"
        >
          {renderNode(parsedData.root, 0)}
        </div>
      </div>

      {/* Node Detail Slide-Over Card when clicked */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 max-w-sm w-full p-4 rounded-2xl bg-[#262626] border border-[#383838] shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-400" />
              <h4 className="font-display font-bold text-xs text-[#f4f4f2]">
                {selectedNode.label}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-xs text-[#9a9a94] hover:text-[#f4f4f2] p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs font-serif text-[#dcdcd8] leading-relaxed mb-3">
            {selectedNode.snippet || 'Grounded theme extracted from notebook sources.'}
          </p>

          {selectedNode.sourceId && onOpenSource && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenSource(selectedNode.sourceId!)}
              className="text-[11px] h-7 w-full font-display"
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


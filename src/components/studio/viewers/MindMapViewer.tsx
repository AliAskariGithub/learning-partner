'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  Printer,
  Sparkles,
  Info,
  X,
  FoldHorizontal,
  UnfoldHorizontal,
} from 'lucide-react';
import { exportToPdf, exportToMarkdown, printFormattedDocument } from '@/lib/export/export-helper';

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
  const { toast } = useToast();
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

  const formatMindMapOutline = () => {
    let md = `# ${parsedData.title || 'Mind Map Concept Hierarchy'}\n\n`;
    md += `**Central Concept:** ${parsedData.root.label}\n\n---\n\n`;
    md += `## Structured Concept Hierarchy\n\n`;
    const walk = (node: MindMapNode, depth: number) => {
      const indent = '  '.repeat(depth);
      md += `${indent}- **${node.label}**`;
      if (node.snippet) md += `: *${node.snippet}*`;
      md += `\n`;
      if (node.children) {
        node.children.forEach((c) => walk(c, depth + 1));
      }
    };
    if (parsedData.root.children) {
      parsedData.root.children.forEach((c) => walk(c, 0));
    }
    return md;
  };

  const handleDownloadPdf = () => {
    try {
      const md = formatMindMapOutline();
      exportToPdf({
        filename: `${(parsedData.title || 'mind-map').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-outline.pdf`,
        title: parsedData.title || 'Mind Map Concept Hierarchy',
        content: md,
        metadata: { type: 'MIND MAP OUTLINE' },
      });
      toast({ title: 'Downloaded PDF', description: 'Mind Map PDF saved to your device.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not download PDF.', variant: 'error' });
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const md = formatMindMapOutline();
      exportToMarkdown(`${(parsedData.title || 'mind-map').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-outline.md`, md);
      toast({ title: 'Downloaded Markdown', description: 'Mind Map Markdown saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not save Markdown.', variant: 'error' });
    }
  };

  const handlePrint = () => {
    try {
      const md = formatMindMapOutline();
      printFormattedDocument(parsedData.title || 'Mind Map Concept Hierarchy', md, { type: 'Mind Map Concept Graph' });
    } catch (err: any) {
      toast({ title: 'Print Failed', description: err.message || 'Could not open print preview.', variant: 'error' });
    }
  };

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
            <div className="w-2.5 h-2.5 rounded-full bg-current opacity-60" />
          )}

          <span className="font-display font-semibold text-xs sm:text-sm whitespace-nowrap">
            {node.label}
          </span>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCollapse(node.id, e)}
              className="p-1 rounded-lg hover:bg-black/20 text-current transition cursor-pointer ml-1"
              title={isCollapsed ? 'Expand Children' : 'Collapse Children'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Children Column */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col relative pl-6 border-l-2 border-[#383838]">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2] relative overflow-hidden">
      {/* Top Header Toolbar */}
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Expand All Branches"
            >
              <UnfoldHorizontal className="w-3.5 h-3.5 mr-1" />
              Expand
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
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
            <span className="text-[11px] font-mono text-[#9a9a94] px-1 min-w-[38px] text-center">
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
          </div>

          <div className="flex items-center gap-1.5 border-l border-[#303030] pl-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs h-8 px-2 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1 font-display font-medium"
              title="Download Outline as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="text-xs h-8 px-2 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1 font-display font-medium"
              title="Download Outline as Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.md</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Print Concept Graph"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer ml-1"
              title="Close Mind Map"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto p-12 bg-[#171717] relative">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="transition-transform duration-150 inline-block min-w-full"
        >
          {renderNode(parsedData.root)}
        </div>
      </div>

      {/* Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute right-6 bottom-6 w-80 rounded-2xl bg-[#1f1f1f] border border-[#383838] p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#303030] mb-2.5">
            <span className="font-display font-bold text-xs text-[#f4f4f2]">
              Concept Details
            </span>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] transition p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-display font-semibold text-sm text-[#f4f4f2] mb-1">
            {selectedNode.label}
          </p>

          {selectedNode.snippet ? (
            <p className="text-xs font-serif text-[#dcdcd8] leading-relaxed mb-3">
              {selectedNode.snippet}
            </p>
          ) : (
            <p className="text-xs font-serif text-[#9a9a94] italic mb-3">
              Key concept generated from your sources.
            </p>
          )}

          {selectedNode.sourceId && onOpenSource && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenSource(selectedNode.sourceId!)}
              className="w-full text-xs font-display flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              View Grounded Source
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

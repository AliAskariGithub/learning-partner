'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Citation } from '@/db/schema';
import { CitationChip } from './CitationChip';
import { InteractiveQuizCard, QuizData } from './InteractiveQuizCard';

interface MessageContentProps {
  content: string;
  citations?: Citation[] | null;
  mode?: 'chat' | 'learn' | 'quiz';
  onCitationClick?: (citation: Citation) => void;
  onNewQuiz?: () => void;
}

export function MessageContent({
  content,
  citations = [],
  mode,
  onCitationClick,
  onNewQuiz,
}: MessageContentProps) {
  // Check if content contains valid quiz JSON (in quiz mode or whenever AI returns quiz structures)
  const parsedQuiz = useMemo<QuizData | null>(() => {
    try {
      let clean = content.trim();

      // 1. Direct JSON fence extraction
      const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) {
        clean = fenceMatch[1].trim();
      }

      // 2. Try parsing directly
      let data: any = null;
      try {
        data = JSON.parse(clean);
      } catch {
        // Find JSON object or array substring if wrapped in conversational text
        const jsonStartObj = clean.indexOf('{');
        const jsonEndObj = clean.lastIndexOf('}');
        if (jsonStartObj !== -1 && jsonEndObj > jsonStartObj) {
          try {
            data = JSON.parse(clean.substring(jsonStartObj, jsonEndObj + 1));
          } catch {}
        }
        if (!data) {
          const jsonStartArr = clean.indexOf('[');
          const jsonEndArr = clean.lastIndexOf(']');
          if (jsonStartArr !== -1 && jsonEndArr > jsonStartArr) {
            try {
              data = JSON.parse(clean.substring(jsonStartArr, jsonEndArr + 1));
            } catch {}
          }
        }
      }

      if (data) {
        // Object format: { questions: [...] }
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          return data as QuizData;
        }
        // Direct array format: [ { question: "...", options: [...] } ]
        if (Array.isArray(data) && data.length > 0 && (data[0].question || data[0].prompt)) {
          return {
            title: 'Knowledge Check Quiz',
            questions: data.map((q: any, idx: number) => ({
              id: q.id || `q_${idx + 1}`,
              question: q.question || q.prompt || '',
              options: Array.isArray(q.options) ? q.options : [],
              correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
              explanation: q.explanation || '',
              citationSnippet: q.citationSnippet || q.citationsSnippet || '',
              sourceTitle: q.sourceTitle || '',
            })),
          };
        }
      }
    } catch {
      // Still streaming or not valid JSON
    }
    return null;
  }, [content]);

  if (parsedQuiz) {
    return <InteractiveQuizCard quizData={parsedQuiz} onNewQuiz={onNewQuiz} />;
  }

  // Map citation numbers to citations objects
  const citationMap = useMemo(() => {
    const map = new Map<number, Citation>();
    if (citations) {
      citations.forEach((c) => {
        map.set(c.citationNumber, c);
      });
    }
    return map;
  }, [citations]);

  // Custom text transformer that replaces [1], [2] with clickable chips
  const renderTextWithCitations = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const num = parseInt(match[1], 10);
      const cit = citationMap.get(num);

      parts.push(
        <CitationChip
          key={`cit-${match.index}-${num}`}
          citationNumber={num}
          citation={cit}
          onClick={() => cit && onCitationClick?.(cit)}
        />
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Recursively process nodes so citations inside strong, em, li, blockquote, etc. are converted
  const renderWithCitations = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return renderTextWithCitations(node);
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      if (element.props && element.props.children) {
        return React.cloneElement(element, {
          ...element.props,
          children: React.Children.map(element.props.children, renderWithCitations),
        });
      }
    }
    if (Array.isArray(node)) {
      return node.map(renderWithCitations);
    }
    return node;
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden text-sm font-sans leading-relaxed text-[#ecece8] space-y-3.5 select-text break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-display font-bold text-[#f4f4f2] mt-6 mb-3 pb-2 border-b border-[#303030] tracking-tight flex items-center gap-2 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-base sm:text-lg font-display font-bold text-[#f4f4f2] mt-5 mb-2.5 pb-1.5 border-b border-[#2a2a2a] tracking-tight flex items-center gap-2 min-w-0 break-words">
                <span className="w-1.5 h-4 rounded-full bg-brand-500 inline-block shrink-0" />
                <span className="min-w-0 break-words">{React.Children.map(children, renderWithCitations)}</span>
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm sm:text-base font-display font-semibold text-brand-300 mt-4 mb-2 tracking-tight flex items-center gap-1.5 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-xs sm:text-sm font-display font-medium text-[#c8c8c2] mt-3 mb-1.5 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h4>
            );
          },
          p({ children }) {
            return (
              <p className="mb-3 text-sm leading-relaxed text-[#e0e0da] min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </p>
            );
          },
          ul({ children }) {
            return (
              <ul className="space-y-2 my-3 pl-5 list-disc marker:text-brand-400 marker:font-bold min-w-0">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="space-y-2 my-3 pl-5 list-decimal marker:text-brand-400 marker:font-semibold marker:text-xs min-w-0">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-sm leading-relaxed text-[#e0e0da] pl-1 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </li>
            );
          },
          blockquote({ children }) {
            return (
              <div className="my-3.5 p-3.5 sm:p-4 rounded-xl bg-[#262626]/85 border-l-4 border-brand-500 text-sm text-[#f0eeea] shadow-sm min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </div>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-white">
                {React.Children.map(children, renderWithCitations)}
              </strong>
            );
          },
          em({ children }) {
            return (
              <em className="italic text-[#c8c8c2]">
                {React.Children.map(children, renderWithCitations)}
              </em>
            );
          },
          hr() {
            return <hr className="my-4 border-[#303030]" />;
          },
          pre({ children }) {
            return (
              <div className="w-full max-w-full min-w-0 my-3 rounded-xl bg-[#141414] border border-[#303030] shadow-inner overflow-hidden">
                <pre className="p-3.5 overflow-x-auto max-w-full w-full text-xs font-mono text-emerald-300 leading-relaxed scrollbar-thin scrollbar-thumb-[#3a3a3a] scrollbar-track-transparent overscroll-x-contain focus:outline-none">
                  {children}
                </pre>
              </div>
            );
          },
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[#262626] border border-[#383838] font-mono text-[11px] text-brand-300 font-medium break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="block w-full font-mono text-xs whitespace-pre" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="w-full max-w-full min-w-0 overflow-x-auto my-4 rounded-xl border border-[#303030] shadow-sm scrollbar-thin scrollbar-thumb-[#3a3a3a]">
                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-[#303030] bg-[#262626] px-3.5 py-2.5 font-display font-semibold text-[#f4f4f2] text-xs">
                {React.Children.map(children, renderWithCitations)}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-[#262626] bg-[#1a1a1a]/60 px-3.5 py-2 text-[#dcdcd6] text-xs">
                {React.Children.map(children, renderWithCitations)}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

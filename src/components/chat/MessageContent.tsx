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
  onQuickAction?: (actionPrompt: string) => void;
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
      if (!content) return null;
      let clean = content.trim();

      // 1. Direct JSON fence extraction
      const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*(?:```|$)/i);
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
          const candidate = clean.substring(jsonStartObj, jsonEndObj + 1);
          try {
            data = JSON.parse(candidate);
          } catch {
            // Try repairing trailing commas and unescaped newlines
            try {
              const repaired = candidate
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/[\r\n]+/g, ' ');
              data = JSON.parse(repaired);
            } catch {}
          }
        }
        if (!data) {
          const jsonStartArr = clean.indexOf('[');
          const jsonEndArr = clean.lastIndexOf(']');
          if (jsonStartArr !== -1 && jsonEndArr > jsonStartArr) {
            const candidate = clean.substring(jsonStartArr, jsonEndArr + 1);
            try {
              data = JSON.parse(candidate);
            } catch {
              try {
                const repaired = candidate
                  .replace(/,\s*([}\]])/g, '$1')
                  .replace(/[\r\n]+/g, ' ');
                data = JSON.parse(repaired);
              } catch {}
            }
          }
        }
      }

      if (data) {
        // Object format: { questions: [...] }
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          return {
            title: data.title || 'Knowledge Check Quiz',
            questions: data.questions.map((q: any, idx: number) => ({
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

      // 3. Resilient Fallback: Regex extraction if raw JSON leaked
      if (clean.includes('"question":') || clean.includes('"options":') || clean.includes('"correctIndex":')) {
        const questions: any[] = [];
        const qRegex = /(?:\{\s*(?:"id"|id)\s*:\s*"([^"]+)",?\s*)?(?:"question"|question)\s*:\s*"([^"]+)"[\s\S]*?(?:"options"|options)\s*:\s*\[([\s\S]*?)\][\s\S]*?(?:"correctIndex"|correctIndex)\s*:\s*(\d+)[\s\S]*?(?:"explanation"|explanation)\s*:\s*"([^"]*)"/g;
        let match;
        while ((match = qRegex.exec(clean)) !== null) {
          const [_, id, question, optionsRaw, correctIndex, explanation] = match;
          const options = optionsRaw
            .split(',')
            .map((o) => o.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);

          questions.push({
            id: id || `q_${questions.length + 1}`,
            question,
            options,
            correctIndex: parseInt(correctIndex, 10),
            explanation: explanation || '',
            citationSnippet: '',
            sourceTitle: '',
          });
        }

        if (questions.length > 0) {
          return {
            title: 'Knowledge Check Quiz',
            questions,
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

  // Custom text transformer that replaces [1], {1}, [1, 2], {1, 5}, [Beyond your sources], etc.
  const renderTextWithCitations = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\[(\d+(?:\s*,\s*\d+)*)\]|\{(\d+(?:\s*,\s*\d+)*)\}|\[Beyond your sources\]|\{Beyond your sources\}|\[Not from your sources\]|\{Not from your sources\})/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const fullMatch = match[0];
      const matchIndex = match.index;
      const numbersGroup = match[2] || match[3];

      if (numbersGroup) {
        const nums = numbersGroup
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));

        nums.forEach((num, subIdx) => {
          const cit = citationMap.get(num);
          parts.push(
            <CitationChip
              key={`cit-${matchIndex}-${num}-${subIdx}`}
              citationNumber={num}
              citation={cit}
              onClick={() => cit && onCitationClick?.(cit)}
            />
          );
        });
      } else if (fullMatch.toLowerCase().includes('beyond your sources')) {
        parts.push(
          <span
            key={`beyond-${matchIndex}`}
            className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-[10px] font-display font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 align-middle select-none shadow-xs"
          >
            Beyond your sources
          </span>
        );
      } else if (fullMatch.toLowerCase().includes('not from your sources')) {
        parts.push(
          <span
            key={`notfrom-${matchIndex}`}
            className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-[10px] font-display font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 align-middle select-none shadow-xs"
          >
            Not from your sources
          </span>
        );
      }

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

  const isUrduContent = useMemo(() => /[\u0600-\u06FF]/.test(content || ''), [content]);

  return (
    <div
      dir={isUrduContent ? 'rtl' : 'ltr'}
      className={`w-full min-w-0 max-w-full overflow-hidden text-sm font-sans leading-relaxed text-zinc-900 dark:text-[#ecece8] space-y-3.5 select-text break-words ${
        isUrduContent ? 'font-urdu text-right leading-[2.1]' : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 dark:text-[#f4f4f2] mt-6 mb-3 pb-2 border-b border-zinc-200 dark:border-[#303030] tracking-tight flex items-center gap-2 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-base sm:text-lg font-display font-bold text-zinc-900 dark:text-[#f4f4f2] mt-5 mb-2.5 pb-1.5 border-b border-zinc-200 dark:border-[#2a2a2a] tracking-tight flex items-center gap-2 min-w-0 break-words">
                <span className="w-1.5 h-4 rounded-full bg-brand-500 inline-block shrink-0" />
                <span className="min-w-0 break-words">{React.Children.map(children, renderWithCitations)}</span>
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm sm:text-base font-display font-semibold text-brand-700 dark:text-brand-300 mt-4 mb-2 tracking-tight flex items-center gap-1.5 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-xs sm:text-sm font-display font-medium text-zinc-700 dark:text-[#c8c8c2] mt-3 mb-1.5 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </h4>
            );
          },
          p({ children }) {
            return (
              <p className="mb-3 text-sm leading-relaxed text-zinc-800 dark:text-[#e0e0da] min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </p>
            );
          },
          ul({ children }) {
            return (
              <ul className="space-y-2 my-3 pl-5 list-disc marker:text-brand-500 dark:marker:text-brand-400 marker:font-bold min-w-0">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="space-y-2 my-3 pl-5 list-decimal marker:text-brand-500 dark:marker:text-brand-400 marker:font-semibold marker:text-xs min-w-0">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-sm leading-relaxed text-zinc-800 dark:text-[#e0e0da] pl-1 min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </li>
            );
          },
          blockquote({ children }) {
            return (
              <div className="my-3.5 p-3.5 sm:p-4 rounded-xl bg-zinc-100 border-l-4 border-brand-500 text-sm text-zinc-900 shadow-xs dark:bg-[#262626]/85 dark:text-[#f0eeea] min-w-0 break-words">
                {React.Children.map(children, renderWithCitations)}
              </div>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-zinc-950 dark:text-white">
                {React.Children.map(children, renderWithCitations)}
              </strong>
            );
          },
          em({ children }) {
            return (
              <em className="italic text-zinc-700 dark:text-[#c8c8c2]">
                {React.Children.map(children, renderWithCitations)}
              </em>
            );
          },
          hr() {
            return <hr className="my-4 border-zinc-200 dark:border-[#303030]" />;
          },
          pre({ children }) {
            return (
              <div className="w-full max-w-full min-w-0 my-3 rounded-xl bg-zinc-900 dark:bg-[#141414] border border-zinc-800 dark:border-[#303030] shadow-inner overflow-hidden">
                <pre className="p-3.5 overflow-x-auto max-w-full w-full text-xs font-mono text-emerald-300 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 dark:scrollbar-thumb-[#3a3a3a] scrollbar-track-transparent overscroll-x-contain focus:outline-none">
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
                  className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-brand-700 font-mono text-[11px] font-medium break-all dark:bg-[#262626] dark:border-[#383838] dark:text-brand-300"
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
              <div className="w-full max-w-full min-w-0 overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-[#303030] shadow-xs scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-[#3a3a3a]">
                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-zinc-200 bg-zinc-100 px-3.5 py-2.5 font-display font-semibold text-zinc-900 text-xs dark:border-[#303030] dark:bg-[#262626] dark:text-[#f4f4f2]">
                {React.Children.map(children, renderWithCitations)}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-zinc-200 bg-white px-3.5 py-2 text-zinc-800 text-xs dark:border-[#262626] dark:bg-[#1a1a1a]/60 dark:text-[#dcdcd6]">
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

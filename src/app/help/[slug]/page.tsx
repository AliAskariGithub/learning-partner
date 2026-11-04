import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';
import {
  getHelpArticleBySlug,
  getAllHelpArticles,
  extractHeadings,
} from '@/lib/content';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Mail,
  Bug,
} from 'lucide-react';
import { Card } from '@/components/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllHelpArticles();
  return articles.map((art) => ({
    slug: art.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    return {
      title: `Article Not Found — ${siteConfig.name}`,
    };
  }

  return {
    title: `${article.frontmatter.title} — Documentation — ${siteConfig.name}`,
    description: article.frontmatter.summary,
    alternates: {
      canonical: `${siteConfig.url}/help/${slug}`,
    },
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const session = await getSession();
  const isLoggedIn = !!session?.user;
  const allArticles = getAllHelpArticles();

  // Find previous and next articles
  const currentIndex = allArticles.findIndex((a) => a.slug === slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // Find related articles
  const relatedSlugs = article.frontmatter.relatedArticles || [];
  const relatedArticles = allArticles.filter((a) => relatedSlugs.includes(a.slug));

  // Extract TOC headings
  const toc = extractHeadings(article.content);

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Help Center',
        item: `${siteConfig.url}/help`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.frontmatter.title,
        item: `${siteConfig.url}/help/${slug}`,
      },
    ],
  };

  return (
    <PageShell
      title={article.frontmatter.title}
      intro={article.frontmatter.summary}
      badge={`Help / ${article.frontmatter.category}`}
      isLoggedIn={isLoggedIn}
      maxWidth="2xl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Main Documentation 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Sidebar */}
        <HelpSidebar articles={allArticles} />

        {/* Center Content Body */}
        <div className="flex-1 min-w-0 w-full space-y-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground pb-4 border-b border-border/60"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <Link href="/help" className="hover:text-foreground transition-colors">
              Help Center
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
              {article.frontmatter.title}
            </span>
          </nav>

          {/* Article Metadata */}
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              Updated {article.frontmatter.lastUpdated}
            </span>
            <span>•</span>
            <span className="text-brand-500 font-semibold">{article.frontmatter.category}</span>
          </div>

          {/* Markdown Content */}
          <MarkdownRenderer content={article.content} />

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-border/60 space-y-3">
              <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                Related Articles
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/help/${rel.slug}`}
                    className="p-3.5 rounded-xl bg-surface border border-border hover:border-brand-500/50 transition-colors block group cursor-pointer"
                  >
                    <div className="font-display font-semibold text-xs text-foreground group-hover:text-brand-400 transition-colors">
                      {rel.frontmatter.title}
                    </div>
                    <div className="font-serif text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {rel.frontmatter.summary}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Previous & Next Article Navigation */}
          <div className="pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link
                href={`/help/${prevArticle.slug}`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-brand-500/50 transition-colors flex items-center gap-3 group cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-brand-500 shrink-0 group-hover:-translate-x-1 transition-transform" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Previous Article</span>
                  <span className="font-display font-semibold text-xs text-foreground group-hover:text-brand-400 transition-colors truncate block">
                    {prevArticle.frontmatter.title}
                  </span>
                </div>
              </Link>
            ) : <div />}

            {nextArticle ? (
              <Link
                href={`/help/${nextArticle.slug}`}
                className="p-4 rounded-xl bg-surface border border-border hover:border-brand-500/50 transition-colors flex items-center justify-between gap-3 group text-right cursor-pointer"
              >
                <div className="min-w-0 text-right flex-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Next Article</span>
                  <span className="font-display font-semibold text-xs text-foreground group-hover:text-brand-400 transition-colors truncate block">
                    {nextArticle.frontmatter.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-500 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : <div />}
          </div>

          {/* Support Strip */}
          <div className="p-4 rounded-xl bg-surface border border-border text-xs font-serif text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Was this article helpful? If you still have questions:</span>
            <div className="flex items-center gap-2">
              <Link href="/contact" className="text-brand-500 font-display font-semibold hover:underline inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Support
              </Link>
              <span>•</span>
              <Link href="/feedback" className="text-brand-500 font-display font-semibold hover:underline inline-flex items-center gap-1">
                <Bug className="w-3.5 h-3.5" /> Report Issue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}


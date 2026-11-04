import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface LegalDocFrontmatter {
  title: string;
  summary: string;
  lastUpdated: string;
  effectiveDate: string;
}

export interface HelpArticleFrontmatter {
  title: string;
  summary: string;
  category: string;
  order: number;
  lastUpdated: string;
  relatedArticles?: string[];
}

export interface ContentDoc<T> {
  slug: string;
  frontmatter: T;
  content: string;
}

/**
 * Extracts headings from Markdown content for Table of Contents generation.
 */
export function extractHeadings(markdown: string): { id: string; label: string; depth: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; label: string; depth: number }[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const depth = match[1].length;
    const label = match[2].trim();
    const id = label
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    headings.push({ id, label, depth });
  }

  return headings;
}

/**
 * Reads a single legal document (e.g. 'privacy' or 'terms').
 */
export function getLegalDoc(slug: 'privacy' | 'terms'): ContentDoc<LegalDocFrontmatter> {
  const filePath = path.join(CONTENT_DIR, 'legal', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Legal document not found: ${filePath}`);
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as LegalDocFrontmatter,
    content,
  };
}

/**
 * Reads all Help Center articles sorted by category and order.
 */
export function getAllHelpArticles(): ContentDoc<HelpArticleFrontmatter>[] {
  const helpDir = path.join(CONTENT_DIR, 'help');
  if (!fs.existsSync(helpDir)) return [];

  const files = fs.readdirSync(helpDir).filter((file) => file.endsWith('.md'));

  const articles = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const filePath = path.join(helpDir, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as HelpArticleFrontmatter,
      content,
    };
  });

  return articles.sort((a, b) => (a.frontmatter.order || 0) - (b.frontmatter.order || 0));
}

/**
 * Reads a specific Help Center article by slug.
 */
export function getHelpArticleBySlug(slug: string): ContentDoc<HelpArticleFrontmatter> | null {
  const filePath = path.join(CONTENT_DIR, 'help', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as HelpArticleFrontmatter,
    content,
  };
}


import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { MARKETING_ROUTES } from '@/config/routes';
import { getAllHelpArticles } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // Root landing page
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  // All public marketing pages
  MARKETING_ROUTES.forEach((route) => {
    routes.push({
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.category === 'legal' ? 'monthly' : 'weekly',
      priority: route.category === 'product' ? 0.9 : 0.7,
    });
  });

  // Dynamic Help Center articles
  const helpArticles = getAllHelpArticles();
  helpArticles.forEach((art) => {
    routes.push({
      url: `${baseUrl}/help/${art.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  return routes;
}


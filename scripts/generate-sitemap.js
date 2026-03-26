import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATASETS_FILE = path.join(PUBLIC_DIR, 'data', 'datasets.json');
const SITEMAP_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_FILE = path.join(PUBLIC_DIR, 'robots.txt');
const BASE_URL = 'https://guynode.com'; // Set to actual production URL

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  try {
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const views = ['', '?view=CATALOG', '?view=MAP', '?view=DOCS', '?view=ANALYSIS', '?view=BLOG_INDEX', '?view=ABOUT', '?view=SUPPORT'];

    views.forEach(view => {
        const priority = view === '' ? '1.0' : '0.8';
        const changefreq = view === '' ? 'daily' : 'weekly';
        sitemapContent += `  <url>\n    <loc>${BASE_URL}/${view}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    });

    sitemapContent += `</urlset>\n`;

    fs.writeFileSync(SITEMAP_FILE, sitemapContent);
    console.log('✅ sitemap.xml generated successfully.');

  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

async function generateRobotsTxt() {
  console.log('Generating robots.txt...');
  const robotsContent = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /config/\nDisallow: /private/\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  fs.writeFileSync(ROBOTS_FILE, robotsContent);
  console.log('✅ robots.txt generated successfully.');
}

generateSitemap();
generateRobotsTxt();

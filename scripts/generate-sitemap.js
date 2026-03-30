import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
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

    // Blog posts
    const blogIndexPath = path.join(PUBLIC_DIR, 'blog', 'index.json');
    if (fs.existsSync(blogIndexPath)) {
      const blogPosts = JSON.parse(fs.readFileSync(blogIndexPath, 'utf8'));
      for (const post of blogPosts) {
        if (post.slug) {
          sitemapContent += `  <url>\n    <loc>${BASE_URL}/?view=BLOG_POST&amp;slug=${encodeURIComponent(post.slug)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        }
      }
    }

    // Learn posts
    const learnIndexPath = path.join(PUBLIC_DIR, 'learn', 'index.json');
    if (fs.existsSync(learnIndexPath)) {
      const learnPosts = JSON.parse(fs.readFileSync(learnIndexPath, 'utf8'));
      for (const post of learnPosts) {
        if (post.slug) {
          sitemapContent += `  <url>\n    <loc>${BASE_URL}/?view=LEARN_POST&amp;slug=${encodeURIComponent(post.slug)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        }
      }
    }

    // Analyses
    const analysesPath = path.join(PUBLIC_DIR, 'data', 'analyses.json');
    if (fs.existsSync(analysesPath)) {
      const analyses = JSON.parse(fs.readFileSync(analysesPath, 'utf8'));
      for (const analysis of analyses) {
        if (analysis.id) {
          sitemapContent += `  <url>\n    <loc>${BASE_URL}/?view=ANALYSIS&amp;analysisId=${encodeURIComponent(analysis.id)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        }
      }
    }

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

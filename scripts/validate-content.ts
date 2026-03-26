import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const DatasetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  lastUpdated: z.string(),
  format: z.string(),
  size: z.string(),
  fileSize: z.string().optional(),
  source: z.string(),
  geojsonUrl: z.string().optional(),
  imageUrl: z.string(),
  ingestionStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  tags: z.array(z.string()).optional(),
  validationReport: z.object({
    status: z.enum(['VERIFIED', 'WARNING', 'ERROR', 'UNCHECKED']),
    issues: z.array(z.string()),
    timestamp: z.string()
  }),
  style: z.unknown().optional(),
  temporalLayers: z.array(z.unknown()).optional(),
  assets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    viewUrl: z.string().optional(),
    downloadUrl: z.string().optional(),
    originalUrl: z.string().optional(),
    isDownloadable: z.boolean().optional(),
    isViewable: z.boolean().optional()
  })).optional()
});

const BlogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string().optional(), // index might not have full content
  publishedDate: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    avatarUrl: z.string()
  }),
  categories: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().optional()
  })),
  tags: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string()
  })).optional(),
  heroImageUrl: z.string().optional(),
  readTimeMinutes: z.number().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean(),
  relatedDatasets: z.array(z.string()).optional()
});

const validateFile = (filePath: string, schema: z.ZodTypeAny, _typeName: string) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  console.log(`Validating ${filePath}...`);
  try {
    const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    const arraySchema = z.array(schema);
    arraySchema.parse(data);
    console.log(`✅ ${filePath} is valid.`);
  } catch (error: unknown) {
    console.error(`❌ Validation failed for ${filePath}:`);
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.format(), null, 2));
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
};

validateFile('public/data/datasets.json', DatasetSchema, 'Dataset');
validateFile('public/blog/index.json', BlogPostSchema, 'BlogPost');

console.log('✅ All static data files passed validation.');

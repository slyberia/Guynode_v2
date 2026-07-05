import { author } from './author'
import { category } from './category'
import { tag } from './tag'
import { blogPost } from './blogPost'
import { analysis } from './analysis'
import { page } from './page'

// Schema registry consumed by sanity.config.ts (Studio) and by the MCP deploy_schema step.
export const schemaTypes = [author, category, tag, blogPost, analysis, page]

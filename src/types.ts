export type PageKind = 'home' | 'articles' | 'tags' | 'tag' | 'article'

export type MarkdownStatus = 'loading' | 'ready' | 'error' | 'not-found'

export type TagSlug =
  | 'agile'
  | 'application-architecture'
  | 'application-integration'
  | 'analysis-patterns'
  | 'api-design'
  | 'build-scripting'
  | 'documentation'
  | 'design'
  | 'domain-driven-design'
  | 'encapsulation'
  | 'event-architectures'
  | 'evolutionary-design'
  | 'legacy-modernization'
  | 'microservices'
  | 'object-collaboration-design'
  | 'programming-style'
  | 'project-planning'
  | 'refactoring'
  | 'refactoring-boundary'
  | 'requirements-analysis'
  | 'security'
  | 'team-environment'
  | 'technical-debt'
  | 'technical-leadership'
  | 'testing'
  | 'continuous-delivery'
  | 'database'
  | 'enterprise-architecture'
  | 'front-end'
  | 'web-services'

export type AppRoute = '/' | '/articles' | '/tags' | `/tags/${TagSlug}` | `/articles/${string}`

export type ArticleStatus = '全文翻訳' | '日本語訳・要約'

export type TagCard = {
  slug: TagSlug
  title: string
  subtitle: string
  description: string
  href: `/tags/${TagSlug}`
}

export type Article = {
  slug: string
  title: string
  subtitle: string
  description: string
  authors: string
  date: string
  originalUrl: string
  status: ArticleStatus
  tagSlug: TagSlug
  additionalTagSlugs: TagSlug[]
  tag: string
  href: `/articles/${string}`
}

export type PageDefinition =
  | {
      title: string
      kind: 'home' | 'articles' | 'tags'
      markdownPath: string
    }
  | {
      title: string
      kind: 'tag'
      tagSlug: TagSlug
      markdownPath: string
    }
  | {
      title: string
      kind: 'article'
      articleSlug: string
      tagSlug: TagSlug
      markdownPath: string
    }

export type BreadcrumbItem = {
  label: string
  href: AppRoute
}

export type NavigateHandler = (event: React.MouseEvent<HTMLAnchorElement>, path: AppRoute) => void

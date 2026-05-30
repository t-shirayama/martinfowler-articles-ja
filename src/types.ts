export type PageKind = 'home' | 'articles' | 'tags' | 'tag' | 'article'

export type MarkdownStatus = 'loading' | 'ready' | 'error' | 'not-found'

export type TagSlug =
  | 'application-architecture'
  | 'analysis-patterns'
  | 'api-design'
  | 'design'
  | 'domain-driven-design'
  | 'encapsulation'
  | 'event-architectures'
  | 'object-collaboration-design'
  | 'refactoring'
  | 'testing'
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

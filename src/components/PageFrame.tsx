import { articlesForTag, tagForSlug } from '../data/content'
import type { AppRoute, MarkdownStatus, NavigateHandler, PageDefinition } from '../types'
import { articles } from '../data/content'
import { ArticleList } from './ArticleList'
import { ArticleMeta } from './ArticleMeta'
import { HomeHero, TagHero } from './Hero'
import { MarkdownPanel } from './MarkdownPanel'
import { TagsAside } from './Sidebars'

type PageFrameProps = {
  route: AppRoute
  page: PageDefinition
  status: MarkdownStatus
  markdown: string
  navigate: NavigateHandler
}

export function PageFrame({ route, page, status, markdown, navigate }: PageFrameProps) {
  const tag = page.kind === 'tag' || page.kind === 'article' ? tagForSlug(page.tagSlug) : undefined
  const tagArticles = tag ? articlesForTag(tag.slug) : []
  const article = page.kind === 'article' ? articles.find((item) => item.slug === page.articleSlug) : undefined
  const layoutClassName = page.kind === 'article'
    ? 'content-layout article-layout'
    : page.kind === 'articles'
      ? 'content-layout articles-index-layout'
      : page.kind === 'tag'
        ? 'content-layout tag-page-layout'
      : page.kind === 'home'
        ? 'content-layout single'
      : 'content-layout'

  return (
    <>
      {route === '/' && <HomeHero navigate={navigate} />}
      {page.kind === 'tag' && tag && <TagHero tag={tag} />}
      <section className={layoutClassName}>
        {page.kind === 'article' && (
          <div className="article-main">
            <MarkdownPanel status={status} markdown={markdown} navigate={navigate} variant="article" />
          </div>
        )}
        {page.kind === 'tag' && tag ? (
          <ArticleList articles={tagArticles} tag={tag} navigate={navigate} />
        ) : null}
        {page.kind === 'articles' && <ArticleList articles={articles} navigate={navigate} />}
        {(page.kind === 'home' || page.kind === 'tags') && <MarkdownPanel status={status} markdown={markdown} navigate={navigate} />}
        {route === '/tags' && <TagsAside navigate={navigate} />}
        {page.kind === 'article' && article && (
          <aside className="article-info-aside" aria-label="記事情報">
            <ArticleMeta article={article} />
          </aside>
        )}
      </section>
    </>
  )
}

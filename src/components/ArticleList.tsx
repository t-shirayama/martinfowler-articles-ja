import type { Article, NavigateHandler, TagCard } from '../types'
import { toAppHref } from '../utils/routing'

type ArticleListProps = {
  articles: Article[]
  navigate: NavigateHandler
  tag?: TagCard
}

export function ArticleList({ articles, navigate, tag }: ArticleListProps) {
  const sortedArticles = [...articles].sort((left, right) => {
    const dateDifference = dateSortKey(right.date) - dateSortKey(left.date)
    if (dateDifference !== 0) return dateDifference
    return left.title.localeCompare(right.title)
  })

  return (
    <section className="tag-article-list">
      <div className="tag-article-list__header">
        <p>{articles.length}件の記事</p>
      </div>
      <div className="tag-article-list__grid">
        {sortedArticles.map((article) => (
          <a className="article-row" key={article.href} href={toAppHref(article.href)} onClick={(event) => navigate(event, article.href)}>
            {tag ? null : <span>{article.tag}</span>}
            <strong>{article.title}</strong>
            <p>{article.description}</p>
            <small>{article.authors} · {article.date}</small>
          </a>
        ))}
      </div>
    </section>
  )
}

function dateSortKey(date: string): number {
  const match = date.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/)
  if (!match) return 0

  const year = Number(match[1])
  const month = Number(match[2] ?? '0')
  const day = Number(match[3] ?? '0')

  return year * 10000 + month * 100 + day
}

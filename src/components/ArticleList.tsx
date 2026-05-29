import type { Article, NavigateHandler, TagCard } from '../types'
import { toAppHref } from '../utils/routing'

type ArticleListProps = {
  articles: Article[]
  navigate: NavigateHandler
  tag?: TagCard
}

export function ArticleList({ articles, navigate, tag }: ArticleListProps) {
  return (
    <section className="tag-article-list">
      <div className="tag-article-list__header">
        <p>{articles.length}件の記事</p>
      </div>
      <div className="tag-article-list__grid">
        {articles.map((article) => (
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

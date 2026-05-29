import type { Article } from '../types'

type ArticleMetaProps = {
  article: Article
}

export function ArticleMeta({ article }: ArticleMetaProps) {
  return (
    <section className="article-meta" aria-label="記事情報">
      <p className="article-meta__notice">この記事は非公式の日本語訳・要約です。</p>
      <dl>
        <div>
          <dt>Original</dt>
          <dd>{article.title}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{article.authors}</dd>
        </div>
        <div>
          <dt>Original date</dt>
          <dd>{article.date}</dd>
        </div>
        <div>
          <dt>Translation status</dt>
          <dd>{article.status}</dd>
        </div>
        <div>
          <dt>Original URL</dt>
          <dd><a href={article.originalUrl} target="_blank" rel="noreferrer">{article.originalUrl}</a></dd>
        </div>
      </dl>
    </section>
  )
}

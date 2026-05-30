import { articlesForTag, tagCards } from '../data/content'
import type { NavigateHandler } from '../types'
import { toAppHref } from '../utils/routing'

type TagListProps = {
  navigate: NavigateHandler
}

export function TagList({ navigate }: TagListProps) {
  return (
    <section className="tag-article-list">
      <div className="tag-article-list__header">
        <p>{tagCards.length}件のタグ</p>
      </div>
      <div className="tag-article-list__grid">
        {tagCards.map((tag) => (
          <a className="article-row tag-row" key={tag.href} href={toAppHref(tag.href)} onClick={(event) => navigate(event, tag.href)}>
            <strong>{tag.title}</strong>
            <em>{tag.subtitle}</em>
            <p>{tag.description}</p>
            <small>{articlesForTag(tag.slug).length}件の記事</small>
          </a>
        ))}
      </div>
    </section>
  )
}

import type { Article, NavigateHandler, TagCard } from '../types'
import { toAppHref } from '../utils/routing'

type CardProps = {
  item: Article | TagCard
  navigate: NavigateHandler
}

export function Card({ item, navigate }: CardProps) {
  const isArticle = 'authors' in item

  return (
    <a className="info-card" href={toAppHref(item.href)} onClick={(event) => navigate(event, item.href)}>
      <strong>{item.title}</strong>
      {!isArticle && <span>{item.subtitle}</span>}
      <p>{item.description}</p>
      {isArticle && <small>{item.authors} · {item.date}</small>}
    </a>
  )
}

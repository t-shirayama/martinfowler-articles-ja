import type { BreadcrumbItem, NavigateHandler } from '../types'
import { toAppHref } from '../utils/routing'

type BreadcrumbsProps = {
  crumbs: BreadcrumbItem[]
  navigate: NavigateHandler
}

export function Breadcrumbs({ crumbs, navigate }: BreadcrumbsProps) {
  return (
    <div className="breadcrumb" aria-label="パンくず">
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.href}-${index}`}>
          {index > 0 && <span className="separator">›</span>}
          <a href={toAppHref(crumb.href)} onClick={(event) => navigate(event, crumb.href)}>
            {crumb.label}
          </a>
        </span>
      ))}
    </div>
  )
}

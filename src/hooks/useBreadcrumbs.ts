import { useMemo } from 'react'
import { contentMap, tagForSlug } from '../data/content'
import type { AppRoute, BreadcrumbItem } from '../types'

export function useBreadcrumbs(route: AppRoute): BreadcrumbItem[] {
  return useMemo(() => {
    const page = contentMap[route]

    if (route === '/') return [{ label: 'ホーム', href: '/' }]
    if (route === '/articles') return [{ label: 'ホーム', href: '/' }, { label: '記事一覧', href: '/articles' }]
    if (route === '/tags') return [{ label: 'ホーム', href: '/' }, { label: 'タグ一覧', href: '/tags' }]
    if (page?.kind === 'tag') return [{ label: 'ホーム', href: '/' }, { label: 'タグ一覧', href: '/tags' }, { label: page.title, href: route }]

    if (page?.kind === 'article') {
      const tag = tagForSlug(page.tagSlug)
      return [
        { label: 'ホーム', href: '/' },
        { label: '記事一覧', href: '/articles' },
        { label: tag?.title ?? '記事', href: tag?.href ?? '/tags' },
        { label: page.title, href: route },
      ]
    }

    return [{ label: 'ホーム', href: '/' }]
  }, [route])
}

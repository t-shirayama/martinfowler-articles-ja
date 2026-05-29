import { siteBase } from '../data/content'
import type { AppRoute } from '../types'

export function normalizePath(pathname: string): AppRoute {
  const base = siteBase.replace(/\/$/, '')
  let path = pathname

  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || '/'
  }

  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  return (path.replace(/\/$/, '') || '/') as AppRoute
}

export function getInitialPath(): AppRoute {
  const params = new URLSearchParams(window.location.search)
  const redirectedRoute = params.get('route')

  if (redirectedRoute) {
    window.history.replaceState({}, '', `${siteBase}${redirectedRoute.replace(/^\//, '')}`)
    return normalizePath(redirectedRoute)
  }

  return normalizePath(window.location.pathname)
}

export function toAppHref(path: AppRoute): string {
  return `${siteBase}${path.replace(/^\//, '')}`
}

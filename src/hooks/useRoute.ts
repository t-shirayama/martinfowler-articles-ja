import { useCallback, useEffect, useState } from 'react'
import type { AppRoute, NavigateHandler } from '../types'
import { getInitialPath, normalizePath, toAppHref } from '../utils/routing'

export function useRoute(): {
  route: AppRoute
  navigate: NavigateHandler
} {
  const [route, setRoute] = useState<AppRoute>(getInitialPath)

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback<NavigateHandler>((event, path) => {
    event.preventDefault()
    window.history.pushState({}, '', toAppHref(path))
    setRoute(normalizePath(path))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}

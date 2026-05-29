import type { AppRoute, NavigateHandler } from '../types'
import { toAppHref } from '../utils/routing'

type HeaderProps = {
  route: AppRoute
  navigate: NavigateHandler
}

export function Header({ route, navigate }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href={toAppHref('/')} onClick={(event) => navigate(event, '/')}>
        <span className="brand-title">Martin Fowler Articles JA</span>
        <span className="brand-subtitle">martinfowler.com 記事の非公式日本語訳・要約</span>
      </a>
      <nav className="site-nav" aria-label="主要ナビゲーション">
        <a className={route === '/' ? 'active' : ''} href={toAppHref('/')} onClick={(event) => navigate(event, '/')}>
          ホーム
        </a>
        <a className={route.startsWith('/articles') ? 'active' : ''} href={toAppHref('/articles')} onClick={(event) => navigate(event, '/articles')}>
          記事一覧
        </a>
        <a className={route.startsWith('/tags') ? 'active' : ''} href={toAppHref('/tags')} onClick={(event) => navigate(event, '/tags')}>
          タグ一覧
        </a>
      </nav>
    </header>
  )
}

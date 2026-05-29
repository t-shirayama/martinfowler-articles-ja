import { Breadcrumbs } from './components/Breadcrumbs'
import { Header } from './components/Header'
import { NotFound } from './components/NotFound'
import { PageFrame } from './components/PageFrame'
import { contentMap } from './data/content'
import { useBreadcrumbs } from './hooks/useBreadcrumbs'
import { useMarkdown } from './hooks/useMarkdown'
import { useRoute } from './hooks/useRoute'

export function App() {
  const { route, navigate } = useRoute()
  const page = contentMap[route]
  const { markdown, status } = useMarkdown(page)
  const crumbs = useBreadcrumbs(route)

  return (
    <div className="site-shell">
      <Header route={route} navigate={navigate} />

      <main>
        <Breadcrumbs crumbs={crumbs} navigate={navigate} />
        {status === 'not-found' || !page ? (
          <NotFound navigate={navigate} />
        ) : (
          <PageFrame route={route} page={page} status={status} markdown={markdown} navigate={navigate} />
        )}
      </main>

      <footer className="site-footer">
        <p>このサイトは非公式の学習用ページです。Martin Fowler 氏、martinfowler.com、Thoughtworks の公式サイトではありません。</p>
      </footer>
    </div>
  )
}

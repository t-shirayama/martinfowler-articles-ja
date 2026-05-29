import type { NavigateHandler } from '../types'
import { toAppHref } from '../utils/routing'

type NotFoundProps = {
  navigate: NavigateHandler
}

export function NotFound({ navigate }: NotFoundProps) {
  return (
    <section className="content-layout single">
      <article className="markdown-panel message-box">
        <h1>ページが見つかりません</h1>
        <p>指定されたページはまだ用意されていません。</p>
        <a href={toAppHref('/')} onClick={(event) => navigate(event, '/')}>ホームへ戻る</a>
      </article>
    </section>
  )
}

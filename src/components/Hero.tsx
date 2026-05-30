import type { NavigateHandler, TagCard } from '../types'
import { toAppHref } from '../utils/routing'

type HomeHeroProps = {
  navigate: NavigateHandler
}

type TagHeroProps = {
  tag: TagCard
}

export function HomeHero({ navigate }: HomeHeroProps) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">非公式日本語訳・要約</p>
        <h1>設計とアーキテクチャを、原文に戻れる形で読む。</h1>
        <p>martinfowler.com の FAQ にある翻訳方針に沿い、原文リンク付きの非公式日本語訳・要約として整理します。</p>
        <div className="hero-actions">
          <a href={toAppHref('/articles/refactoring-module-dependencies')} onClick={(event) => navigate(event, '/articles/refactoring-module-dependencies')}>記事一覧を見る</a>
          <a href={toAppHref('/tags')} onClick={(event) => navigate(event, '/tags')}>タグから探す</a>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="screen-card">Markdown</div>
        <div className="node-card">API</div>
        <div className="node-card second">設計</div>
      </div>
    </section>
  )
}

export function TagHero({ tag }: TagHeroProps) {
  return (
    <section className="tag-hero">
      <div>
        <p className="eyebrow">タグ</p>
        <h1>{tag.title}</h1>
        <p>{tag.description}</p>
      </div>
      <div className="tag-illustration" aria-hidden="true">
        <span>App</span>
        <span>Module</span>
        <span>Flow</span>
      </div>
    </section>
  )
}

import { tagCards } from '../data/content'
import type { NavigateHandler } from '../types'
import { Card } from './Card'

type SidebarProps = {
  navigate: NavigateHandler
}

export function HomeAside({ navigate }: SidebarProps) {
  return (
    <aside className="side-panel">
      <h2>タグから探す</h2>
      {tagCards.map((tag) => (
        <Card key={tag.href} item={tag} navigate={navigate} />
      ))}
    </aside>
  )
}

export function TagsAside({ navigate }: SidebarProps) {
  return (
    <aside className="side-panel">
      <h2>タグ</h2>
      {tagCards.map((tag) => (
        <Card key={tag.href} item={tag} navigate={navigate} />
      ))}
    </aside>
  )
}

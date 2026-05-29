import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { contentMap } from '../data/content'
import type { AppRoute, MarkdownStatus, NavigateHandler } from '../types'
import { toAppHref } from '../utils/routing'
import { MermaidDiagram } from './MermaidDiagram'

type MarkdownPanelProps = {
  markdown: string
  status: MarkdownStatus
  navigate: NavigateHandler
  variant?: 'default' | 'article'
}

type MarkdownLinkProps = React.ComponentProps<'a'> & {
  navigate: NavigateHandler
}

export function MarkdownPanel({ markdown, status, navigate, variant = 'default' }: MarkdownPanelProps) {
  const components: Components = {
    a: (props) => <MarkdownLink {...props} navigate={navigate} />,
    code: (props) => <MarkdownCode {...props} />,
  }

  return (
    <article className={`markdown-panel markdown-panel--${variant}`}>
      {status === 'loading' && <p className="loading">Markdownを読み込んでいます...</p>}
      {status === 'error' && (
        <div className="message-box">
          <h1>Markdownを読み込めませんでした</h1>
          <p>ページを再読み込みするか、トップから開き直してください。</p>
          <a href={toAppHref('/')} onClick={(event) => navigate(event, '/')}>ホームへ戻る</a>
        </div>
      )}
      {status === 'ready' && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {markdown}
        </ReactMarkdown>
      )}
    </article>
  )
}

function MarkdownCode({ className = '', children, ...props }: React.ComponentProps<'code'>) {
  const language = className.replace('language-', '')
  const code = String(children ?? '').trim()

  if (language === 'mermaid') {
    return <MermaidDiagram chart={code} />
  }

  return <code className={className} {...props}>{children}</code>
}

function MarkdownLink({ href = '', children, navigate, ...props }: MarkdownLinkProps) {
  const isExternal = /^https?:\/\//.test(href)
  const isAppRoute = href.startsWith('/') && contentMap[href]

  if (isAppRoute) {
    return (
      <a href={toAppHref(href as AppRoute)} onClick={(event) => navigate(event, href as AppRoute)} {...props}>
        {children}
      </a>
    )
  }

  return (
    <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined} {...props}>
      {children}
    </a>
  )
}

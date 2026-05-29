import type { Components } from 'react-markdown'
import { Children, isValidElement } from 'react'
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
    code: (props) => <MarkdownInlineCode {...props} />,
    pre: (props) => <MarkdownPre {...props} />,
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

function MarkdownPre({ children }: React.ComponentProps<'pre'>) {
  const child = Children.toArray(children)[0]

  if (isValidElement<React.ComponentProps<'code'>>(child)) {
    const className = child.props.className ?? ''
    const language = normalizeLanguage(className.replace('language-', ''))
    const code = String(child.props.children ?? '').replace(/\n$/, '')

    if (language === 'mermaid') {
      return <MermaidDiagram chart={code.trim()} />
    }

    return <CodeBlock code={code} language={language} />
  }

  return <pre>{children}</pre>
}

function MarkdownInlineCode({ className = '', children, ...props }: React.ComponentProps<'code'>) {
  return <code className={className} {...props}>{children}</code>
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <pre className="code-block">
      <code className={`language-${language}`}>
        {highlightCode(code, language)}
      </code>
    </pre>
  )
}

function normalizeLanguage(language: string): string {
  const aliases: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'markup',
    xml: 'markup',
  }

  return aliases[language] ?? language
}

function highlightCode(code: string, language: string) {
  const tokens = tokenizeCode(code, language)

  return tokens.map((token, index) => {
    if (!token.type) {
      return token.value
    }

    return (
      <span className={`code-token code-token--${token.type}`} key={`${token.type}-${index}`}>
        {token.value}
      </span>
    )
  })
}

type CodeToken = {
  type?: 'comment' | 'string' | 'keyword' | 'number' | 'function' | 'operator' | 'tag' | 'attr'
  value: string
}

function tokenizeCode(code: string, language: string): CodeToken[] {
  const keywords = keywordPattern(language)
  const patterns: Array<{ type: CodeToken['type']; pattern: RegExp }> = [
    { type: 'comment', pattern: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/ },
    { type: 'string', pattern: /^(`(?:\\[\s\S]|[^`\\])*`|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*")/ },
    { type: 'tag', pattern: /^(<\/?[\w:-]+)/ },
    { type: 'attr', pattern: /^(\s+[\w:-]+)(?=\s*=)/ },
    { type: 'number', pattern: /^(\b\d+(?:\.\d+)?\b)/ },
    { type: 'keyword', pattern: keywords },
    { type: 'function', pattern: /^(\b[A-Za-z_$][\w$]*)(?=\s*\()/ },
    { type: 'operator', pattern: /^([{}[\]().,;:+\-*/%=!<>?&|]+)/ },
  ]
  const tokens: CodeToken[] = []
  let remaining = code

  while (remaining.length > 0) {
    const match = patterns
      .map((item) => ({ ...item, match: remaining.match(item.pattern) }))
      .find((item) => item.match)

    if (match?.match?.[0]) {
      tokens.push({ type: match.type, value: match.match[0] })
      remaining = remaining.slice(match.match[0].length)
      continue
    }

    const nextSpecial = remaining.search(/[/"'`<{}\[\]().,;:+\-*%=!<>?&|]|\b\d|\b[A-Za-z_$]/)
    const take = nextSpecial <= 0 ? 1 : nextSpecial
    tokens.push({ value: remaining.slice(0, take) })
    remaining = remaining.slice(take)
  }

  return tokens
}

function keywordPattern(language: string): RegExp {
  const common = [
    'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'default', 'do', 'else', 'extends', 'false', 'final', 'finally', 'for', 'from', 'function',
    'if', 'implements', 'import', 'in', 'interface', 'let', 'new', 'null', 'private', 'protected',
    'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
    'var', 'void', 'while',
  ]
  const java = ['boolean', 'double', 'int', 'long', 'new', 'package', 'throws']
  const markup = ['body', 'div', 'head', 'html', 'script']
  const words = language === 'java'
    ? [...common, ...java]
    : language === 'markup'
      ? markup
      : common

  return new RegExp(`^(\\b(?:${words.join('|')})\\b)`)
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

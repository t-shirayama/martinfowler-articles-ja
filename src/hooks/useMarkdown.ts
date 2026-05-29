import { useEffect, useState } from 'react'
import type { MarkdownStatus, PageDefinition } from '../types'

export function useMarkdown(page: PageDefinition | undefined): {
  markdown: string
  status: MarkdownStatus
} {
  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState<MarkdownStatus>('loading')

  useEffect(() => {
    if (!page) {
      setStatus('not-found')
      setMarkdown('')
      return
    }

    let active = true
    setStatus('loading')

    fetch(page.markdownPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Markdown fetch failed: ${response.status}`)
        }
        return response.text()
      })
      .then((text) => {
        if (!active) return
        setMarkdown(text)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setMarkdown('')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page])

  return { markdown, status }
}

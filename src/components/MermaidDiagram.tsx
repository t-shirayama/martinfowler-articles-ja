import { useEffect, useMemo, useState } from 'react'

type MermaidDiagramProps = {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useMemo(() => `mermaid-${crypto.randomUUID().replace(/-/g, '')}`, [])
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    import('mermaid')
      .then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true,
          },
          themeVariables: {
            primaryColor: '#fdf2f8',
            primaryBorderColor: '#e83e8c',
            primaryTextColor: '#07122f',
            lineColor: '#5f6c80',
            secondaryColor: '#ffffff',
            tertiaryColor: '#f8fafc',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        })
        return mermaid.render(id, chart)
      })
      .then((result) => {
        if (!active) return
        setSvg(result.svg)
        setError('')
      })
      .catch((caught: unknown) => {
        if (!active) return
        setSvg('')
        setError(caught instanceof Error ? caught.message : 'Mermaid diagram could not be rendered.')
      })

    return () => {
      active = false
    }
  }, [chart, id])

  if (error) {
    return (
      <figure className="diagram diagram--error">
        <figcaption>Mermaid diagram error</figcaption>
        <pre>{error}</pre>
        <details>
          <summary>図のソースを表示</summary>
          <pre>{chart}</pre>
        </details>
      </figure>
    )
  }

  return (
    <figure className="diagram diagram--mermaid">
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="loading">図を描画しています...</p>}
    </figure>
  )
}

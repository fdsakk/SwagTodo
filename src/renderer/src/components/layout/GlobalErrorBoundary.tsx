import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorSource = 'react' | 'window' | 'promise'

type GlobalErrorBoundaryProps = {
  children: ReactNode
}

type GlobalErrorBoundaryState = {
  detail: string | null
  error: Error | null
  source: ErrorSource | null
}

const INITIAL_STATE: GlobalErrorBoundaryState = {
  detail: null,
  error: null,
  source: null
}

const normalizeError = (value: unknown, fallback: string): Error => {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)

  try {
    return new Error(JSON.stringify(value))
  } catch {
    return new Error(fallback)
  }
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = INITIAL_STATE

  componentDidMount(): void {
    window.addEventListener('error', this.handleWindowError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount(): void {
    window.removeEventListener('error', this.handleWindowError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[renderer] react error', error, info)
    this.setState({
      detail: info.componentStack?.trim() || null,
      error,
      source: 'react'
    })
  }

  handleWindowError = (event: ErrorEvent): void => {
    if (event.target && event.target !== window) {
      console.error('[renderer] resource load error', event.target)
      return
    }

    const error = normalizeError(event.error ?? event.message, 'Unknown renderer error')
    console.error('[renderer] window error', error)
    this.setState({
      detail: event.filename ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}` : null,
      error,
      source: 'window'
    })
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error = normalizeError(event.reason, 'Unhandled promise rejection')
    console.error('[renderer] unhandled rejection', error)
    this.setState({
      detail: null,
      error,
      source: 'promise'
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { children } = this.props
    const { error, detail, source } = this.state

    if (!error) return children

    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6 py-10 text-app-text-primary">
        <div className="w-full max-w-xl rounded-2xl border border-app-border bg-app-content p-6 shadow-2xl shadow-black/30">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-app-text-muted">Runtime guard</p>
            <h1 className="text-2xl font-semibold text-app-text-primary">
              App hit error, but still alive.
            </h1>
            <p className="text-sm text-app-text-secondary">
              Source: <span className="font-medium text-app-text-primary">{source}</span>
            </p>
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {error.message || 'Unknown error'}
            </p>
            {detail && (
              <pre className="overflow-x-auto rounded-xl border border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-muted">
                {detail}
              </pre>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Reload app
            </button>
            <button
              type="button"
              onClick={() => this.setState(INITIAL_STATE)}
              className="rounded-xl border border-app-border px-4 py-2 text-sm text-app-text-secondary transition-colors hover:text-app-text-primary"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  }
}

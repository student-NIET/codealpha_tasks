import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Children,
  isValidElement,
  type ReactNode,
} from "react"

// ─── Context ────────────────────────────────────────────────────────────────

interface RouterCtxValue {
  location: string
  navigate: (to: string, replace?: boolean) => void
}

const RouterCtx = createContext<RouterCtxValue>({
  location: "/",
  navigate: () => {},
})

const RouteParamsCtx = createContext<Record<string, string>>({})

// ─── BrowserRouter ───────────────────────────────────────────────────────────

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(
    window.location.pathname + window.location.search
  )

  useEffect(() => {
    const handler = () =>
      setLocation(window.location.pathname + window.location.search)
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [])

  const navigate = useCallback((to: string, replace = false) => {
    if (replace) {
      window.history.replaceState(null, "", to)
    } else {
      window.history.pushState(null, "", to)
    }
    setLocation(window.location.pathname + window.location.search)
  }, [])

  return (
    <RouterCtx.Provider value={{ location, navigate }}>
      {children}
    </RouterCtx.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useNavigate() {
  const { navigate } = useContext(RouterCtx)
  return navigate
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): Partial<T> {
  return useContext(RouteParamsCtx) as Partial<T>
}

export function useSearchParams(): [URLSearchParams, (p: URLSearchParams) => void] {
  const { location, navigate } = useContext(RouterCtx)
  const search = location.includes("?") ? location.slice(location.indexOf("?")) : ""
  const searchParams = new URLSearchParams(search)
  const setSearchParams = (p: URLSearchParams) => {
    navigate(`${window.location.pathname}?${p.toString()}`)
  }
  return [searchParams, setSearchParams]
}

// ─── Path matching ───────────────────────────────────────────────────────────

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const keys: string[] = []
  const regexStr = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) { keys.push(seg.slice(1)); return "([^/]+)" }
      if (seg === "*") return ".*"
      return seg.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    })
    .join("\\/")

  const match = pathname.match(new RegExp(`^${regexStr}\\/?$`))
  if (!match) return null

  const params: Record<string, string> = {}
  keys.forEach((k, i) => { params[k] = match[i + 1] })
  return params
}

// ─── Routes / Route ──────────────────────────────────────────────────────────

interface RouteProps {
  path: string
  element: ReactNode
}

export function Route(_: RouteProps): null { return null }

export function Routes({ children }: { children: ReactNode }) {
  const { location } = useContext(RouterCtx)
  const pathname = location.split("?")[0]

  const routes: RouteProps[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child) && (child.props as RouteProps).path !== undefined) {
      routes.push(child.props as RouteProps)
    }
  })

  for (const { path, element } of routes) {
    const params = matchPath(path, pathname)
    if (params !== null) {
      return (
        <RouteParamsCtx.Provider value={params}>
          {element}
        </RouteParamsCtx.Provider>
      )
    }
  }
  return null
}

// ─── Navigate ────────────────────────────────────────────────────────────────

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const { navigate } = useContext(RouterCtx)
  useEffect(() => { navigate(to, replace) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ─── Link ────────────────────────────────────────────────────────────────────

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  replace?: boolean
}

export function Link({ to, replace, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useContext(RouterCtx)
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
        navigate(to, replace)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

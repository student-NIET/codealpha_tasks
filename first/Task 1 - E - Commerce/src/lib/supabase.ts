const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const SESSION_KEY = "sb_session"

export interface User {
  id: string
  email?: string
  [key: string]: unknown
}

export interface Session {
  access_token: string
  refresh_token: string
  user: User
}

type AuthListener = (event: string, session: Session | null) => void
const listeners: AuthListener[] = []

function getSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") } catch { return null }
}

function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
  listeners.forEach((fn) => fn(session ? "SIGNED_IN" : "SIGNED_OUT", session))
}

function baseHeaders(): Record<string, string> {
  const session = getSession()
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  }
}

export type DbError = { message: string }
export type Result<T> = { data: T | null; error: DbError | null }

class QueryBuilder<T> {
  private _table: string
  private _columns = "*"
  private _filters: [string, string][] = []
  private _order: string | null = null
  private _singleRow = false

  constructor(table: string) { this._table = table }

  select(columns = "*") { this._columns = columns; return this }

  eq(col: string, val: string | number) {
    this._filters.push([col, `eq.${val}`])
    return this
  }

  ilike(col: string, pattern: string) {
    this._filters.push([col, `ilike.${pattern}`])
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._order = `${col}.${opts?.ascending === false ? "desc" : "asc"}`
    return this
  }

  single() { this._singleRow = true; return this }

  async insert(data: object | object[]): Promise<Result<T[]>> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}`, {
        method: "POST",
        headers: { ...baseHeaders(), Prefer: "return=representation" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        return { data: null, error: { message: e.message ?? res.statusText } }
      }
      const json = await res.json()
      return { data: (Array.isArray(json) ? json : [json]) as T[], error: null }
    } catch (e) {
      return { data: null, error: { message: String(e) } }
    }
  }

  then<R1 = Result<T | T[]>, R2 = never>(
    ok?: ((v: Result<T | T[]>) => R1 | PromiseLike<R1>) | null,
    fail?: ((e: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this._run().then(ok, fail)
  }

  private async _run(): Promise<Result<T | T[]>> {
    try {
      const params = new URLSearchParams({ select: this._columns })
      this._filters.forEach(([k, v]) => params.set(k, v))
      if (this._order) params.set("order", this._order)

      const headers: Record<string, string> = { ...baseHeaders() }
      if (this._singleRow) headers["Accept"] = "application/vnd.pgrst.object+json"

      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${params}`, { headers })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        return { data: null, error: { message: e.message ?? res.statusText } }
      }
      const json = await res.json()
      return { data: json as T | T[], error: null }
    } catch (e) {
      return { data: null, error: { message: String(e) } }
    }
  }
}

export const supabase = {
  from<T = unknown>(table: string) { return new QueryBuilder<T>(table) },

  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      return { data: { session: getSession() }, error: null }
    },

    async signUp(creds: { email: string; password: string }): Promise<{ data: unknown; error: DbError | null }> {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        })
        const json = await res.json()
        if (!res.ok) return { data: null, error: { message: json.msg ?? json.message ?? "Sign up failed" } }
        return { data: json, error: null }
      } catch (e) {
        return { data: null, error: { message: String(e) } }
      }
    },

    async signInWithPassword(creds: { email: string; password: string }): Promise<{ data: unknown; error: DbError | null }> {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        })
        const json = await res.json()
        if (!res.ok) return { data: null, error: { message: json.error_description ?? json.message ?? "Sign in failed" } }
        const session: Session = { access_token: json.access_token, refresh_token: json.refresh_token, user: json.user }
        saveSession(session)
        return { data: { session }, error: null }
      } catch (e) {
        return { data: null, error: { message: String(e) } }
      }
    },

    async signOut(): Promise<{ error: null }> {
      const s = getSession()
      if (s) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` },
        }).catch(() => {})
      }
      saveSession(null)
      return { error: null }
    },

    onAuthStateChange(fn: AuthListener): { data: { subscription: { unsubscribe: () => void } } } {
      listeners.push(fn)
      setTimeout(() => { const s = getSession(); fn(s ? "SIGNED_IN" : "SIGNED_OUT", s) }, 0)
      return {
        data: {
          subscription: {
            unsubscribe() {
              const i = listeners.indexOf(fn)
              if (i !== -1) listeners.splice(i, 1)
            },
          },
        },
      }
    },
  },
}

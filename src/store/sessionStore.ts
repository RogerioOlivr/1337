import { create } from 'zustand'

interface SessionUser {
  id: number
  nome: string
  email: string
  role: string
}

interface SessionStore {
  user: SessionUser | null
  checked: boolean // true após a primeira verificação
  setUser: (user: SessionUser | null) => void
  fetchSession: () => Promise<void>
  logout: () => Promise<void>
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  checked: false,

  setUser: (user) => set({ user, checked: true }),

  fetchSession: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const json = await res.json()
        set({ user: json.data, checked: true })
      } else {
        set({ user: null, checked: true })
      }
    } catch {
      set({ user: null, checked: true })
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, checked: true })
  },
}))

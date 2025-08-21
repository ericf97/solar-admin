import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiState {
  baseUrl: string
  bearerToken: string | null
  email: string | null
  setBaseUrl: (url: string) => void
  setBearerToken: (token: string | null) => void
  setEmail: (email: string | null) => void
}

export const useApiStore = create<ApiState>()(
  persist(
    (set) => ({
      baseUrl: 'https://apidev.kykuyo.com',
      bearerToken: null,
      email: null,
      setBaseUrl: (url: string) => set({ baseUrl: url }),
      setBearerToken: (token: string | null) => set({ bearerToken: token }),
      setEmail: (email: string | null) => set({ email }),
    }),
    {
      name: 'local-storage'
    }
))

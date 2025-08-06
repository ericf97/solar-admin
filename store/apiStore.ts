import { create } from 'zustand'

interface ApiState {
  baseUrl: string
  bearerToken: string | null
  setBaseUrl: (url: string) => void
  setBearerToken: (token: string | null) => void
}

export const useApiStore = create<ApiState>((set) => ({
  baseUrl: 'http://localhost:3000',
  bearerToken: null,
  setBaseUrl: (url) => set({ baseUrl: url }),
  setBearerToken: (token) => set({ bearerToken: token }),
}))


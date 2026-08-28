const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface FlashyUser {
    name: string
    email: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}/api${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Something went wrong. Try again.')
    }

    if (res.status === 204) return undefined as T
    return res.json()
}

export const signup = (name: string, email: string, password: string) =>
    request<{ user: FlashyUser }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    })

export const login = (email: string, password: string) =>
    request<{ user: FlashyUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

export const logout = () => request<void>('/auth/logout', { method: 'POST' })

export const fetchMe = () => request<{ user: FlashyUser }>('/auth/me')
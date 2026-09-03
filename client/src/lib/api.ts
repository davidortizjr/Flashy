const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface FlashyUser {
    name: string
    email: string
}

export interface Deck {
    id: string
    title: string
    source: 'photo' | 'text'
    cardCount: number
    createdAt: string
}

export interface FlashyCard {
    id: string
    front: string
    back: string
}

export class ApiError extends Error {
    status: number
    code?: string
    plan?: string
    cap?: number

    constructor(message: string, status: number, body: Record<string, unknown> | null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = typeof body?.code === 'string' ? body.code : undefined
        this.plan = typeof body?.plan === 'string' ? body.plan : undefined
        this.cap = typeof body?.cap === 'number' ? body.cap : undefined
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData
    const res = await fetch(`${API_URL}/api${path}`, {
        credentials: 'include',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        ...options,
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new ApiError(body?.error ?? 'Something went wrong. Try again.', res.status, body)
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

export const importDeck = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ deck: Deck; cards: FlashyCard[]; requestedCount: number; truncated: boolean }>(
        '/decks/import',
        {
            method: 'POST',
            body: formData,
        },
    )
}

export const listDecks = () => request<{ decks: Deck[] }>('/decks')

export const fetchDeck = (id: string) => request<{ deck: Deck; cards: FlashyCard[] }>(`/decks/${id}`)

export const deleteDeck = (id: string) => request<void>(`/decks/${id}`, { method: 'DELETE' })

// ---- Billing ----

export type PlanId = 'free' | 'basic' | 'pro_monthly' | 'pro_yearly'
export type PayablePlanId = 'basic' | 'pro_monthly' | 'pro_yearly'

export interface PlanInfo {
    plan: PlanId
    label: string
    unlimited: boolean
    cap: number | null
    used: number
    remaining: number | null
    expiresAt: string | null
}

export interface CheckoutResponse {
    paymentIntentId: string
    qrImage: string // data URL, render directly in <img src>
    amount: number
    plan: PayablePlanId
    planLabel: string
    expiresInSeconds: number
}

export interface PaymentStatus {
    status: 'pending' | 'paid' | 'failed'
}

export const getPlanInfo = () => request<PlanInfo>('/billing/plan')

export const startCheckout = (plan: PayablePlanId) =>
    request<CheckoutResponse>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
    })

export const getPaymentStatus = (paymentIntentId: string) =>
    request<PaymentStatus>(`/billing/status/${paymentIntentId}`)
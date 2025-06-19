'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  signOut: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error && error.message.includes('user_not_found')) {
        supabase.auth.signOut()
        setUser(null)
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login')
        }
        return
      }
      setUser(data.user)
      // If authenticated and on /login or /signup, redirect to home
      if (data.user && (pathname === '/login' || pathname === '/signup')) {
        router.replace('/')
      }
      // If not authenticated and not on /login or /signup, redirect to login
      if (!data.user && pathname !== '/login' && pathname !== '/signup') {
        router.replace('/login')
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login')
        }
        return
      }
      setUser(session.user)
      // If authenticated and on /login or /signup, redirect to home
      if (session.user && (pathname === '/login' || pathname === '/signup')) {
        router.replace('/')
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>
}

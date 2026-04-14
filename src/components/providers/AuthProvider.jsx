'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isOnboarded: false,
  communityId: null,
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    }

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      
      if (currentUser) {
        // Normalize for Firebase compatibility
        currentUser.displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0]
        currentUser.photoURL = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture
        setUser(currentUser)
        await fetchProfile(currentUser.id)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      
      if (currentUser) {
        // Normalize for Firebase compatibility
        currentUser.displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0]
        currentUser.photoURL = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture
        setUser(currentUser)
        await fetchProfile(currentUser.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isOnboarded = !!(profile && profile.has_joined_community);
  const communityId = profile?.has_joined_community || null;


  return (
    <AuthContext.Provider value={{ user, profile, loading, isOnboarded, communityId }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

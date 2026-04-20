import { supabase } from './supabase'

const formatError = (error) => {
  if (!error) return 'Unknown error'
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error))
  } catch {
    return String(error)
  }
}

export const syncUserProfile = async (user, name) => {
  if (!user) return

  const profile = {
    id: user.id,
    name: name?.trim() || user.email?.split('@')[0] || 'Anonymous'
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([profile], { upsert: true, onConflict: 'id' })

    if (error) {
      const message = formatError(error)
      if (error.code === '42501' || message.includes('row-level security')) {
        console.warn('RLS blocked user sync; auth trigger should handle insertion:', message)
        return null
      }
      console.error('Error syncing user profile:', message)
      throw error
    }

    return data
  } catch (error) {
    const message = formatError(error)
    if (error.code === '42501' || message.includes('row-level security')) {
      console.warn('RLS blocked user sync; auth trigger should handle insertion:', message)
      return null
    }
    console.error('User sync failed:', message)
    throw error
  }
}

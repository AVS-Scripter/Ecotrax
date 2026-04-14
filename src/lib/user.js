import { supabase } from './supabase'

export const syncUserProfile = async (user, name) => {
  if (!user) return

  try {
    // We use upsert with onConflict if we want to ensure no duplicates, 
    // but the task says "Runs only on first signup" and "No duplicate inserts".
    // A simple insert might fail if ID exists, or we can check first.
    // However, usually a single 'upsert' or 'insert' with RLS/Constraints handles this.
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        { id: user.id, name: name || user.email?.split('@')[0] || 'Anonymous' }
      ], { upsert: false }) // upsert: false will error if primary key exists

    if (error && error.code !== '23505') { // 23505 is unique violation (already exists)
      console.error('Error syncing user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('User sync failed:', error)
  }
}

import { supabase } from './supabase'

/**
 * Creates a new community via Supabase RPC
 * @param {string} name 
 * @param {string} icon 
 * @returns {Promise<any>}
 */
export const createCommunity = async (name, icon) => {
  const { data, error } = await supabase.rpc('create_community', {
    p_name: name,
    p_icon: icon
  })
  
  if (error) {
    console.error('Error creating community:', error)
    throw error
  }
  
  return data
}

/**
 * Joins a community via invite code using Supabase RPC
 * @param {string} inviteCode 
 * @returns {Promise<any>}
 */
export const joinCommunity = async (inviteCode) => {
  const { data, error } = await supabase.rpc('join_via_invite', {
    p_invite_code: inviteCode
  })
  
  if (error) {
    console.error('Error joining community:', error)
    throw error
  }
  
  return data
}

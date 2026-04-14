import { supabase } from './supabase'

const normalizeRpcResult = (data) => {
  if (data == null) return null
  if (Array.isArray(data)) return data[0]
  return data
}

/**
 * Creates a new community via Supabase RPC
 * @param {string} name 
 * @param {string} icon 
 * @param {string} userId
 * @param {string} displayName
 * @returns {Promise<{communityId: string}>}
 */
export const createCommunity = async (name, icon, userId, displayName) => {
  const { data, error } = await supabase.rpc('create_community', {
    p_name: name,
    p_icon: icon,
    p_created_by: userId,
    p_display_name: displayName,
  })

  if (error) {
    console.error('Error creating community:', error)
    throw error
  }

  const communityId = normalizeRpcResult(data)
  if (!communityId) {
    throw new Error('Unable to determine created community ID.')
  }

  return { communityId }
}

/**
 * Joins a community via invite code using Supabase RPC
 * @param {string} inviteCode 
 * @param {string} userId
 * @param {string} displayName
 * @returns {Promise<string|null>}
 */
export const joinCommunity = async (inviteCode, userId, displayName) => {
  const { data, error } = await supabase.rpc('join_via_invite', {
    p_code: inviteCode,
    p_user_id: userId,
    p_display_name: displayName,
  })

  if (error) {
    console.error('Error joining community:', error)
    throw error
  }

  return normalizeRpcResult(data)
}

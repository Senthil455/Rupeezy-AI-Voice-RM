// src/hooks/useLeads.js
import { useState, useEffect, useCallback } from 'react'
import { leadsApi, analyticsApi } from '../services/api'

export function useLeads(statusFilter = null) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const data = await leadsApi.getAll(statusFilter)
      setLeads(data.leads || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const refetch = fetchLeads

  return { leads, loading, error, refetch, setLeads }
}

export function useAnalytics() {
  const [snapshot, setSnapshot] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [rmQueue, setRmQueue] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const [snap, fun, queue] = await Promise.all([
        analyticsApi.snapshot(),
        analyticsApi.funnel(),
        analyticsApi.rmQueue(),
      ])
      setSnapshot(snap)
      setFunnel(fun.stages || [])
      setRmQueue(queue.queue || [])
    } catch (e) {
      console.error('Analytics fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { snapshot, funnel, rmQueue, loading, refetch: fetch }
}

// src/hooks/useConversation.js
export function useConversation() {
  const [convId, setConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [state, setState] = useState('INIT')
  const [language, setLanguage] = useState('english')
  const [score, setScore] = useState(null)
  const [summary, setSummary] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Timer
  useEffect(() => {
    let timer
    if (isActive) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(timer)
  }, [isActive])

  const addMessage = (role, content, meta = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role, content,
      timestamp: new Date().toISOString(),
      ...meta
    }])
  }

  const startCall = async (leadId, lang) => {
    const { agentApi } = await import('../services/api')
    const result = await agentApi.startCall(leadId, lang)
    setConvId(result.conversation_id)
    setLanguage(result.language)
    setIsActive(true)
    setMessages([])
    setSummary(null)
    setScore(null)
    setState('GREETING')
    addMessage('agent', result.opening_message)
    return result
  }

  const sendMessage = async (text) => {
    if (!convId || !isActive) return
    addMessage('user', text)
    setIsTyping(true)
    try {
      const { agentApi } = await import('../services/api')
      const result = await agentApi.sendMessage(convId, text)
      setIsTyping(false)
      addMessage('agent', result.response)
      setState(result.state)
      setLanguage(result.language)
      if (result.quick_score) {
        setScore(result.quick_score)
      }
      return result
    } catch (e) {
      setIsTyping(false)
      addMessage('agent', 'Sorry, I had a connection issue. Let me try again...')
    }
  }

  const endCall = async () => {
    if (!convId) return
    setIsActive(false)
    setIsTyping(false)
    try {
      const { agentApi } = await import('../services/api')
      const result = await agentApi.endCall(convId)
      setScore(result.score)
      setSummary(result.summary)
      setState('END')
      return result
    } catch (e) {
      console.error('End call failed:', e)
    }
  }

  const resetConversation = () => {
    setConvId(null)
    setMessages([])
    setState('INIT')
    setScore(null)
    setSummary(null)
    setIsActive(false)
    setIsTyping(false)
    setCallDuration(0)
  }

  return {
    convId, messages, state, language, score, summary,
    isActive, isTyping, callDuration,
    startCall, sendMessage, endCall, resetConversation
  }
}

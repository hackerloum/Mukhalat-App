import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function SimpleTest() {
  const [status, setStatus] = useState('Initializing...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing Supabase connection...')
        
        // Test 1: Basic connection
        const { data: session, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`)
        }
        
        setStatus('Connection successful, checking user...')
        setUser(session?.user || null)
        
        // Test 2: Database connection
        const { data: testData, error: dbError } = await supabase
          .from('app_users')
          .select('count')
          .limit(1)
        
        if (dbError) {
          console.warn('Database test failed:', dbError)
          setStatus('Connected but database access limited')
        } else {
          setStatus('Full connection successful!')
        }
        
      } catch (err: any) {
        setError(err.message)
        setStatus('Connection failed')
        console.error('Connection test error:', err)
      }
    }

    testConnection()
  }, [])

  const handleSignIn = async () => {
    try {
      setStatus('Attempting sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      })
      
      if (error) {
        setError(`Sign in error: ${error.message}`)
      } else {
        setUser(data.user)
        setStatus('Sign in successful!')
      }
    } catch (err: any) {
      setError(`Sign in failed: ${err.message}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setStatus('Signed out')
    } catch (err: any) {
      setError(`Sign out failed: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Status:</div>
          <div className="font-mono text-sm bg-gray-100 p-2 rounded">
            {status}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {user && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
            <div>User ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Test Sign In
          </button>
          
          {user && (
            <button
              onClick={handleSignOut}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Sign Out
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <div>Supabase URL: {supabase.supabaseUrl}</div>
          <div>Current URL: {window.location.href}</div>
        </div>
      </div>
    </div>
  )
}



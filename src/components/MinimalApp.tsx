import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Create a fresh Supabase client
const supabaseUrl = 'https://prsxpmhfbdhekrkjiuti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3hwbWhmYmRoZWtya2ppdXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTMwNDYsImV4cCI6MjA3NDI4OTA0Nn0.HiPS3ibFT3Zv2SBTVduWngl0Y4rbSyw91XW8cQL3N6w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function MinimalApp() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('Initializing...')

  useEffect(() => {
    const init = async () => {
      try {
        setStep('Getting session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`)
        }
        
        setStep('Session retrieved')
        setUser(session?.user || null)
        setLoading(false)
        
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
        console.error('Initialization error:', err)
      }
    }

    init()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      setStep('Signing in...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      setUser(data.user)
      setStep('Signed in successfully')
      setLoading(false)
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setStep('Sign in failed')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setStep('Signed out')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{step}</p>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onSignIn={handleSignIn} error={error} />
  }

  return <Dashboard user={user} onSignOut={handleSignOut} />
}

function LoginForm({ onSignIn, error }: { onSignIn: (email: string, password: string) => void, error: string | null }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSignIn(email, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mukhallat App</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Dashboard({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [perfumes, setPerfumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPerfumes = async () => {
      try {
        const { data, error } = await supabase
          .from('perfumes')
          .select('*')
          .limit(10)

        if (error) {
          console.error('Error loading perfumes:', error)
        } else {
          setPerfumes(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPerfumes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Mukhallat App</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={onSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Perfume Inventory</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading perfumes...</p>
            </div>
          ) : (
            <div>
              {perfumes.length > 0 ? (
                <div className="space-y-4">
                  {perfumes.map((perfume) => (
                    <div key={perfume.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{perfume.name}</h3>
                      <p className="text-sm text-gray-600">{perfume.brand}</p>
                      <p className="text-sm">Quantity: {perfume.quantity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No perfumes found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



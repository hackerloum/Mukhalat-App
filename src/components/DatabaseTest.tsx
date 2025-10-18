import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function DatabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    const results = []
    
    try {
      // Test 1: Basic connection
      const { data: session } = await supabase.auth.getSession()
      results.push({
        test: 'Authentication Session',
        status: session ? '✅ Connected' : '❌ No Session',
        details: session ? `User: ${session.user?.email}` : 'No active session'
      })

      // Test 2: App Users table
      const { data: users, error: usersError } = await supabase
        .from('app_users')
        .select('count')
        .limit(1)
      
      results.push({
        test: 'App Users Table',
        status: usersError ? '❌ Error' : '✅ Connected',
        details: usersError ? usersError.message : 'Table accessible'
      })

      // Test 3: Perfumes table
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('count')
        .limit(1)
      
      results.push({
        test: 'Perfumes Table',
        status: perfumesError ? '❌ Error' : '✅ Connected',
        details: perfumesError ? perfumesError.message : 'Table accessible'
      })

      // Test 4: Orders table
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('count')
        .limit(1)
      
      results.push({
        test: 'Orders Table',
        status: ordersError ? '❌ Error' : '✅ Connected',
        details: ordersError ? ordersError.message : 'Table accessible'
      })

      // Test 5: Expenses table
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('count')
        .limit(1)
      
      results.push({
        test: 'Expenses Table',
        status: expensesError ? '❌ Error' : '✅ Connected',
        details: expensesError ? expensesError.message : 'Table accessible'
      })

      // Test 6: Audit Logs table
      const { data: auditLogs, error: auditLogsError } = await supabase
        .from('audit_logs')
        .select('count')
        .limit(1)
      
      results.push({
        test: 'Audit Logs Table',
        status: auditLogsError ? '❌ Error' : '✅ Connected',
        details: auditLogsError ? auditLogsError.message : 'Table accessible'
      })

      setConnectionStatus('✅ All tests completed')
      
    } catch (error) {
      results.push({
        test: 'General Error',
        status: '❌ Failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      setConnectionStatus('❌ Tests failed')
    }

    setTestResults(results)
    setLoading(false)
  }

  const getActualDataCounts = async () => {
    try {
      const [usersResult, perfumesResult, ordersResult, expensesResult, auditLogsResult] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('perfumes').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('expenses').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true })
      ])

      return {
        users: usersResult.count || 0,
        perfumes: perfumesResult.count || 0,
        orders: ordersResult.count || 0,
        expenses: expensesResult.count || 0,
        auditLogs: auditLogsResult.count || 0
      }
    } catch (error) {
      console.error('Error getting data counts:', error)
      return null
    }
  }

  const [dataCounts, setDataCounts] = useState<any>(null)

  useEffect(() => {
    getActualDataCounts().then(setDataCounts)
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Connection Test</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Running tests...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Table Access Tests</h3>
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{result.test}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{result.details}</p>
            </div>
          ))}
        </div>
      )}

      {dataCounts && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Counts</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{dataCounts.users}</div>
              <div className="text-sm text-blue-800">Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{dataCounts.perfumes}</div>
              <div className="text-sm text-green-800">Perfumes</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{dataCounts.orders}</div>
              <div className="text-sm text-yellow-800">Orders</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{dataCounts.expenses}</div>
              <div className="text-sm text-red-800">Expenses</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{dataCounts.auditLogs}</div>
              <div className="text-sm text-purple-800">Audit Logs</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Supabase Configuration:</h4>
        <p className="text-sm text-gray-600">URL: https://prsxpmhfbdhekrkjiuti.supabase.co</p>
        <p className="text-sm text-gray-600">Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
      </div>
    </div>
  )
}



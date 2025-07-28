'use client'

import { useState, useEffect } from 'react'
import { addCMJTest, getCMJHistory } from '@/app/actions/workout'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { format } from 'date-fns'

interface CMJTrackerProps {
  workoutId: string
  onUpdate: () => void
}

export function CMJTracker({ workoutId, onUpdate }: CMJTrackerProps) {
  const [height, setHeight] = useState('')
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  const loadHistory = async () => {
    const data = await getCMJHistory(30)
    setHistory(data)
  }
  
  const handleSave = async () => {
    if (!height) return
    
    setIsSaving(true)
    await addCMJTest(workoutId, parseFloat(height), notes || undefined)
    setHeight('')
    setNotes('')
    setIsSaving(false)
    loadHistory()
    onUpdate()
  }
  
  const avgHeight = history.length > 0
    ? history.reduce((sum, test) => sum + test.heightCm, 0) / history.length
    : 0
  
  const lastHeight = history.length > 0 ? history[0].heightCm : 0
  const percentChange = lastHeight && avgHeight
    ? ((lastHeight - avgHeight) / avgHeight) * 100
    : 0
  
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        CMJ Test
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Jump Height (cm)
          </label>
          <input
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="45.5"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pre-workout, post-workout, etc."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleSave}
          disabled={!height || isSaving}
          className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Record Jump'}
        </button>
        
        {history.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Recent Performance</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Last Jump</p>
                <p className="text-2xl font-bold">{lastHeight.toFixed(1)} cm</p>
                {percentChange !== 0 && (
                  <p className={`text-sm flex items-center justify-center gap-1 ${percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(percentChange).toFixed(1)}% vs avg
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">30-Day Average</p>
                <p className="text-2xl font-bold">{avgHeight.toFixed(1)} cm</p>
              </div>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.slice(0, 5).map((test) => (
                <div key={test.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {format(new Date(test.createdAt), 'MMM d, h:mm a')}
                  </span>
                  <span className="font-medium">{test.heightCm.toFixed(1)} cm</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
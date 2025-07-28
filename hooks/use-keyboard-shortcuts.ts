import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifier?: 'cmd' | 'ctrl' | 'alt' | 'shift'
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: KeyboardShortcut[] = [
    { key: 'h', description: 'Go to Home', action: () => router.push('/') },
    { key: 'c', description: 'Go to Calendar', action: () => router.push('/calendar') },
    { key: 'p', description: 'Go to Progress', action: () => router.push('/progress') },
    { key: 't', description: 'Go to Templates', action: () => router.push('/templates') },
    { key: 'n', description: 'Create new workout', action: () => router.push('/workout/new') },
    { key: '?', description: 'Show keyboard shortcuts', action: () => setShowHelp(true) },
    { key: 'Escape', description: 'Close help', action: () => setShowHelp(false) },
  ]

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable) {
      return
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      if (s.modifier) {
        const modifierPressed = s.modifier === 'cmd' ? e.metaKey : 
                              s.modifier === 'ctrl' ? e.ctrlKey :
                              s.modifier === 'alt' ? e.altKey :
                              s.modifier === 'shift' ? e.shiftKey : false
        return modifierPressed && e.key === s.key
      }
      return e.key === s.key
    })

    if (shortcut) {
      e.preventDefault()
      shortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return { shortcuts, showHelp, setShowHelp }
}
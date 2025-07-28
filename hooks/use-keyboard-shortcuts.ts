import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Cmd/Ctrl + K: Quick search (could open exercise search)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // This could open a global command palette
      }

      // Shortcuts with no modifiers
      switch (e.key) {
        case 'h':
          router.push('/')
          break
        case 'c':
          router.push('/calendar')
          break
        case 'p':
          router.push('/progress')
          break
        case 't':
          router.push('/templates')
          break
        case 'n':
          // Create new workout (would need to implement)
          break
        case '?':
          // Show keyboard shortcuts help
          alert(`Keyboard Shortcuts:
h - Home
c - Calendar  
p - Progress
t - Templates
n - New workout
? - Show this help`)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])
}
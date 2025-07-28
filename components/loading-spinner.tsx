export function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  }

  return (
    <div className={`animate-spin rounded-full border-gray-700 border-t-blue-500 ${sizeClasses[size]} ${className}`} />
  )
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="md" />
      <p className="text-gray-400">Loading...</p>
    </div>
  )
}
// app/components/Navigation.tsx
import { useState } from "react";
import { AppView, AppDispatch } from "~/types";
import { createSupabaseClient } from "~/lib/supabase.client";
import type { User } from "@supabase/supabase-js";

interface NavigationProps {
  currentView: AppView;
  dispatch: AppDispatch;
  metricsCount: number;
  onCollapsedChange?: (collapsed: boolean) => void;
  user?: User | null;
}

export function Navigation({ currentView, dispatch, metricsCount, onCollapsedChange, user }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.reload();
  };
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", color: "blue" },
    { id: "workout-selection", label: "Entrenar", icon: "🏋️", color: "green" },
    { id: "calendar", label: "Calendario", icon: "📅", color: "purple" },
    { id: "progress", label: "Progreso", icon: "📈", color: "orange" },
    { id: "exercises", label: "Ejercicios", icon: "💪", color: "indigo" },
    { id: "timer", label: "Timer", icon: "⏱️", color: "yellow" },
    { id: "templates", label: "Plantillas", icon: "📄", color: "pink" },
  ];

  const isActive = (view: string) => currentView === view;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 z-40 transition-all duration-300 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="text-3xl">💪</div>
              {!isCollapsed && (
                <div className="animate-fadeIn">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Gym Tracker
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tu progreso diario</p>
                </div>
              )}
            </div>
            <button
              onClick={handleToggleCollapse}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                isCollapsed ? 'absolute right-2' : ''
              }`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} 
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => dispatch({ type: "SET_VIEW", view: item.id as AppView })}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group relative ${
                  isActive(item.id)
                    ? `bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-700 dark:text-${item.color}-400`
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={isCollapsed ? item.label : ""}
                aria-current={isActive(item.id) ? 'page' : undefined}
                aria-label={item.label}
              >
                <span className={`text-xl ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="animate-fadeIn">{item.label}</span>
                  </>
                )}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => dispatch({ type: "SET_VIEW", view: "add-metric" })}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                title={isCollapsed ? "Nueva Métrica" : ""}
                aria-label="Nueva Métrica"
              >
                <span className={`text-xl ${isCollapsed ? '' : 'mr-3'}`}>➕</span>
                {!isCollapsed && <span className="animate-fadeIn">Nueva Métrica</span>}
              </button>

              {metricsCount > 0 && (
                <button
                  onClick={() => dispatch({ type: "SET_VIEW", view: "manage-metrics" })}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mt-1`}
                  title={isCollapsed ? "Gestionar Métricas" : ""}
                  aria-label="Gestionar Métricas"
                >
                  <span className={`text-xl ${isCollapsed ? '' : 'mr-3'}`}>⚙️</span>
                  {!isCollapsed && <span className="animate-fadeIn">Gestionar Métricas</span>}
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors mt-1`}
                title={isCollapsed ? "Cerrar sesión" : ""}
                aria-label="Cerrar sesión"
              >
                <span className={`text-xl ${isCollapsed ? '' : 'mr-3'}`}>🚪</span>
                {!isCollapsed && <span className="animate-fadeIn">Cerrar sesión</span>}
              </button>
            </div>
          </nav>

          {/* User Section */}
          <div className={`flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              {!isCollapsed && (
                <div className="ml-3 flex-1 animate-fadeIn">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {user?.email || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Activo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="relative px-2 py-2">
          <div className="grid grid-cols-5 gap-1">
            {['dashboard','calendar','progress','exercises','timer'].map((id) => {
              const item = navItems.find(n => n.id === id)!;
              return (
                <button
                  key={item.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', view: item.id as AppView })}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors ${isActive(item.id) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                  aria-current={isActive(item.id) ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

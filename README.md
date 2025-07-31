# 💪 Gym Tracker

Un moderno sistema de seguimiento de fitness construido con Remix, React y TypeScript. Diseñado para ayudarte a registrar, monitorear y visualizar tu progreso físico con una interfaz intuitiva y adaptable.

## 🚀 Características Principales

### 📊 Dashboard y Métricas
- **Dashboard Central**: Vista unificada de todas tus métricas corporales
- **Métricas Personalizables**: Registra peso, grasa corporal, medidas y cualquier métrica personalizada
- **Ficha Diaria**: Formulario rápido para ingresar todas tus mediciones del día
- **Visualización de Progreso**: Gráficas interactivas para cada métrica con seguimiento temporal

### 🏋️ Gestión de Entrenamientos
- **Tipos de Entrenamiento Soportados**:
  - Push (Empuje)
  - Pull (Tirón)  
  - Legs (Piernas)
  - Cardio
  - HIIT
  - Pliometría
- **Registro Detallado**: Peso, repeticiones, RPE, tiempo de descanso
- **Sesiones en Vivo**: Timer integrado con duración en tiempo real
- **Historial Completo**: Revisa y edita entrenamientos pasados

### 📸 Seguimiento Visual
- **Fotos de Progreso**: Sistema integrado para capturar fotos diarias (frente, espalda, lateral)
- **Comparación Visual**: Organiza fotos por fecha para ver tu transformación

### 🔧 Herramientas Adicionales
- **Plantillas de Entrenamiento**: Crea y gestiona rutinas reutilizables
- **Base de Datos de Ejercicios**: Catálogo completo categorizado por grupo muscular
- **Timers Integrados**: 
  - Timer de descanso configurable
  - Timer Tabata para HIIT
- **Calendario**: Vista mensual de tu actividad y edición rápida

### 🎨 Experiencia de Usuario
- **Navegación Adaptativa**: Sidebar colapsable en desktop, navegación móvil optimizada
- **Modo Oscuro**: Tema claro/oscuro automático
- **PWA Ready**: Funciona offline y se puede instalar como app
- **Almacenamiento Local**: Todos tus datos seguros en tu navegador

## 🛠️ Stack Tecnológico

- **Framework**: [Remix](https://remix.run/) - Framework web full-stack
- **UI**: React 18 con TypeScript
- **Estilos**: Tailwind CSS para diseño responsivo
- **Build**: Vite para desarrollo rápido
- **Gestión de Estado**: useReducer con Context API
- **Almacenamiento**: LocalStorage con persistencia automática

## 📁 Estructura del Proyecto

```
gym-tracker/
├── app/
│   ├── components/         # Componentes React reutilizables
│   │   ├── AddMetricForm.tsx      # Formulario para métricas
│   │   ├── CalendarView.tsx       # Vista de calendario
│   │   ├── DailySheetForm.tsx     # Ficha diaria
│   │   ├── ExercisesView.tsx      # Gestión de ejercicios
│   │   ├── LineChart.tsx          # Gráficas de progreso
│   │   ├── Navigation.tsx         # Navegación principal
│   │   ├── PhotoUpload.tsx        # Sistema de fotos
│   │   ├── ProgressView.tsx       # Vista detallada de progreso
│   │   ├── TemplateManager.tsx    # Gestión de plantillas
│   │   ├── TimerView.tsx          # Timers de entrenamiento
│   │   ├── WorkoutActive.tsx      # Sesión activa de entrenamiento
│   │   └── WorkoutTypeSelection.tsx # Selector de tipo de entrenamiento
│   ├── data/               # Datos predeterminados
│   │   ├── defaults.ts            # Métricas y ejercicios iniciales
│   │   └── templates.ts           # Plantillas predefinidas
│   ├── hooks/              # Custom React hooks
│   │   ├── useRestTimer.ts        # Lógica del timer de descanso
│   │   └── useTabataTimer.ts      # Lógica del timer Tabata
│   ├── routes/             # Rutas de la aplicación
│   │   └── _index.tsx             # Ruta principal
│   ├── state/              # Gestión de estado
│   │   └── reducer.ts             # Reducer principal
│   ├── types/              # Definiciones TypeScript
│   │   └── index.ts               # Tipos e interfaces
│   └── utils/              # Utilidades
│       └── helpers.ts             # Funciones auxiliares
├── public/                 # Recursos públicos
│   └── sw.js                     # Service Worker para PWA
└── build/                  # Salida de compilación
```

## 🚀 Inicio Rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) v20.0.0 o superior
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/gym-tracker.git
cd gym-tracker
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Scripts Disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run build      # Compila para producción
npm run start      # Ejecuta la versión de producción
npm run lint       # Ejecuta el linter
npm run typecheck  # Verifica tipos TypeScript
```

## 🏗️ Construcción para Producción

```bash
npm run build
npm run start
```

## 🔑 Características Destacadas del Código

### Gestión de Estado Eficiente
- Reducer centralizado con acciones tipadas
- Persistencia automática en LocalStorage
- Estado optimizado para rendimiento

### Componentes Modulares
- Componentes reutilizables y bien documentados
- Props tipadas con TypeScript
- Separación clara de responsabilidades

### Experiencia de Usuario Mejorada
- Transiciones suaves entre vistas
- Formularios con validación en tiempo real
- Feedback visual inmediato

### Optimización de Rendimiento
- Lazy loading de componentes
- Imágenes optimizadas con compresión
- Service Worker para funcionamiento offline

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Add: Nueva característica'`)
4. Push a la branch (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Remix Team por el excelente framework
- Comunidad de React y TypeScript
- Todos los contribuidores del proyecto
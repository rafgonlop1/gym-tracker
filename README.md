# Gym Tracker

This is a web application built with Remix, React, and TypeScript, designed to help users track their fitness progress. It allows users to monitor various body metrics, manage their workout routines, and visualize their progress over time.

## Features

- **Dashboard:** A central hub to view all your metrics at a glance.
- **Metrics Tracking:** Add, edit, and view custom metrics like weight, body fat, etc.
- **Daily Sheet:** A form to quickly enter your daily measurements for all your metrics.
- **Progress Visualization:** View your progress for each metric with interactive charts.
- **Exercise Database:** Manage your exercises, categorized by workout type.
- **Calendar View:** See your daily entries and edit them from a calendar interface.
- **Timers:** Includes a rest timer and a Tabata timer for your workouts.
- **Dark Mode:** The application supports both light and dark themes.
- **Local Storage:** All your data is saved in your browser's local storage.

## Project Structure

The project is organized into the following main directories:

- **`app/`**: Contains the core application code.
  - **`components/`**: Reusable React components that make up the UI.
    - `AddMetricForm.tsx`: Form to add a new metric.
    - `CalendarView.tsx`: Calendar interface to view and edit daily data.
    - `DailySheetForm.tsx`: Form to enter daily measurements.
    - `ExercisesView.tsx`: View to manage exercises and categories.
    - `LineChart.tsx`: Component to display progress charts.
    - `ProgressView.tsx`: Detailed view of a metric's progress.
    - `TimerView.tsx`: Rest and Tabata timers.
  - **`data/`**: Default data for the application.
    - `defaults.ts`: Initial metrics, exercises, and categories.
  - **`hooks/`**: Custom React hooks for complex logic.
    - `useRestTimer.ts`: Logic for the rest timer.
    - `useTabataTimer.ts`: Logic for the Tabata timer.
  - **`routes/`**: Defines the application's routes.
    - `_index.tsx`: The main dashboard route.
  - **`state/`**: State management logic.
    - `reducer.ts`: The main reducer for the application state.
  - **`types/`**: TypeScript type definitions.
    - `index.ts`: All the types used in the application.
  - **`utils/`**: Utility functions.
    - `helpers.ts`: Helper functions for calculations and formatting.
- **`public/`**: Public assets like images and icons.
- **`build/`**: The compiled output of the application.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/gym-tracker.git
   ```
2. Navigate to the project directory:
   ```sh
   cd gym-tracker
   ```
3. Install the dependencies:
   ```sh
   npm install
   ```

### Development

To run the development server:

```sh
npm run dev
```

This will start the application on `http://localhost:3000`.

### Building for Production

To build the application for production:

```sh
npm run build
```

This will create a `build/` directory with the optimized production build.

### Running in Production

To run the application in production mode:

```sh
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or find any bugs.
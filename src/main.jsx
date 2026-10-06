/**
 * src/main.jsx
 * ------------------------------------------------------------------
 * Entry point. Wraps <App/> in the two app-wide context providers:
 *   AuthProvider  -> who's signed in + their role (modules/auth/AuthContext.jsx)
 *   ThemeProvider -> light/dark/system mode (modules/theme/ThemeContext.jsx)
 * Order matters only in that both must be ABOVE <App/> so every page
 * can call useAuth()/useTheme() - it doesn't matter which of the two
 * wraps the other, since neither depends on the other's value.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './modules/auth/AuthContext.jsx';
import { ThemeProvider } from './modules/theme/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

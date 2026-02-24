import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global Error:', message);
};

console.log('Vite Env Check:', {
  url: import.meta.env.VITE_SUPABASE_URL ? 'PRESENT' : 'MISSING',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
  url_val: import.meta.env.VITE_SUPABASE_URL?.substring(0, 15) + '...',
  key_val: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.onerror = function (message, source, lineno, colno, error) {
  alert('Global Error: ' + message + '\nAt: ' + source + ':' + lineno);
};

console.log('App starting...');
console.log('Supabase URL present:', !!import.meta.env.VITE_SUPABASE_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

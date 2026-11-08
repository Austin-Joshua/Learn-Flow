import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  (window as unknown as { __LEARNFLOW_GIT_SHA__: string }).__LEARNFLOW_GIT_SHA__ =
    typeof __APP_GIT_SHA__ !== 'undefined' ? __APP_GIT_SHA__ : 'dev';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

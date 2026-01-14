import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SoundProvider } from './contexts/SoundContext';
import { SettingsProvider } from './contexts/SettingsContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </SettingsProvider>
  </StrictMode>,
)

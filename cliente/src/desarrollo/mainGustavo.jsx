import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { modoSimulado } from '../servicios/participacion/transporte.js'
import Desarrollo from './DesarrolloGustavo.jsx'
import '../scss/main.scss'
const personas = modoSimulado ? (await import('../servicios/participacion/simulador.js')).personasPrueba : []
createRoot(document.getElementById('root')).render(<StrictMode><HashRouter><Desarrollo personas={personas} /></HashRouter></StrictMode>)


import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { FilterProvider } from '@/context/FilterContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { AlertProvider }  from '@/context/AlertContext'
import { AppRouter } from '@/router'
import { SEED_ALERTS } from '@/pages/alerts/mock/data'

import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AlertProvider initialAlerts={SEED_ALERTS}>
        <FilterProvider>
          <DrawerProvider>
            <AppRouter />
          </DrawerProvider>
        </FilterProvider>
      </AlertProvider>
    </BrowserRouter>
  </React.StrictMode>
)

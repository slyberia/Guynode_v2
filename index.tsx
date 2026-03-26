import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { CatalogProvider } from './context/CatalogContext';
import { HelmetProvider } from 'react-helmet-async';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <CatalogProvider>
        <App />
      </CatalogProvider>
    </HelmetProvider>
  </React.StrictMode>
);

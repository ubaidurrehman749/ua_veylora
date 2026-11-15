import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startSmoothScroll } from './lib/motion';
import './styles.css';
import './premium.css';

// Started before the first render so the intro loader can hold the scroll.
startSmoothScroll();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CalendarProvider } from './context/CalendarContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CalendarProvider currentUserId="default-user">
      <App />
    </CalendarProvider>
  </React.StrictMode>
);

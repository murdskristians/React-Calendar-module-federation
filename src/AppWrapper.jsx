import React from 'react';
import App from './App';
import { CalendarProvider } from './context/CalendarContext';

function AppWrapper({ userId = 'default-user' }) {
  return (
    <CalendarProvider currentUserId={userId}>
      <App userId={userId} />
    </CalendarProvider>
  );
}

export default AppWrapper;

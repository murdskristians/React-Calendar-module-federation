import React, { useState, useCallback } from 'react';
import { CalendarMain, CalendarSidebar, CalendarHeader, EventModal } from './components/Calendar';
import './App.css';

const generateSampleEvents = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return [
    {
      id: '1',
      title: 'Team Meeting',
      start: `${year}-${month}-${day} 09:00`,
      end: `${year}-${month}-${day} 10:00`,
      calendarId: 'work',
    },
    {
      id: '2',
      title: 'Lunch with Sarah',
      start: `${year}-${month}-${day} 12:00`,
      end: `${year}-${month}-${day} 13:00`,
      calendarId: 'personal',
    },
    {
      id: '3',
      title: 'Project Review',
      start: `${year}-${month}-${day} 14:00`,
      end: `${year}-${month}-${day} 15:30`,
      calendarId: 'work',
    },
  ];
};

function App({ userId }) {
  console.log('[Calendar Module] App loaded with userId:', userId);

  const [events, setEvents] = useState(generateSampleEvents);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState('week');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [calendars, setCalendars] = useState([
    { id: 'personal', name: 'Personal', color: '#4285f4', enabled: true },
    { id: 'work', name: 'Work', color: '#0b8043', enabled: true },
    { id: 'family', name: 'Family', color: '#8e24aa', enabled: true },
    { id: 'holidays', name: 'Holidays', color: '#d50000', enabled: false },
  ]);

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setSelectedDateTime(null);
    setModalOpen(true);
  }, []);

  const handleDateClick = useCallback((dateTime) => {
    setEditingEvent(null);
    setSelectedDateTime(dateTime);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    setEditingEvent(event);
    setSelectedDateTime(null);
    setModalOpen(true);
  }, []);

  const handleSaveEvent = useCallback((eventData) => {
    setEvents((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === eventData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = eventData;
        return updated;
      }
      return [...prev, eventData];
    });
  }, []);

  const handleDeleteEvent = useCallback((eventId) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  const handleEventUpdate = useCallback((updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  }, []);

  const handleToggleCalendar = useCallback((calendarId) => {
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, enabled: !cal.enabled } : cal
      )
    );
  }, []);

  const handleNavigate = useCallback((direction) => {
    const date = new Date(selectedDate);
    const offset = direction === 'prev' ? -7 : 7;
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split('T')[0]);
  }, [selectedDate]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const filteredEvents = events.filter((event) => {
    const calendar = calendars.find((c) => c.id === event.calendarId);
    return !calendar || calendar.enabled;
  });

  return (
    <div className="calendar-app">
      <CalendarHeader
        selectedDate={selectedDate}
        currentView={currentView}
        onViewChange={setCurrentView}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={handleNavigate}
        onToday={handleToday}
      />

      <div className="calendar-body">
        {sidebarOpen && (
          <CalendarSidebar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onCreateEvent={handleCreateEvent}
            calendars={calendars}
            onToggleCalendar={handleToggleCalendar}
          />
        )}

        <CalendarMain
          events={filteredEvents}
          selectedDate={selectedDate}
          onEventUpdate={handleEventUpdate}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          calendars={calendars.filter((c) => c.enabled)}
        />
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={editingEvent}
        selectedDateTime={selectedDateTime}
        calendars={calendars}
      />
    </div>
  );
}

export default App;

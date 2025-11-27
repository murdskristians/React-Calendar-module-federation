import React, { useState, useCallback } from 'react';
import { CalendarMain, CalendarSidebar, CalendarHeader, EventModal } from './components/Calendar';
import { useCalendar } from './context/CalendarContext';
import './App.css';

function App({ userId }) {
  console.log('[Calendar Module] App loaded with userId:', userId);

  const {
    events,
    calendars,
    loading,
    error,
    saveEvent,
    deleteEvent,
    updateEvent,
    toggleCalendar,
    getFilteredEvents,
  } = useCalendar();

  // Initialize selectedDate using local timezone to avoid date shifting
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedDateRange, setSelectedDateRange] = useState([]); // Array of date strings in YYYY-MM-DD format
  const [currentView, setCurrentView] = useState('week');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // Simple toggle for sidebar - CSS handles the animation
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Always get fresh event data from the events array
  const editingEvent = editingEventId
    ? events.find(e => String(e.id) === String(editingEventId))
    : null;

  const handleCreateEvent = useCallback(() => {
    setEditingEventId(null);
    setSelectedDateTime(null);
    setModalOpen(true);
  }, []);

  const handleDateClick = useCallback((dateTime) => {
    setEditingEventId(null);
    setSelectedDateTime(dateTime);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    // Store just the event ID - the actual event data is looked up fresh from events array
    setEditingEventId(event.id);
    setSelectedDateTime(null);
    setModalOpen(true);
  }, []);

  const handleSaveEvent = useCallback(async (eventData) => {
    await saveEvent(eventData);
  }, [saveEvent]);

  const handleDeleteEvent = useCallback(async (eventId) => {
    await deleteEvent(eventId);
  }, [deleteEvent]);

  const handleEventUpdate = useCallback(async (updatedEvent) => {
    // Convert Temporal objects back to string format for Firebase storage
    const temporalToString = (temporal) => {
      if (!temporal) return '';
      // Handle Temporal.ZonedDateTime or Temporal.PlainDateTime
      if (temporal.year !== undefined) {
        const year = temporal.year;
        const month = String(temporal.month).padStart(2, '0');
        const day = String(temporal.day).padStart(2, '0');
        const hour = String(temporal.hour || 0).padStart(2, '0');
        const minute = String(temporal.minute || 0).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
      // Already a string
      if (typeof temporal === 'string') return temporal;
      return '';
    };

    // Get the original event to preserve fields that Schedule-X doesn't track
    const originalEvent = events.find(e => String(e.id) === String(updatedEvent.id));

    const eventData = {
      ...originalEvent,
      title: updatedEvent.title,
      start: temporalToString(updatedEvent.start),
      end: temporalToString(updatedEvent.end),
      calendarId: updatedEvent.calendarId,
    };

    await updateEvent(updatedEvent.id, eventData);
  }, [updateEvent, events]);

  const handleToggleCalendar = useCallback((calendarId) => {
    toggleCalendar(calendarId);
  }, [toggleCalendar]);

  const handleNavigate = useCallback((direction) => {
    const date = new Date(selectedDate);
    const offset = direction === 'prev' ? -7 : 7;
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split('T')[0]);
  }, [selectedDate]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Determine view mode based on date range
  const determineViewFromRange = useCallback((dateRange) => {
    if (!dateRange || dateRange.length === 0) {
      return 'day'; // Single date click -> day view
    }

    if (dateRange.length === 1) {
      return 'day'; // Single date -> day view
    }

    // Check if range exceeds one month
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[dateRange.length - 1]);

    // Calculate months difference
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (endDate.getMonth() - startDate.getMonth());

    if (monthsDiff > 0) {
      // Range spans more than one month - limit to one month
      return null; // Will be handled by limiting the range
    }

    // Check if all dates are in the same week (<= 7 days)
    if (dateRange.length <= 7) {
      // Check if start and end dates are in the same week
      if (areDatesInSameWeek(startDate, endDate)) {
        return 'week'; // All dates in one week -> week view
      }
    }

    // More than 7 days or spans multiple weeks -> month view
    return 'month-grid';
  }, [areDatesInSameWeek]);

  // Helper function to check if two dates are in the same week
  const areDatesInSameWeek = useCallback((date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Get Monday of the week for each date
    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };

    const monday1 = getMonday(d1);
    const monday2 = getMonday(d2);

    // Check if same week (same Monday) and same year
    return monday1.getTime() === monday2.getTime() &&
           d1.getFullYear() === d2.getFullYear();
  }, []);

  // Handle date selection with automatic view change
  const handleDateSelect = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setSelectedDateRange([]); // Clear range on single date click
    setCurrentView('day'); // Single date -> day view
  }, []);

  // Handle date range selection with automatic view change
  const handleDateRangeSelect = useCallback((dateRange) => {
    if (!dateRange || dateRange.length === 0) {
      setSelectedDateRange([]);
      return;
    }

    // Limit range to one month
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[dateRange.length - 1]);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (endDate.getMonth() - startDate.getMonth());

    if (monthsDiff > 0) {
      // Limit to one month from start date
      const limitedEndDate = new Date(startDate);
      limitedEndDate.setMonth(limitedEndDate.getMonth() + 1);
      limitedEndDate.setDate(0); // Last day of the month

      const limitedRange = [];
      const current = new Date(startDate);
      while (current <= limitedEndDate) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        limitedRange.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      setSelectedDateRange(limitedRange);
      setSelectedDate(limitedRange[0]);
      setCurrentView('month-grid');
    } else {
      setSelectedDateRange(dateRange);
      const view = determineViewFromRange(dateRange);

      // Set selectedDate to ensure calendar shows the full range
      let dateToShow = dateRange[0];

      if (view === 'week') {
        // For week view, set to Monday of the week containing the range
        const startDate = new Date(dateRange[0]);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
        const monday = new Date(startDate);
        monday.setDate(diff);
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const dayStr = String(monday.getDate()).padStart(2, '0');
        dateToShow = `${year}-${month}-${dayStr}`;
      } else if (view === 'month-grid') {
        // For month view, set to first day of the month containing the range
        const startDate = new Date(dateRange[0]);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        dateToShow = `${year}-${month}-01`;
      }

      setSelectedDate(dateToShow);
      if (view) {
        setCurrentView(view);
      }
    }
  }, [determineViewFromRange, areDatesInSameWeek]);

  const filteredEvents = getFilteredEvents();

  if (loading) {
    return (
      <div className="calendar-app calendar-loading">
        <div className="loading-spinner">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    console.error('Calendar error:', error);
  }

  return (
    <div className="calendar-app">
      <CalendarHeader
        selectedDate={selectedDate}
        currentView={currentView}
        onViewChange={setCurrentView}
        onToggleSidebar={handleToggleSidebar}
        onNavigate={handleNavigate}
        onToday={handleToday}
        sidebarOpen={sidebarOpen}
      />

      <div className="calendar-body">
        <CalendarSidebar
          selectedDate={selectedDate}
          selectedDateRange={selectedDateRange}
          onDateSelect={handleDateSelect}
          onDateRangeSelect={handleDateRangeSelect}
          onCreateEvent={handleCreateEvent}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          isOpen={sidebarOpen}
        />
        <CalendarMain
          key={selectedDate}
          events={filteredEvents}
          selectedDate={selectedDate}
          selectedDateRange={selectedDateRange}
          currentView={currentView}
          onEventUpdate={handleEventUpdate}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          calendars={calendars.filter((c) => c.enabled)}
        />
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEventId(null);
        }}
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

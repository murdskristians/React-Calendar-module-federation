import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const CalendarContext = createContext();

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

// Collection names following naming convention: calendar-{collectionName}
const EVENTS_COLLECTION = 'calendar-events';
const CALENDARS_COLLECTION = 'calendar-calendars';

// Default calendars for new users
const DEFAULT_CALENDARS = [
  { id: 'personal', name: 'Personal', color: '#3498DB', enabled: true },
  { id: 'work', name: 'Work', color: '#0b8043', enabled: true },
  { id: 'family', name: 'Family', color: '#8e24aa', enabled: true },
  { id: 'holidays', name: 'Holidays', color: '#d50000', enabled: false },
];

// LocalStorage key for calendar enabled states
const CALENDAR_ENABLED_KEY = 'calendar-enabled-states';

// Load calendar enabled states from localStorage
const loadCalendarStates = () => {
  try {
    const saved = localStorage.getItem(CALENDAR_ENABLED_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error loading calendar states from localStorage:', err);
  }
  return null;
};

// Save calendar enabled states to localStorage
const saveCalendarStates = (calendars) => {
  try {
    const states = calendars.reduce((acc, cal) => {
      acc[cal.id] = cal.enabled;
      return acc;
    }, {});
    localStorage.setItem(CALENDAR_ENABLED_KEY, JSON.stringify(states));
  } catch (err) {
    console.error('Error saving calendar states to localStorage:', err);
  }
};

// Initialize calendars with saved states
const getInitialCalendars = () => {
  const savedStates = loadCalendarStates();
  if (savedStates) {
    return DEFAULT_CALENDARS.map(cal => ({
      ...cal,
      enabled: savedStates[cal.id] !== undefined ? savedStates[cal.id] : cal.enabled,
    }));
  }
  return DEFAULT_CALENDARS;
};

export const CalendarProvider = ({ children, currentUserId = 'default-user' }) => {
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState(getInitialCalendars);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate unique ID for local storage fallback
  const generateId = () => `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Real-time listener for events
  useEffect(() => {
    if (!db) {
      console.log('Firebase not configured, using local state only');
      setLoading(false);
      return;
    }

    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const q = query(eventsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const evts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          evts.push({
            id: doc.id,
            ...data,
            // Convert Firestore timestamps to strings if needed
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          });
        });
        console.log('Raw events from Firebase:', evts);
        // Filter events for current user
        const userEvents = evts.filter(evt => evt.userId === currentUserId);
        console.log('User events:', userEvents);
        setEvents(userEvents);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error('Error fetching events:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up events listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [currentUserId]);

  // Real-time listener for calendars
  useEffect(() => {
    if (!db) {
      return;
    }

    try {
      const calendarsRef = collection(db, CALENDARS_COLLECTION);
      const q = query(calendarsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cals = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          cals.push({
            id: doc.id,
            ...data,
          });
        });
        // Filter calendars for current user
        const userCalendars = cals.filter(cal => cal.userId === currentUserId);
        if (userCalendars.length > 0) {
          setCalendars(userCalendars);
        }
      }, (err) => {
        console.error('Error fetching calendars:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up calendars listener:', err);
    }
  }, [currentUserId]);

  // Create new event
  const createEvent = useCallback(async (eventData) => {
    const newEvent = {
      ...eventData,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db) {
      // Local state only
      newEvent.id = generateId();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    }

    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const firebaseEvent = {
        ...newEvent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      delete firebaseEvent.id;

      const docRef = await addDoc(eventsRef, firebaseEvent);
      const createdEvent = { id: docRef.id, ...newEvent };
      return createdEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
      // Fallback to local
      newEvent.id = generateId();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    }
  }, [currentUserId]);

  // Update event
  const updateEvent = useCallback(async (id, updates) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update local state immediately for responsive UI
    setEvents(prev => prev.map(evt =>
      evt.id === id ? { ...evt, ...updatedData } : evt
    ));

    if (!db) {
      return;
    }

    try {
      const docRef = doc(db, EVENTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message);
      // State already updated optimistically, Firebase listener will sync if needed
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (id) => {
    if (!db) {
      // Local state only
      setEvents(prev => prev.filter(evt => evt.id !== id));
      return;
    }

    try {
      const docRef = doc(db, EVENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message);
      // Fallback to local
      setEvents(prev => prev.filter(evt => evt.id !== id));
    }
  }, []);

  // Save event (create or update)
  const saveEvent = useCallback(async (eventData) => {
    // Check if event exists (has a valid Firebase ID or was created locally)
    const existingEvent = events.find(e => e.id === eventData.id);

    if (existingEvent) {
      await updateEvent(eventData.id, eventData);
      return eventData;
    } else {
      return await createEvent(eventData);
    }
  }, [events, createEvent, updateEvent]);

  // Toggle calendar enabled/disabled
  const toggleCalendar = useCallback(async (calendarId) => {
    setCalendars(prev => {
      const updated = prev.map(cal =>
        cal.id === calendarId ? { ...cal, enabled: !cal.enabled } : cal
      );
      // Save to localStorage
      saveCalendarStates(updated);
      return updated;
    });

    // If using Firebase calendars, update there too
    if (db) {
      const calendar = calendars.find(c => c.id === calendarId);
      if (calendar && calendar.userId) {
        try {
          const docRef = doc(db, CALENDARS_COLLECTION, calendarId);
          await updateDoc(docRef, { enabled: !calendar.enabled });
        } catch (err) {
          console.error('Error toggling calendar:', err);
        }
      }
    }
  }, [calendars]);

  // Create calendar
  const createCalendar = useCallback(async (calendarData) => {
    const newCalendar = {
      ...calendarData,
      userId: currentUserId,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    if (!db) {
      newCalendar.id = generateId();
      setCalendars(prev => [...prev, newCalendar]);
      return newCalendar;
    }

    try {
      const calendarsRef = collection(db, CALENDARS_COLLECTION);
      const firebaseCalendar = {
        ...newCalendar,
        createdAt: serverTimestamp(),
      };
      delete firebaseCalendar.id;

      const docRef = await addDoc(calendarsRef, firebaseCalendar);
      return { id: docRef.id, ...newCalendar };
    } catch (err) {
      console.error('Error creating calendar:', err);
      newCalendar.id = generateId();
      setCalendars(prev => [...prev, newCalendar]);
      return newCalendar;
    }
  }, [currentUserId]);

  // Delete calendar
  const deleteCalendar = useCallback(async (id) => {
    if (!db) {
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      setEvents(prev => prev.filter(evt => evt.calendarId !== id));
      return;
    }

    try {
      // Delete all events in this calendar first
      const calendarEvents = events.filter(evt => evt.calendarId === id);
      for (const event of calendarEvents) {
        await deleteEvent(event.id);
      }

      // Then delete the calendar
      const docRef = doc(db, CALENDARS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting calendar:', err);
      // Fallback to local
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      setEvents(prev => prev.filter(evt => evt.calendarId !== id));
    }
  }, [events, deleteEvent]);

  // Get filtered events (only from enabled calendars)
  const getFilteredEvents = useCallback(() => {
    return events.filter(event => {
      const calendar = calendars.find(c => c.id === event.calendarId);
      return !calendar || calendar.enabled;
    });
  }, [events, calendars]);

  const value = {
    events,
    calendars,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    saveEvent,
    toggleCalendar,
    createCalendar,
    deleteCalendar,
    getFilteredEvents,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

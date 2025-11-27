import React, { useState, useEffect, useRef } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import { createResizePlugin } from '@schedule-x/resize';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
import '@schedule-x/theme-default/dist/index.css';
import 'temporal-polyfill/global';

const CalendarMain = ({
  events = [],
  onEventUpdate,
  onEventClick,
  onDateClick,
  selectedDate,
  calendars = []
}) => {
  const [eventsService] = useState(() => createEventsServicePlugin());
  const eventsLoadedRef = useRef(false);

  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: 'week',
    selectedDate: Temporal.PlainDate.from('2025-11-27'),
    calendars: {
      personal: {
        colorName: 'personal',
        lightColors: {
          main: '#4285f4',
          container: '#e8f0fe',
          onContainer: '#1967d2',
        },
      },
      work: {
        colorName: 'work',
        lightColors: {
          main: '#0b8043',
          container: '#e6f4ea',
          onContainer: '#137333',
        },
      },
      family: {
        colorName: 'family',
        lightColors: {
          main: '#8e24aa',
          container: '#f3e8fd',
          onContainer: '#7b1fa2',
        },
      },
    },
    events: [],
    plugins: [
      eventsService,
      createEventModalPlugin(),
      createDragAndDropPlugin(15),
      createResizePlugin(15),
      createCurrentTimePlugin({ fullWeekWidth: true }),
    ],
    callbacks: {
      onEventUpdate: (updatedEvent) => {
        if (onEventUpdate) {
          onEventUpdate(updatedEvent);
        }
      },
      onEventClick: (event) => {
        if (onEventClick) {
          onEventClick(event);
        }
      },
      onClickDate: (date) => {
        if (onDateClick) {
          onDateClick(date);
        }
      },
      onClickDateTime: (dateTime) => {
        if (onDateClick) {
          onDateClick(dateTime);
        }
      },
    },
  });

  useEffect(() => {
    if (eventsService && events.length > 0) {
      try {
        const convertedEvents = events.map(event => {
          const convertDate = (dateStr) => {
            if (!dateStr) return null;

            // Already a Temporal object
            if (typeof dateStr !== 'string') return dateStr;

            // Handle "YYYY-MM-DD HH:mm" format -> PlainDateTime
            if (dateStr.includes(' ')) {
              const [datePart, timePart] = dateStr.split(' ');
              const [year, month, day] = datePart.split('-').map(Number);
              const [hour, minute] = timePart.split(':').map(Number);
              return Temporal.PlainDateTime.from({
                year,
                month,
                day,
                hour: hour || 0,
                minute: minute || 0
              });
            }

            // Handle "YYYY-MM-DD" format -> PlainDate (for all-day events)
            if (!dateStr.includes('T')) {
              const [year, month, day] = dateStr.split('-').map(Number);
              return Temporal.PlainDate.from({ year, month, day });
            }

            // Handle ISO format with T
            const date = new Date(dateStr);
            return Temporal.PlainDateTime.from({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
              hour: date.getHours(),
              minute: date.getMinutes(),
            });
          };

          return {
            ...event,
            start: convertDate(event.start),
            end: convertDate(event.end),
          };
        });

        console.log('Setting events:', convertedEvents);
        eventsService.set(convertedEvents);
        eventsLoadedRef.current = true;
      } catch (err) {
        console.error('Error converting events:', err);
      }
    }
  }, [events, eventsService]);

  return (
    <div className="calendar-main">
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default CalendarMain;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
// Event modal plugin removed - we use our own EventModal component triggered by onEventClick
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import { createResizePlugin } from '@schedule-x/resize';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls';
import '@schedule-x/theme-default/dist/index.css';
import 'temporal-polyfill/global';

const CalendarMain = ({
  events = [],
  onEventUpdate,
  onEventClick,
  onDateClick,
  selectedDate,
  selectedDateRange = [],
  currentView = 'week',
  calendars = []
}) => {
  const [eventsService] = useState(() => createEventsServicePlugin());
  const [calendarControls] = useState(() => createCalendarControlsPlugin());
  const eventsLoadedRef = useRef(false);
  const calendarContainerRef = useRef(null);

  // Convert selectedDate string to Temporal.PlainDate
  // Always use selectedDate from props - no hardcoded fallback
  const getTemporalDate = useMemo(() => {
    if (!selectedDate) {
      // If no selectedDate provided, return today (should not happen as App.jsx always provides it)
      const today = new Date();
      return Temporal.PlainDate.from({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      });
    }
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      return Temporal.PlainDate.from({ year, month, day });
    } catch (err) {
      console.error('Error parsing selectedDate:', err);
      // Fallback to today only on error
      const today = new Date();
      return Temporal.PlainDate.from({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      });
    }
  }, [selectedDate]);

  // Create calendar - it will be recreated via key prop when selectedDate changes
  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: currentView || 'week',
    locale: 'en-GB', // Use 24-hour time format (European standard)
    selectedDate: getTemporalDate,
    calendars: {
      personal: {
        colorName: 'personal',
        lightColors: {
          main: '#3498DB',
          container: '#d6eaf8',
          onContainer: '#2980B9',
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
      holidays: {
        colorName: 'holidays',
        lightColors: {
          main: '#d50000',
          container: '#fce8e8',
          onContainer: '#b71c1c',
        },
      },
    },
    events: [],
    plugins: [
      eventsService,
      calendarControls,
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

// Sync view changes from header dropdown to Schedule-X calendar
useEffect(() => {
  if (calendarControls) {
    calendarControls.setView(currentView);
  }
}, [currentView, calendarControls]);

// Update calendar selectedDate when prop changes
// This ensures synchronization between mini calendar and main calendar
useEffect(() => {
  if (!selectedDate || !calendar) return;

  try {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const newDate = Temporal.PlainDate.from({ year, month, day });

    // Update the selected date in the calendar
    if (calendar.datePickerState?.selectedDate) {
      if (typeof calendar.datePickerState.selectedDate.set === 'function') {
        calendar.datePickerState.selectedDate.set(newDate);
      } else {
        calendar.datePickerState.selectedDate.value = newDate;
      }
    }

    // Navigate the calendar view to show this date
    if (calendar.navigateToDate) {
      calendar.navigateToDate(newDate);
    }
  } catch (err) {
    console.error('Error updating selectedDate:', err);
  }
}, [selectedDate, calendar]);

  const parseToTemporal = (dateStr, isAllDay = false) => {
    if (!dateStr) return null;

    // Already a Temporal object
    if (typeof dateStr !== 'string') return dateStr;

    try {
      // Handle "YYYY-MM-DD HH:mm" format
      if (dateStr.includes(' ')) {
        const [datePart, timePart] = dateStr.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);

        if (isAllDay) {
          return Temporal.PlainDate.from({ year, month, day });
        }

        // For timed events, Schedule-X v3 requires ZonedDateTime
        // Use the system timezone
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const plainDateTime = Temporal.PlainDateTime.from({
          year,
          month,
          day,
          hour: isNaN(hour) ? 0 : hour,
          minute: isNaN(minute) ? 0 : minute,
        });

        return plainDateTime.toZonedDateTime(timeZone);
      }

      // Handle "YYYY-MM-DD" format -> PlainDate (for all-day events)
      if (!dateStr.includes('T')) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return Temporal.PlainDate.from({ year, month, day });
      }

      // Handle ISO format with T
      const date = new Date(dateStr);
      if (isAllDay) {
        return Temporal.PlainDate.from({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        });
      }

      // For timed events, use ZonedDateTime
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const plainDateTime = Temporal.PlainDateTime.from({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      });

      return plainDateTime.toZonedDateTime(timeZone);
    } catch (err) {
      console.error('Error parsing date to Temporal:', dateStr, err);
      return null;
    }
  };

  useEffect(() => {
    if (!eventsService) return;

    try {
      // Filter out events with invalid dates
      const validEvents = events.filter(event => event.start && event.end);

      if (validEvents.length === 0) {
        console.log('No valid events to set');
        eventsService.set([]);
        return;
      }

      const convertedEvents = [];

      for (const event of validEvents) {
        const isAllDay = event.allDay === true;
        const start = parseToTemporal(event.start, isAllDay);
        const end = parseToTemporal(event.end, isAllDay);

        if (start && end) {
          convertedEvents.push({
            id: String(event.id),
            title: event.title || 'Untitled',
            start,
            end,
            calendarId: event.calendarId || 'personal',
          });
        } else {
          console.log('Skipping event with invalid dates:', event);
        }
      }

      console.log('Setting events to Schedule-X:', convertedEvents);
      eventsService.set(convertedEvents);
      eventsLoadedRef.current = true;
    } catch (err) {
      console.error('Error converting events:', err);
    }
  }, [events, eventsService]);

  // Apply styles to selected date range in the main calendar
  useEffect(() => {
    let isApplyingStyles = false;
    let debounceTimeout = null;

    const applyRangeStyles = () => {
      // Prevent re-entry when we're modifying classes ourselves
      if (isApplyingStyles) return;

      const calendarEl = calendarContainerRef.current?.querySelector('.sx-calendar');
      if (!calendarEl) return;

      isApplyingStyles = true;

      try {
        // Remove all range styles first
        const allCells = calendarEl.querySelectorAll('.sx-date-in-range, .sx-date-range-start, .sx-date-range-end, .sx-date-range-middle');
        allCells.forEach(cell => {
          cell.classList.remove('sx-date-in-range', 'sx-date-range-start', 'sx-date-range-end', 'sx-date-range-middle');
        });

        if (!selectedDateRange || selectedDateRange.length === 0) {
          return;
        }

        // Format date range for comparison
        const formatDateForComparison = (dateStr) => {
          if (!dateStr) return null;
          // Get YYYY-MM-DD part
          const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
          return match ? match[1] : null;
        };

        // Find all possible date cells in the calendar
        // Schedule-X uses various selectors for dates
        const possibleSelectors = [
          '[data-date]',
          '.sx-week-grid-day__date',
          '.sx-month-grid-day',
          '.sx-day',
          '[aria-label*="day"]',
          '[class*="date"]'
        ];

        const dateCells = new Set();
        possibleSelectors.forEach(selector => {
          try {
            calendarEl.querySelectorAll(selector).forEach(el => dateCells.add(el));
          } catch (e) {
            // Ignore invalid selectors
          }
        });

        dateCells.forEach(cell => {
          // Try to get date from various possible attributes and text content
          let dateStr = cell.getAttribute('data-date') ||
                       cell.getAttribute('aria-label') ||
                       cell.getAttribute('title') ||
                       cell.textContent?.trim();

          if (!dateStr) return;

          const cellDateStr = formatDateForComparison(dateStr);
          if (!cellDateStr) return;

          const isInRange = selectedDateRange.includes(cellDateStr);
          if (!isInRange) return;

          const isStart = selectedDateRange[0] === cellDateStr;
          const isEnd = selectedDateRange[selectedDateRange.length - 1] === cellDateStr;
          const isMiddle = !isStart && !isEnd;

          // Add appropriate class
          if (isStart) {
            cell.classList.add('sx-date-range-start');
          } else if (isEnd) {
            cell.classList.add('sx-date-range-end');
          } else if (isMiddle) {
            cell.classList.add('sx-date-range-middle');
          } else {
            cell.classList.add('sx-date-in-range');
          }
        });
      } finally {
        // Reset flag after a short delay to allow DOM to settle
        setTimeout(() => {
          isApplyingStyles = false;
        }, 50);
      }
    };

    // Debounced version for observer calls
    const debouncedApplyRangeStyles = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(applyRangeStyles, 100);
    };

    // Apply styles after a short delay to ensure calendar is rendered
    const timeoutId = setTimeout(applyRangeStyles, 150);

    // Also try to apply when calendar view changes
    // Only observe childList changes (new elements), not class changes to avoid loops
    const observer = new MutationObserver((mutations) => {
      // Only react to structural changes, not attribute changes we might have caused
      const hasStructuralChange = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
      if (hasStructuralChange) {
        debouncedApplyRangeStyles();
      }
    });

    if (calendarContainerRef.current) {
      observer.observe(calendarContainerRef.current, {
        childList: true,
        subtree: true,
        // Don't observe attribute changes - this was causing infinite loops
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      observer.disconnect();
    };
  }, [selectedDateRange]);

  // Use key to force re-render only when selectedDate changes significantly (month change)
  // Don't include currentView in key - view changes are handled by calendarControls.setView()
  const calendarKey = selectedDate ? selectedDate.substring(0, 7) : 'default';

  return (
    <div className="calendar-main" ref={calendarContainerRef}>
      <ScheduleXCalendar key={calendarKey} calendarApp={calendar} />
    </div>
  );
};

export default CalendarMain;

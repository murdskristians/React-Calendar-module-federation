import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarSidebar = ({
  selectedDate,
  selectedDateRange = [],
  onDateSelect,
  onDateRangeSelect,
  onCreateEvent,
  calendars = [],
  onToggleCalendar,
  isOpen = true,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : today);

  // Drag-to-select state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState(null);
  const [dragEndDate, setDragEndDate] = useState(null);
  const [isClick, setIsClick] = useState(true);
  const dragStartRef = useRef(null);

  // Update viewDate when selectedDate changes to ensure calendar shows the correct month
  useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      // Only update if the month/year is different to avoid unnecessary re-renders
      if (newDate.getMonth() !== viewDate.getMonth() || newDate.getFullYear() !== viewDate.getFullYear()) {
        setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
      }
    }
  }, [selectedDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format date to YYYY-MM-DD string
  const formatDateString = (date) => {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get all dates between start and end (inclusive)
  const getDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    // Ensure start is before end
    const actualStart = start <= end ? start : end;
    const actualEnd = start <= end ? end : start;

    const current = new Date(actualStart);
    while (current <= actualEnd) {
      dates.push(formatDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const isSelected = (date) => {
    const dateStr = formatDateString(date);

    // Check if date is in the range
    if (selectedDateRange && selectedDateRange.length > 0) {
      return selectedDateRange.includes(dateStr);
    }

    // Fallback to single date selection
    if (!selectedDate) return false;
    const selectedStr = selectedDate.includes('T')
      ? selectedDate.split('T')[0]
      : selectedDate.split(' ')[0];
    return dateStr === selectedStr;
  };

  const isInDragRange = (date) => {
    if (!isDragging || !dragStartDate || !dragEndDate) return false;
    const dateStr = formatDateString(date);
    const range = getDateRange(dragStartDate, dragEndDate);
    return range.includes(dateStr);
  };

  const isDragStart = (date) => {
    if (!isDragging || !dragStartDate) return false;
    return formatDateString(date) === formatDateString(dragStartDate);
  };

  const isDragEnd = (date) => {
    if (!isDragging || !dragEndDate) return false;
    return formatDateString(date) === formatDateString(dragEndDate);
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateMouseDown = (e, date) => {
    e.preventDefault();
    const dateStr = formatDateString(date);
    setIsDragging(true);
    setIsClick(true);
    setDragStartDate(date);
    setDragEndDate(date);
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleDateMouseEnter = (date) => {
    if (isDragging && dragStartDate) {
      setIsClick(false);
      setDragEndDate(date);
    }
  };

  const handleDateMouseUp = (e, date) => {
    if (!isDragging) return;

    const dragStart = dragStartRef.current;
    const isActualClick = dragStart &&
      (Math.abs(e.clientX - dragStart.x) < 5 && Math.abs(e.clientY - dragStart.y) < 5) &&
      (Date.now() - dragStart.time < 200);

    if (isActualClick && isClick) {
      // Single click - behave as before (navigate to week)
      const dateStr = formatDateString(date);
      if (onDateSelect) {
        onDateSelect(dateStr);
      }
      // Clear range selection
      if (onDateRangeSelect) {
        onDateRangeSelect([]);
      }
    } else {
      // Drag selection - set range
      // Don't call onDateSelect here - handleDateRangeSelect will handle both date and view
      const range = getDateRange(dragStartDate, dragEndDate);
      if (onDateRangeSelect && range.length > 0) {
        onDateRangeSelect(range);
      }
    }

    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
    dragStartRef.current = null;
  };

  // Handle mouse up outside the calendar
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        const dragStart = dragStartRef.current;
        if (dragStart && dragStartDate && dragEndDate) {
          const isActualClick =
            (Math.abs(e.clientX - dragStart.x) < 5 && Math.abs(e.clientY - dragStart.y) < 5) &&
            (Date.now() - dragStart.time < 200);

          if (!isActualClick || !isClick) {
            // Drag selection
            // Don't call onDateSelect here - handleDateRangeSelect will handle both date and view
            const range = getDateRange(dragStartDate, dragEndDate);
            if (onDateRangeSelect && range.length > 0) {
              onDateRangeSelect(range);
            }
          }
        }
        setIsDragging(false);
        setDragStartDate(null);
        setDragEndDate(null);
        dragStartRef.current = null;
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStartDate, dragEndDate, isClick, onDateSelect, onDateRangeSelect]);

  const days = getDaysInMonth(viewDate);

  const defaultCalendars = [
    { id: 'personal', name: 'Personal', color: '#3498DB', enabled: true },
    { id: 'work', name: 'Work', color: '#0b8043', enabled: true },
    { id: 'family', name: 'Family', color: '#8e24aa', enabled: true },
    { id: 'holidays', name: 'Holidays', color: '#d50000', enabled: false },
  ];

  const displayCalendars = calendars.length > 0 ? calendars : defaultCalendars;

  return (
    <div className={`calendar-sidebar ${!isOpen ? 'closed' : ''}`}>
      {/* Create Button */}
      <button className="create-event-btn" onClick={onCreateEvent}>
        <FiPlus size={24} />
        <span>Create</span>
      </button>

      {/* Mini Calendar */}
      <div className="mini-calendar">
        <div className="mini-calendar-header">
          <span className="mini-calendar-title">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <div className="mini-calendar-nav">
            <button onClick={goToPrevMonth} className="nav-btn">
              <FiChevronLeft size={16} />
            </button>
            <button onClick={goToNextMonth} className="nav-btn">
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mini-calendar-grid">
          <div className="mini-calendar-days">
            {DAYS.map((day, i) => (
              <div key={i} className="day-header">{day}</div>
            ))}
          </div>
          <div className="mini-calendar-dates">
            {days.map((item, i) => {
              const dateKey = `${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`;
              const isDateSelected = isSelected(item.date);
              const isInRange = isInDragRange(item.date) || (selectedDateRange.length > 0 && isDateSelected);
              const isRangeStart = isDragStart(item.date) || (selectedDateRange.length > 0 && formatDateString(item.date) === selectedDateRange[0]);
              const isRangeEnd = isDragEnd(item.date) || (selectedDateRange.length > 0 && formatDateString(item.date) === selectedDateRange[selectedDateRange.length - 1]);
              const isInMiddle = isInRange && !isRangeStart && !isRangeEnd;

              return (
                <button
                  key={dateKey}
                  className={`date-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isToday(item.date) ? 'today' : ''} ${isDateSelected && selectedDateRange.length === 0 ? 'selected' : ''} ${isInRange && selectedDateRange.length > 0 ? 'in-range' : ''} ${isRangeStart ? 'range-start' : ''} ${isRangeEnd ? 'range-end' : ''} ${isInMiddle ? 'range-middle' : ''}`}
                  onMouseDown={(e) => handleDateMouseDown(e, item.date)}
                  onMouseEnter={() => handleDateMouseEnter(item.date)}
                  onMouseUp={(e) => handleDateMouseUp(e, item.date)}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendars List */}
      <div className="calendars-section">
        <h3 className="section-title">My calendars</h3>
        <div className="calendars-list">
          {displayCalendars.map((cal) => (
            <label key={cal.id} className="calendar-item">
              <input
                type="checkbox"
                checked={cal.enabled !== false}
                onChange={() => onToggleCalendar && onToggleCalendar(cal.id)}
                style={{ accentColor: cal.color }}
              />
              <span className="calendar-color" style={{ backgroundColor: cal.color }} />
              <span className="calendar-name">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarSidebar;

import React, { useState } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarSidebar = ({
  selectedDate,
  onDateSelect,
  onCreateEvent,
  calendars = [],
  onToggleCalendar,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : today);

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

  const isSelected = (date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date.toISOString().split('T')[0]);
    }
  };

  const days = getDaysInMonth(viewDate);

  const defaultCalendars = [
    { id: 'personal', name: 'Personal', color: '#4285f4', enabled: true },
    { id: 'work', name: 'Work', color: '#0b8043', enabled: true },
    { id: 'family', name: 'Family', color: '#8e24aa', enabled: true },
    { id: 'holidays', name: 'Holidays', color: '#d50000', enabled: false },
  ];

  const displayCalendars = calendars.length > 0 ? calendars : defaultCalendars;

  return (
    <div className="calendar-sidebar">
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
            {days.map((item, i) => (
              <button
                key={i}
                className={`date-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isToday(item.date) ? 'today' : ''} ${isSelected(item.date) ? 'selected' : ''}`}
                onClick={() => handleDateClick(item.date)}
              >
                {item.day}
              </button>
            ))}
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

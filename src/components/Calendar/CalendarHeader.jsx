import React from 'react';
import { FiMenu, FiChevronLeft, FiChevronRight, FiSearch, FiSettings, FiHelpCircle } from 'react-icons/fi';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarHeader = ({
  selectedDate,
  currentView,
  onViewChange,
  onToggleSidebar,
  onNavigate,
  onToday,
}) => {
  const date = selectedDate ? new Date(selectedDate) : new Date();
  const monthYear = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  const views = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month-grid', label: 'Month' },
    { id: 'month-agenda', label: 'Agenda' },
  ];

  return (
    <header className="calendar-header">
      <div className="header-left">
        <button className="icon-btn menu-btn" onClick={onToggleSidebar}>
          <FiMenu size={22} />
        </button>

        <div className="logo">
          <span className="logo-icon">📅</span>
          <span className="logo-text">Calendar</span>
        </div>

        <button className="today-btn" onClick={onToday}>
          Today
        </button>

        <div className="nav-arrows">
          <button className="icon-btn" onClick={() => onNavigate('prev')}>
            <FiChevronLeft size={20} />
          </button>
          <button className="icon-btn" onClick={() => onNavigate('next')}>
            <FiChevronRight size={20} />
          </button>
        </div>

        <h1 className="current-date">{monthYear}</h1>
      </div>

      <div className="header-right">
        <button className="icon-btn search-btn">
          <FiSearch size={20} />
        </button>

        <div className="view-selector">
          {views.map((view) => (
            <button
              key={view.id}
              className={`view-btn ${currentView === view.id ? 'active' : ''}`}
              onClick={() => onViewChange(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>

        <button className="icon-btn">
          <FiSettings size={20} />
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;

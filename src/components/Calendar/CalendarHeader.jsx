import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiChevronLeft, FiChevronRight, FiSearch, FiSettings, FiChevronDown, FiCheck } from 'react-icons/fi';

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
  sidebarOpen,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const date = selectedDate ? new Date(selectedDate) : new Date();
  const monthYear = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  const views = [
    { id: 'day', label: 'Day', shortcut: 'D' },
    { id: 'week', label: 'Week', shortcut: 'W' },
    { id: 'month-grid', label: 'Month', shortcut: 'M' },
    { id: 'month-agenda', label: 'Schedule', shortcut: 'A' },
  ];

  const currentViewLabel = views.find(v => v.id === currentView)?.label || 'Week';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewSelect = (viewId) => {
    onViewChange(viewId);
    setDropdownOpen(false);
  };

  return (
    <header className="calendar-header">
      <div className="header-left">
        <button
          className={`icon-btn menu-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
        >
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

        <button className="icon-btn">
          <FiSettings size={20} />
        </button>

        <div className="view-dropdown" ref={dropdownRef}>
          <button
            className="view-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {currentViewLabel}
            <FiChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="view-dropdown-menu">
              {views.map((view) => (
                <button
                  key={view.id}
                  className={`view-dropdown-item ${currentView === view.id ? 'active' : ''}`}
                  onClick={() => handleViewSelect(view.id)}
                >
                  <span className="view-dropdown-check">
                    {currentView === view.id && <FiCheck size={16} />}
                  </span>
                  <span className="view-dropdown-label">{view.label}</span>
                  <span className="view-dropdown-shortcut">{view.shortcut}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;

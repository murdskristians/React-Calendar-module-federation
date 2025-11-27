import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiCalendar, FiMapPin, FiAlignLeft, FiTrash2 } from 'react-icons/fi';

const EventModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event = null,
  selectedDateTime = null,
  calendars = [],
}) => {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    allDay: false,
    calendarId: 'personal',
    location: '',
    description: '',
  });
  const [titleError, setTitleError] = useState(false);

  const defaultCalendars = [
    { id: 'personal', name: 'Personal', color: '#3498DB' },
    { id: 'work', name: 'Work', color: '#0b8043' },
    { id: 'family', name: 'Family', color: '#8e24aa' },
  ];

  const displayCalendars = calendars.length > 0 ? calendars : defaultCalendars;

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert any date format to datetime-local string format (YYYY-MM-DDTHH:mm)
  const toDateTimeLocalString = (dateValue) => {
    if (!dateValue) return '';

    // Already a string in correct format
    if (typeof dateValue === 'string') {
      // Convert "YYYY-MM-DD HH:mm" to "YYYY-MM-DDTHH:mm"
      if (dateValue.includes(' ')) {
        return dateValue.replace(' ', 'T');
      }
      // Already in ISO format with T
      if (dateValue.includes('T')) {
        return dateValue.substring(0, 16);
      }
      // Just a date, add default time
      return `${dateValue}T00:00`;
    }

    // Temporal.ZonedDateTime or Temporal.PlainDateTime or Temporal.PlainDate
    if (dateValue.year !== undefined) {
      const year = dateValue.year;
      const month = String(dateValue.month).padStart(2, '0');
      const day = String(dateValue.day).padStart(2, '0');
      const hour = String(dateValue.hour || 0).padStart(2, '0');
      const minute = String(dateValue.minute || 0).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    // JavaScript Date object
    if (dateValue instanceof Date) {
      return formatDateTimeLocal(dateValue);
    }

    return '';
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start: toDateTimeLocalString(event.start),
        end: toDateTimeLocalString(event.end),
        allDay: event.allDay || false,
        calendarId: event.calendarId || 'personal',
        location: event.location || '',
        description: event.description || '',
      });
    } else if (selectedDateTime) {
      // Handle Temporal.PlainDateTime from Schedule-X or string
      let startDate;
      if (typeof selectedDateTime === 'string') {
        startDate = new Date(selectedDateTime);
      } else if (selectedDateTime.year !== undefined) {
        // It's a Temporal.PlainDateTime object
        const year = selectedDateTime.year;
        const month = selectedDateTime.month;
        const day = selectedDateTime.day;
        const hour = selectedDateTime.hour || 0;
        const minute = selectedDateTime.minute || 0;
        startDate = new Date(year, month - 1, day, hour, minute);
      } else {
        startDate = new Date();
      }

      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        start: formatDateTimeLocal(startDate),
        end: formatDateTimeLocal(endDate),
        allDay: false,
        calendarId: 'personal',
        location: '',
        description: '',
      });
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        start: formatDateTimeLocal(now),
        end: formatDateTimeLocal(end),
        allDay: false,
        calendarId: 'personal',
        location: '',
        description: '',
      });
    }
  }, [event, selectedDateTime, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'title') {
      setTitleError(false);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setTitleError(true);
      return;
    }

    const eventData = {
      id: event?.id || String(Date.now()),
      title: formData.title,
      start: formData.allDay
        ? formData.start.split('T')[0]
        : formData.start.replace('T', ' '),
      end: formData.allDay
        ? formData.end.split('T')[0]
        : formData.end.replace('T', ' '),
      calendarId: formData.calendarId,
      location: formData.location,
      description: formData.description,
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <div className="title-input-wrapper">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Add title"
              className={`event-title-input ${titleError ? 'error' : ''}`}
              autoFocus
            />
            {titleError && <span className="title-error-message">Title is required</span>}
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-modal-form">
          <div className="form-row">
            <FiClock className="form-icon" />
            <div className="form-inputs">
              <div className="datetime-row">
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  name="start"
                  value={formData.allDay ? formData.start.split('T')[0] : formData.start}
                  onChange={handleChange}
                  className="datetime-input"
                />
                <span className="datetime-separator">-</span>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  name="end"
                  value={formData.allDay ? formData.end.split('T')[0] : formData.end}
                  onChange={handleChange}
                  className="datetime-input"
                />
              </div>
              <label className="all-day-label">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                />
                All day
              </label>
            </div>
          </div>

          <div className="form-row">
            <FiCalendar className="form-icon" />
            <select
              name="calendarId"
              value={formData.calendarId}
              onChange={handleChange}
              className="calendar-select"
            >
              {displayCalendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <FiMapPin className="form-icon" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Add location"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <FiAlignLeft className="form-icon" />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add description"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="event-modal-footer">
            {event && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                <FiTrash2 size={16} />
                Delete
              </button>
            )}
            <div className="footer-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;

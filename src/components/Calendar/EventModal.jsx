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

  const defaultCalendars = [
    { id: 'personal', name: 'Personal', color: '#4285f4' },
    { id: 'work', name: 'Work', color: '#0b8043' },
    { id: 'family', name: 'Family', color: '#8e24aa' },
  ];

  const displayCalendars = calendars.length > 0 ? calendars : defaultCalendars;

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start: event.start || '',
        end: event.end || '',
        allDay: event.allDay || false,
        calendarId: event.calendarId || 'personal',
        location: event.location || '',
        description: event.description || '',
      });
    } else if (selectedDateTime) {
      const startDate = new Date(selectedDateTime);
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

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

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
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Add title"
            className="event-title-input"
            autoFocus
          />
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

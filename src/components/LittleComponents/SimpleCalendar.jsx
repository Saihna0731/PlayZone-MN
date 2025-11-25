import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../styles/SimpleCalendar.css';

const SimpleCalendar = ({ bookings, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => b.date === dateString);
      const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayBookings.length > 0 ? 'has-bookings' : ''}`}
          onClick={() => {
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            setSelectedDate(newDate);
            onDateClick(newDate, dayBookings);
          }}
        >
          <span className="day-number">{day}</span>
          {dayBookings.length > 0 && (
            <div className="day-dots">
              {dayBookings.slice(0, 4).map((booking, i) => (
                <span 
                  key={i} 
                  className={`dot ${booking.status}`}
                  title={booking.status}
                ></span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];

  return (
    <div className="simple-calendar">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn"><FaChevronLeft /></button>
        <h3>{currentDate.getFullYear()} он {monthNames[currentDate.getMonth()]}</h3>
        <button onClick={nextMonth} className="nav-btn"><FaChevronRight /></button>
      </div>
      <div className="calendar-weekdays">
        <div>Ня</div>
        <div>Да</div>
        <div>Мя</div>
        <div>Лх</div>
        <div>Пү</div>
        <div>Ба</div>
        <div>Бя</div>
      </div>
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default SimpleCalendar;

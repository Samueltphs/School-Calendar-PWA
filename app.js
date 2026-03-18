function getEventsForUser(role, username) {
  let events = JSON.parse(localStorage.getItem('events') || '[]');
  if (role === 'staff') {
    return events.filter(e => e.scope === 'global');
  } else {
    return events.filter(e => e.scope === 'global' || (e.scope === 'student' && e.username === username));
  }
}

function saveEvent(role, username, event, id) {
  let events = JSON.parse(localStorage.getItem('events') || '[]');
  if (id) {
    let index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = event;
    }
  } else {
    events.push(event);
  }
  localStorage.setItem('events', JSON.stringify(events));
}

function loadEventById(role, username, id) {
  let events = getEventsForUser(role, username);
  return events.find(e => e.id === id);
}

function selectEvent(id, role, username) {
  const event = loadEventById(role, username, id);
  if (!event) return;

  const detailsDiv = document.getElementById("event-details");
  if (!detailsDiv) return;

  let buttons = `<button onclick="location.href='view-event.html?id=${event.id}'">View Event</button>`;
  if (role === 'staff' || (role === 'student' && event.scope === 'student' && event.username === username)) {
    buttons += `<br><button onclick="location.href='edit-event-${role}.html?id=${event.id}'">Edit Event</button>`;
    buttons += `<br><button onclick="deleteEvent('${event.id}', '${role}', '${username}')">Delete Event</button>`;
  }

  detailsDiv.innerHTML = `
    <h3>${event.name || 'Unnamed Event'}</h3>
    <p><strong>Category:</strong> ${event.category || ''}</p>
    <p>${event.description || ''}</p>
    <p><strong>Date:</strong> ${event.date}</p>
    ${buttons}
  `;
}

function deleteEvent(id, role, username) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  let events = JSON.parse(localStorage.getItem('events') || '[]');
  events = events.filter(e => e.id !== id);
  localStorage.setItem('events', JSON.stringify(events));
  // Refresh calendar
  setupCalendar(role, username);
  // Clear details
  document.getElementById("event-details").innerHTML = "";
}

function setupCalendar(role, username) {
  let current = new Date();

  function render() {
    const year = current.getFullYear();
    const month = current.getMonth();

    const monthLabel = document.getElementById("month-label");
    const calendarDiv = document.getElementById("calendar");

    if (!monthLabel || !calendarDiv) {
      console.error("Calendar elements not found on this page");
      return;
    }

    monthLabel.textContent =
      current.toLocaleString("default", { month: "long" }) + " " + year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let html = `
      <table border="1" cellspacing="0" cellpadding="5">
        <tr>
          <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th>
          <th>Thu</th><th>Fri</th><th>Sat</th>
        </tr>
        <tr>
    `;

    let cellCount = 0;

    // Empty cells before month starts
    for (let i = 0; i < startDay; i++) {
      html += "<td></td>";
      cellCount++;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

      let eventsForDay = getEventsForUser(role, username).filter(e => e.date === dateStr);
      let eventHtml = eventsForDay.map(e => `<div class="event-dot" onclick="selectEvent('${e.id}', '${role}', '${username}')">${e.name || 'Unnamed'}</div>`).join('');

      html += `
        <td>
          ${day}${eventHtml}
        </td>
      `;

      cellCount++;

      if (cellCount % 7 === 0) html += "</tr><tr>";
    }

    html += "</tr></table>";

    calendarDiv.innerHTML = html;
  }

  document.getElementById("prev-month").onclick = () => {
    current.setMonth(current.getMonth() - 1);
    render();
  };

  document.getElementById("next-month").onclick = () => {
    current.setMonth(current.getMonth() + 1);
    render();
  };

  render();
}
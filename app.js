function validatePassword(password) {
  if (password.length < 8 || password.length > 64) {
    return "Password must be between 8 and 64 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least 1 capital letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least 1 lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least 1 number.";
  }
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    return "Password must contain at least 1 special character.";
  }
  return null;
}

const categoryColors = {
  Homework: '#4caf50',
  Exam: '#f44336',
  Club: '#2196f3',
  Sports: '#ff9800',
  Other: '#9c27b0'
};

function getCategoryColor(category) {
  return categoryColors[category] || '#607d8b';
}

function getNotificationKey(username, eventId) {
  return `${username}|${eventId}`;
}

function setNotificationPreference(username, eventId, enabled) {
  let store = JSON.parse(localStorage.getItem('notifications') || '{}');
  store[getNotificationKey(username, eventId)] = enabled;
  localStorage.setItem('notifications', JSON.stringify(store));
}

function getNotificationPreference(username, eventId) {
  let store = JSON.parse(localStorage.getItem('notifications') || '{}');
  return !!store[getNotificationKey(username, eventId)];
}

function initializeDefaultAdmin() {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.find(u => u.username === 'admin@school.example.com')) {
    const adminUser = {
      username: 'admin@school.example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };
    users.push(adminUser);
    localStorage.setItem('users', JSON.stringify(users));
  }
}

initializeDefaultAdmin();

function addUser(username, password, firstName, lastName, role) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  const newUser = {
    username: username,
    password: password,
    firstName: firstName,
    lastName: lastName,
    role: role
  };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
}

function authenticateUser(email, password) {
  let users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.username === email && u.password === password);
  return user || null;
}

function getAllEvents() {
  return JSON.parse(localStorage.getItem('events') || '[]');
}

function getEventsForUser(role, username) {
  let events = JSON.parse(localStorage.getItem('events') || '[]');
  if (role === 'admin') {
    return events;
  } else if (role === 'staff') {
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
    event.createdBy = username;
    event.createdByRole = role;
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

  const notifyKey = getNotificationKey(username, event.id);
  const notifyEnabled = getNotificationPreference(username, event.id);

  detailsDiv.innerHTML = `
    <h3>${event.name || 'Unnamed Event'}</h3>
    <p><strong>Category:</strong> ${event.category || ''}</p>
    <p>${event.description || ''}</p>
    <p><strong>Date:</strong> ${event.date}${event.time ? ' ' + event.time : ''}</p>
    <label>
      <input type="checkbox" id="notify-checkbox" ${notifyEnabled ? 'checked' : ''}>
      Notify me about this event
    </label>
    <br><br>
    ${buttons}
  `;

  const checkbox = document.getElementById('notify-checkbox');
  if (checkbox) {
    checkbox.onchange = () => setNotificationPreference(username, event.id, checkbox.checked);
  }
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
      let eventHtml = eventsForDay.map(e => `
        <div class="event-dot" style="background: ${getCategoryColor(e.category)};" title="${(e.time ? e.time + ' - ' : '') + (e.name || 'Unnamed') }" onclick="selectEvent('${e.id}', '${role}', '${username}')">${e.name || 'Unnamed'}</div>
      `).join('');

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
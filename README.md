# 🗓️ Calendra Lite

A lightweight calendar app for managing events. No bloat—just a clean calendar that works in your browser.

## ✨ Features

- **📅 Month Calendar** – Navigate months, view all events
- **🎯 Event Management** – Add, edit, delete events with modal interface
- **⏰ Time-based Events** – Optional start and end times
- **🔍 Search** – Filter events by title and description
- **🔔 Reminders** – Popup notifications for today and tomorrow
- **💾 Auto-Save** – Events saved locally (persists across sessions)
- **⚡ Conflict Detection** – Warns when events overlap

## 🚀 Getting Started

Open `index.html` in your browser. That's it!

### Adding an Event
1. Click a date or click "Add Event"
2. Fill in event name and date (required)
3. Optionally add times, description, and reminder
4. Click Save

### Editing/Deleting
- Select an event from the sidebar
- Click "Edit" to modify or "Delete" to remove

### Reminders
Enable "Popup" reminder when creating an event. You'll get a notification for today's and tomorrow's events (once per day).

## � Project Structure

```
├── index.html    # UI
├── style.css     # Styling
├── app.js        # Logic
└── README.md
```

## 🔧 Development

### Setup
Just open `index.html` in a browser, or run a local server:
```bash
python -m http.server 8000
# or
npx http-server
```

### Tech Stack
- **Vanilla JavaScript** – No frameworks
- **LocalStorage** – Events saved in browser (not cloud synced)
- **HTML5 + CSS3** – Pure markup and styling
- **ISO 8601 dates** – `YYYY-MM-DD` format
- **24-hour time** – `HH:MM` format

### Event Object
```javascript
{
  id: string,
  title: string,
  date: "YYYY-MM-DD",
  start: "HH:MM" | null,
  end: "HH:MM" | null,
  description: string,
  remindMode: "off" | "popup"
}
```

### Key Functions
- `render()` – Update calendar grid
- `renderDayPanel()` – Update sidebar
- `onSave()` / `onDelete()` – Save or remove events
- `detectConflicts()` – Find overlapping events

## 🤝 Contributing

1. Fork/clone the repo
2. Make changes in a new branch
3. Test in multiple browsers
4. Submit a pull request

### Enhancement Ideas
- Dark mode
- Recurring events
- Event categories/colors
- Import/export (ICS, CSV)
- Keyboard shortcuts
- i18n support

## 📋 Quick Test Checklist

- [ ] Previous/Next/Today buttons work
- [ ] Add/edit/delete events
- [ ] Search filters events
- [ ] Events persist after refresh
- [ ] Reminders display correctly
- [ ] Conflict detection works
- [ ] Mobile/tablet layout works

## 🌐 Browser Support

Chrome, Firefox, Safari, Edge (any modern browser with ES6 support)

---

**Questions?** Submit an issue or PR!

const dayMap = {
  Mon: '周一',
  Tue: '周二',
  Wed: '周三',
  Thu: '周四',
  Fri: '周五',
  Sat: '周六',
  Sun: '周日'
};

const storageKey = 'teacher-scheduler-demo';

const defaultSchedule = [
  {
    id: 1,
    teacher: '王老师',
    course: '语文阅读',
    student: '李同学',
    day: 'Mon',
    start: '09:00',
    end: '10:30',
    room: 'A101'
  },
  {
    id: 2,
    teacher: '王老师',
    course: '数学训练',
    student: '赵同学',
    day: 'Tue',
    start: '14:00',
    end: '15:30',
    room: 'B201'
  },
  {
    id: 3,
    teacher: '王老师',
    course: '英语口语',
    student: '陈同学',
    day: 'Wed',
    start: '10:00',
    end: '11:00',
    room: 'C305'
  },
  {
    id: 4,
    teacher: '王老师',
    course: '写作辅导',
    student: '林同学',
    day: 'Thu',
    start: '15:00',
    end: '16:30',
    room: 'A208'
  },
  {
    id: 5,
    teacher: '王老师',
    course: '代数提高',
    student: '周同学',
    day: 'Fri',
    start: '09:30',
    end: '11:00',
    room: 'B108'
  }
];

const state = {
  schedule: loadSchedule()
};

function loadSchedule() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return defaultSchedule;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultSchedule;
  } catch {
    return defaultSchedule;
  }
}

function saveSchedule() {
  localStorage.setItem(storageKey, JSON.stringify(state.schedule));
}

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function getLessonDuration(item) {
  return Math.max(0, toMinutes(item.end) - toMinutes(item.start));
}

function findConflicts(items) {
  const conflicts = [];

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];

      if (a.day !== b.day || a.teacher !== b.teacher) continue;

      const aStart = toMinutes(a.start);
      const aEnd = toMinutes(a.end);
      const bStart = toMinutes(b.start);
      const bEnd = toMinutes(b.end);

      const isOverlap = aStart < bEnd && bStart < aEnd;
      if (isOverlap) {
        conflicts.push({
          a,
          b,
          message: `${a.course} 与 ${b.course} 时间冲突`
        });
      }
    }
  }

  return conflicts;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

function renderStats() {
  const total = state.schedule.length;
  const totalMinutes = state.schedule.reduce((sum, item) => sum + getLessonDuration(item), 0);
  const conflictCount = findConflicts(state.schedule).length;
  const freeSlots = calculateFreeSlots();

  document.getElementById('total-lessons').textContent = String(total);
  document.getElementById('weekly-hours').textContent = `${Math.round(totalMinutes / 60)}h`;
  document.getElementById('conflict-count').textContent = String(conflictCount);
  document.getElementById('free-slot-count').textContent = String(freeSlots);
}

function calculateFreeSlots() {
  const slots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const occupied = new Set();
  state.schedule.forEach((item) => {
    const start = item.start.slice(0, 2) + ':00';
    occupied.add(`${item.day}:${start}`);
  });

  let count = 0;
  Object.keys(dayMap).forEach((day) => {
    slots.forEach((slot) => {
      if (!occupied.has(`${day}:${slot}`)) count += 1;
    });
  });

  return count;
}

function renderWeekView() {
  const weekView = document.getElementById('week-view');
  weekView.innerHTML = '';

  Object.entries(dayMap).forEach(([dayKey, dayLabel]) => {
    const column = document.createElement('div');
    column.className = 'day-column';

    const header = document.createElement('div');
    header.className = 'day-header';
    header.innerHTML = `<span>${dayLabel}</span><small>${state.schedule.filter((item) => item.day === dayKey).length}</small>`;

    const events = document.createElement('div');
    events.className = 'day-events';

    const dayLessons = state.schedule
      .filter((lesson) => lesson.day === dayKey)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    if (!dayLessons.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-day';
      empty.textContent = '暂无课程';
      events.appendChild(empty);
    } else {
      dayLessons.forEach((lesson) => {
        const item = document.createElement('div');
        item.className = 'event-card';
        item.innerHTML = `
          <strong>${lesson.course}</strong>
          <span>${lesson.student}</span>
          <span>${lesson.start} - ${lesson.end}</span>
          <span>${lesson.room}</span>
        `;
        events.appendChild(item);
      });
    }

    column.appendChild(header);
    column.appendChild(events);
    weekView.appendChild(column);
  });
}

function renderScheduleList() {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';

  if (!state.schedule.length) {
    list.innerHTML = '<div class="empty-state">暂无课程安排</div>';
    return;
  }

  const sorted = [...state.schedule].sort((a, b) => {
    const compareDay = Object.keys(dayMap).indexOf(a.day) - Object.keys(dayMap).indexOf(b.day);
    if (compareDay !== 0) return compareDay;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  sorted.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'lesson-item';

    const main = document.createElement('div');
    main.className = 'lesson-main';
    main.innerHTML = `
      <span class="lesson-tag">${dayMap[item.day]}</span>
      <strong>${item.course}</strong>
      <span>${item.student} · ${item.teacher} · ${item.start} - ${item.end}</span>
      <span>${item.room} · ${formatDuration(getLessonDuration(item))}</span>
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => {
      state.schedule = state.schedule.filter((entry) => entry.id !== item.id);
      saveSchedule();
      render();
    });

    wrapper.appendChild(main);
    wrapper.appendChild(deleteBtn);
    list.appendChild(wrapper);
  });
}

function renderConflictPanel() {
  const panel = document.getElementById('conflict-panel');
  panel.innerHTML = '';

  const conflicts = findConflicts(state.schedule);

  if (!conflicts.length) {
    panel.innerHTML = '<div class="empty-state">暂无时间冲突，课程安排正常</div>';
    return;
  }

  conflicts.forEach(({ a, b, message }) => {
    const box = document.createElement('div');
    box.className = 'conflict-item';
    box.innerHTML = `
      <strong>${message}</strong>
      <p>${dayMap[a.day]} ${a.start}-${a.end}：${a.course} / ${a.student}</p>
      <p>${dayMap[b.day]} ${b.start}-${b.end}：${b.course} / ${b.student}</p>
    `;
    panel.appendChild(box);
  });
}

function render() {
  renderStats();
  renderWeekView();
  renderScheduleList();
  renderConflictPanel();
}

function handleSubmit(event) {
  event.preventDefault();

  const teacher = document.getElementById('teacher').value.trim();
  const course = document.getElementById('course').value.trim();
  const student = document.getElementById('student').value.trim();
  const room = document.getElementById('room').value.trim();
  const day = document.getElementById('day').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;

  if (!teacher || !course || !student || !room || !day || !start || !end) {
    return;
  }

  if (toMinutes(end) <= toMinutes(start)) {
    window.alert('结束时间必须晚于开始时间');
    return;
  }

  const newItem = {
    id: Date.now(),
    teacher,
    course,
    student,
    day,
    start,
    end,
    room
  };

  state.schedule.push(newItem);
  saveSchedule();
  render();
  event.target.reset();
  document.getElementById('teacher').value = teacher;
  document.getElementById('day').value = 'Mon';
  document.getElementById('start').value = '09:00';
  document.getElementById('end').value = '10:30';
  document.getElementById('room').value = 'A101';
}

function resetDemoData() {
  state.schedule = [...defaultSchedule];
  saveSchedule();
  render();
}

document.getElementById('schedule-form').addEventListener('submit', handleSubmit);
document.getElementById('reset-btn').addEventListener('click', resetDemoData);

render();

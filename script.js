const STORAGE_KEYS = {
  user: 'studyverse-user',
  settings: 'studyverse-settings',
  notes: 'studyverse-notes',
  planner: 'studyverse-planner',
  progress: 'studyverse-progress',
  subjects: 'studyverse-subjects'
};

const LAUNCH_NOTICE_KEY = 'studyverse-launch-notice-shown';

const defaultSubjects = [
  { id: 'maths', name: 'Maths', chapters: [
    { id: 'math-1', title: 'Calculus', completed: true },
    { id: 'math-2', title: 'Matrices', completed: true },
    { id: 'math-3', title: 'Probability', completed: false }
  ] }
];

const quizQuestions = [
  { question: 'What is the derivative of sin(x)?', options: ['cos(x)', 'tan(x)', 'sec(x)', '-cos(x)'], answer: 0 },
  { question: 'Which is the lightest gas?', options: ['Oxygen', 'Hydrogen', 'Helium', 'Nitrogen'], answer: 1 },
  { question: 'Who wrote the play Hamlet?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'George Orwell'], answer: 1 }
];

const flashcards = [
  { front: 'Define acceleration', back: 'Rate of change of velocity with respect to time.' },
  { front: 'What is Newton’s second law?', back: 'Force equals mass times acceleration.' },
  { front: 'What is a catalyst?', back: 'A substance that speeds up a reaction without being consumed.' }
];

const quotes = [
  'Small steps every day build giant results.',
  'Focus is the secret ingredient of progress.',
  'You do not need perfect days, just consistent ones.'
];

const achievements = [
  { title: 'First Study', unlocked: true, icon: '🌱' },
  { title: '7 Day Streak', unlocked: true, icon: '🔥' },
  { title: '30 Day Streak', unlocked: false, icon: '⚡' },
  { title: '100 Hours', unlocked: false, icon: '⏳' },
  { title: 'Quiz Champion', unlocked: true, icon: '🧠' },
  { title: 'Perfect Score', unlocked: false, icon: '⭐' }
];

const state = {
  user: null,
  settings: { dark: false, notifications: true, sound: true, animations: true, focusMode: false, reminders: true },
  notes: [],
  planner: [],
  subjects: defaultSubjects.map((subject) => ({ ...subject, chapters: subject.chapters.map((chapter) => ({ ...chapter })) })),
  progress: {
    streak: 0,
    level: 1,
    xp: 0,
    studyHours: 0,
    revision: 0,
    focus: 0,
    quizScore: 0,
    weekly: [0, 0, 0, 0, 0, 0, 0],
    studyHeatmap: [0, 0, 0, 0, 0, 0, 0],
    sessions: [],
    dailyGoal: { sessions: 0, revision: 0, targetSessions: 3, targetRevision: 2 },
    exam: 'Maths Practice',
    challenges: []
  },
  currentView: 'home',
  session: { minutes: 25, remaining: 25 * 60, running: false, intervalId: null },
  audio: { context: null, oscillator: null, gain: null, playing: false },
  quiz: { current: 0, score: 0, finished: false, selected: null },
  flashcards: { index: 0, flipped: false, bookmarked: [] },
  notesEditingId: null,
  calendar: { currentDate: new Date(2026, 5, 1) }
};

let profileAvatarDraft = null;

function getProfileStyleClass() {
  return state.user?.style || 'calm';
}

const calendarEvents = [
  { date: '2026-06-26', title: "Anushka's Special Birthday", note: 'Celebrate with a joyful study break and a favorite treat.', type: 'special' },
  { date: '2026-06-28', title: 'Revision Sprint', note: 'Revisit weak chapters for 25 minutes.', type: 'study' },
  { date: '2026-06-30', title: 'Mock Quiz', note: 'Take a quick quiz to boost confidence.', type: 'study' }
];

function init() {
  bindEvents();
  preloadApp();
  showLaunchNotice();
  applyTheme();
  renderAll();
  registerServiceWorker();
  showSplash();
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (state.settings.animations) {
      splash.style.opacity = '0';
      splash.style.transform = 'scale(1.05)';
      setTimeout(() => {
        splash.remove();
        showAppShell();
      }, 400);
    } else {
      splash.remove();
      showAppShell();
    }
  }, state.settings.animations ? 2200 : 600);
}

function showAppShell() {
  document.getElementById('appShell').hidden = false;
  if (!state.user) {
    document.getElementById('authScreen').style.display = 'grid';
  } else {
    document.getElementById('authScreen').style.display = 'none';
    showToast('Welcome to Anushka Study Studio');
  }
  setView('home');
}

function preloadApp() {
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || 'null');
  const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || 'null');
  const planner = JSON.parse(localStorage.getItem(STORAGE_KEYS.planner) || 'null');
  const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) || 'null');
  const subjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.subjects) || 'null');
  if (user) state.user = user;
  if (settings) state.settings = { ...state.settings, ...settings };
  if (notes) state.notes = notes;
  if (planner) state.planner = planner;
  if (subjects) state.subjects = subjects;
  if (progress) state.progress = { ...state.progress, ...progress };
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
  localStorage.setItem(STORAGE_KEYS.planner, JSON.stringify(state.planner));
  localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(state.subjects));
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state.progress));
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.target));
  });
  document.querySelectorAll('.action-btn').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.target));
  });
  document.getElementById('themeToggle').addEventListener('click', () => {
    state.settings.dark = !state.settings.dark;
    applyTheme();
    saveState();
    showToast('Theme updated');
  });
  document.getElementById('revisionStartBtn').addEventListener('click', () => {
    setView('revision');
    showToast('Revision mode activated');
    state.progress.revision = Math.min(100, state.progress.revision + 6);
    state.progress.dailyGoal.revision += 1;
    renderAll();
    saveState();
  });
  document.querySelectorAll('.timer-options .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const minutes = Number(chip.dataset.minutes);
      if (minutes > 0) {
        state.session.minutes = minutes;
        state.session.remaining = minutes * 60;
        updateTimerUI();
      } else {
        const custom = prompt('Set custom minutes', '30');
        if (custom) {
          state.session.minutes = Number(custom);
          state.session.remaining = Number(custom) * 60;
          updateTimerUI();
        }
      }
    });
  });
  document.getElementById('startSessionBtn').addEventListener('click', () => toggleSession());
  document.getElementById('resetSessionBtn').addEventListener('click', () => {
    state.session.running = false;
    clearInterval(state.session.intervalId);
    state.session.remaining = state.session.minutes * 60;
    updateTimerUI();
  });
  document.getElementById('soundToggle').addEventListener('click', () => {
    state.settings.sound = !state.settings.sound;
    document.getElementById('soundToggle').textContent = state.settings.sound ? '🔊' : '🔈';
    if (!state.settings.sound) {
      stopStudySound();
    }
    saveState();
  });
  document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
  document.getElementById('exportNotesBtn').addEventListener('click', exportNotes);
  document.getElementById('noteSearch').addEventListener('input', renderNotes);
  document.getElementById('addSubjectBtn').addEventListener('click', addSubject);
  document.getElementById('subjectNameInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSubject();
    }
  });
  document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
  document.getElementById('profileAvatarInput').addEventListener('change', handleProfileAvatarSelection);
  document.getElementById('cropAvatarBtn').addEventListener('click', () => transformProfileAvatar('crop'));
  document.getElementById('resizeAvatarBtn').addEventListener('click', () => transformProfileAvatar('resize'));
  document.getElementById('removeAvatarBtn').addEventListener('click', removeProfileAvatar);
  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name = document.getElementById('profileNameInput').value.trim();
    const bio = document.getElementById('profileBioInput').value.trim();
    const style = document.getElementById('profileStyleSelect').value;
    if (name) state.user.name = name;
    if (bio) state.user.bio = bio;
    state.user.style = style;

    if (profileAvatarDraft) {
      state.user.avatar = profileAvatarDraft;
    }

    saveState();
    renderProfile();
    renderHome();
    showToast('Profile updated');
  });
  document.getElementById('profileDarkToggle').addEventListener('change', (e) => {
    state.settings.dark = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('profileNotifyToggle').addEventListener('change', (e) => {
    state.settings.notifications = e.target.checked;
    saveState();
  });
  document.getElementById('profileSoundToggle').addEventListener('change', (e) => {
    state.settings.sound = e.target.checked;
    saveState();
  });
  document.getElementById('profileAnimationToggle').addEventListener('change', (e) => {
    state.settings.animations = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('profileFocusToggle').addEventListener('change', (e) => {
    state.settings.focusMode = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('profileReminderToggle').addEventListener('change', (e) => {
    state.settings.reminders = e.target.checked;
    saveState();
  });
  document.getElementById('authForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.user = {
      name: formData.get('name') || 'Student',
      class: formData.get('classLevel') || 'Class 11',
      stream: formData.get('stream') || 'Science',
      avatar: formData.get('avatar') || '🌟',
      rememberMe: formData.get('rememberMe') === 'on'
    };
    saveState();
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appShell').hidden = false;
    renderAll();
    showToast('Profile ready');
  });
  document.getElementById('resetBtn').addEventListener('click', resetAppData);
  document.getElementById('guideBtn').addEventListener('click', () => {
    const guideCard = document.getElementById('guideCard');
    if (guideCard) {
      guideCard.hidden = !guideCard.hidden;
      showToast(guideCard.hidden ? 'Guide hidden' : 'Guide opened');
    }
  });
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    state.calendar.currentDate = new Date(state.calendar.currentDate.getFullYear(), state.calendar.currentDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    state.calendar.currentDate = new Date(state.calendar.currentDate.getFullYear(), state.calendar.currentDate.getMonth() + 1, 1);
    renderCalendar();
  });
  document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    state.settings.dark = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('notifyToggle').addEventListener('change', (e) => {
    state.settings.notifications = e.target.checked;
    saveState();
  });
  document.getElementById('soundToggleSetting').addEventListener('change', (e) => {
    state.settings.sound = e.target.checked;
    saveState();
  });
  document.getElementById('animationToggle').addEventListener('change', (e) => {
    state.settings.animations = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('focusModeToggle').addEventListener('change', (e) => {
    state.settings.focusMode = e.target.checked;
    applyTheme();
    saveState();
  });
  document.getElementById('reminderToggle').addEventListener('change', (e) => {
    state.settings.reminders = e.target.checked;
    saveState();
    showToast(state.settings.reminders ? 'Reminders enabled' : 'Reminders disabled');
  });
  document.getElementById('chipGrid').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      showToast(`Revision: ${chip.textContent}`);
      state.progress.revision = Math.min(100, state.progress.revision + 4);
      state.progress.dailyGoal.revision += 1;
      renderAll();
    }
  });
  document.getElementById('flashCard').addEventListener('click', () => {
    state.flashcards.flipped = !state.flashcards.flipped;
    renderFlashcard();
  });
  document.getElementById('flipCardBtn').addEventListener('click', () => {
    state.flashcards.flipped = !state.flashcards.flipped;
    renderFlashcard();
  });
  document.getElementById('nextCardBtn').addEventListener('click', () => {
    state.flashcards.index = (state.flashcards.index + 1) % flashcards.length;
    state.flashcards.flipped = false;
    renderFlashcard();
  });
  document.getElementById('prevCardBtn').addEventListener('click', () => {
    state.flashcards.index = (state.flashcards.index - 1 + flashcards.length) % flashcards.length;
    state.flashcards.flipped = false;
    renderFlashcard();
  });
  document.getElementById('bookmarkBtn').addEventListener('click', () => {
    state.flashcards.bookmarked.push(flashcards[state.flashcards.index].front);
    showToast('Bookmarked');
  });
  document.getElementById('shuffleBtn').addEventListener('click', () => {
    state.flashcards.index = Math.floor(Math.random() * flashcards.length);
    state.flashcards.flipped = false;
    renderFlashcard();
  });
  document.getElementById('favoriteBtn').addEventListener('click', () => {
    showToast('Favorite saved');
  });
}

function renderAll() {
  renderHome();
  renderSubjects();
  renderRevision();
  if (document.getElementById('quizCard') && document.getElementById('leaderboardList')) {
    renderQuiz();
  }
  renderFlashcard();
  renderCalendar();
  renderNotes();
  renderPlanner();
  renderAnalytics();
  renderAchievements();
  renderProfile();
  renderSettings();
  renderChallenges();
  renderRevisionTips();
  updateTimerUI();
  saveState();
}

function renderStreakRewards() {
  const container = document.getElementById('streakRewards');
  const badgeLabel = document.getElementById('streakBadgeLabel');
  if (!container || !badgeLabel) return;

  const milestone = state.progress.streak >= 7 ? 'Focused' : state.progress.streak >= 3 ? 'Building' : 'Starter';
  const nextMilestone = state.progress.streak >= 7 ? '7-day streak completed' : state.progress.streak >= 3 ? '3-day streak completed' : '3-day streak target';
  const progress = Math.min(100, (state.progress.streak / 7) * 100);

  badgeLabel.textContent = milestone;
  badgeLabel.className = `pill ${state.progress.streak >= 7 ? 'success' : 'accent'}`;

  container.innerHTML = `
    <div class="streak-ring">
      <div class="streak-ring-inner">${state.progress.streak}</div>
    </div>
    <div class="streak-info">
      <p class="muted">Current streak</p>
      <strong>${state.progress.streak} days</strong>
      <div class="bar"><span style="width:${progress}%"></span></div>
      <p class="muted">Next reward: ${nextMilestone}</p>
      <div class="badge-row">
        <span class="badge-chip ${state.progress.streak >= 1 ? 'earned' : ''}">🌱 Day 1</span>
        <span class="badge-chip ${state.progress.streak >= 3 ? 'earned' : ''}">⚡ 3 Days</span>
        <span class="badge-chip ${state.progress.streak >= 7 ? 'earned' : ''}">🔥 7 Days</span>
      </div>
    </div>
  `;
}

function renderHome() {
  const greeting = document.getElementById('studentGreeting');
  const subtitle = document.getElementById('heroSubtitle');
  const streak = document.getElementById('streakValue');
  const level = document.getElementById('levelValue');
  const goal = document.getElementById('goalValue');
  const xp = document.getElementById('xpValue');
  const revisionBar = document.getElementById('revisionBar');
  const goalSessions = document.getElementById('goalSessions');
  const goalRevision = document.getElementById('goalRevision');
  const dailyGoalStatus = document.getElementById('dailyGoalStatus');
  const focusBar = document.getElementById('focusBar');
  const quote = document.getElementById('quoteText');
  const exam = document.getElementById('examValue');
  const name = state.user?.name || 'Student';
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  greeting.textContent = `${salutation}, ${name}`;
  subtitle.textContent = `You’re ${state.progress.revision}% ready for your next milestone.`;
  streak.textContent = state.progress.streak;
  level.textContent = state.progress.level;
  goal.textContent = `${Math.max(1, 3 - Math.floor(state.progress.revision / 30))} sessions`;
  xp.textContent = state.progress.xp;
  revisionBar.style.width = `${state.progress.revision}%`;
  focusBar.style.width = `${state.progress.focus}%`;
  quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  exam.textContent = state.progress.exam;
  goalSessions.textContent = `${state.progress.dailyGoal.sessions} / ${state.progress.dailyGoal.targetSessions}`;
  goalRevision.textContent = `${state.progress.dailyGoal.revision} / ${state.progress.dailyGoal.targetRevision}`;
  const goalComplete = state.progress.dailyGoal.sessions >= state.progress.dailyGoal.targetSessions && state.progress.dailyGoal.revision >= state.progress.dailyGoal.targetRevision;
  dailyGoalStatus.textContent = goalComplete ? 'Completed' : 'On track';
  dailyGoalStatus.className = `pill ${goalComplete ? 'success' : 'accent'}`;
  subtitle.textContent = state.settings.focusMode ? 'Focus mode is on. Keep distractions low.' : `You’re ${state.progress.revision}% ready for your next milestone.`;
  document.getElementById('topbarTitle').textContent = `Anushka Study Studio • ${name}`;
  renderStreakRewards();
}

function renderSubjects() {
  const grid = document.getElementById('subjectsGrid');
  if (!grid) return;
  grid.innerHTML = state.subjects.map((subject) => {
    const completed = subject.chapters.filter((chapter) => chapter.completed).length;
    const total = subject.chapters.length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;
    return `
      <div class="subject-card glass-card">
        <div class="subject-top">
          <h4>${subject.name}</h4>
          <div class="button-row">
            <span class="pill">${progress}%</span>
            <button class="chip delete-subject-btn" data-subject-id="${subject.id}">Delete</button>
          </div>
        </div>
        <p class="muted">${completed}/${total} chapters done • ${remaining} remaining</p>
        <div class="bar"><span style="width:${progress}%"></span></div>
        <div class="chapter-list">
          ${subject.chapters.map((chapter) => `
            <label class="chapter-item">
              <input type="checkbox" data-subject-id="${subject.id}" data-chapter-id="${chapter.id}" ${chapter.completed ? 'checked' : ''} />
              <span>${chapter.title}</span>
            </label>
          `).join('')}
        </div>
        <div class="subject-actions">
          <input class="input" id="chapterInput-${subject.id}" placeholder="Add chapter" />
          <button class="chip add-chapter-btn" data-subject-id="${subject.id}">+ Add</button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.add-chapter-btn').forEach((button) => {
    button.addEventListener('click', () => addChapter(button.dataset.subjectId));
  });
  grid.querySelectorAll('.delete-subject-btn').forEach((button) => {
    button.addEventListener('click', () => deleteSubject(button.dataset.subjectId));
  });
  grid.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => toggleChapter(event.target.dataset.subjectId, event.target.dataset.chapterId, event.target.checked));
  });
  grid.querySelectorAll('.input').forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addChapter(input.id.replace('chapterInput-', ''));
      }
    });
  });
}

function renderRevision() {
  const chipGrid = document.getElementById('chipGrid');
  chipGrid.innerHTML = ['Quick Revision', 'Important Questions', 'Formula Revision', 'Previous Papers', 'Flash Cards', 'Mind Maps'].map((item) => `<button class="chip">${item}</button>`).join('');
  const queue = document.getElementById('revisionQueue');
  if (!queue) return;
  const pendingChapters = state.subjects.flatMap((subject) => subject.chapters.filter((chapter) => !chapter.completed).map((chapter) => ({ subject: subject.name, chapter })));
  if (!pendingChapters.length) {
    queue.innerHTML = '<p class="muted">All chapters are done. Great work!</p>';
    return;
  }
  queue.innerHTML = pendingChapters.slice(0, 6).map(({ subject, chapter }) => `
    <div class="revision-queue-item">
      <span>${chapter.title}</span>
      <strong>${subject}</strong>
    </div>
  `).join('');
}

function renderQuiz() {
  const quizCard = document.getElementById('quizCard');
  const leaderboardList = document.getElementById('leaderboardList');
  if (!quizCard || !leaderboardList) return;
  if (state.quiz.finished) {
    quizCard.innerHTML = `
      <div class="notice-card">
        <h4>Quiz Complete</h4>
        <p class="muted">You scored ${state.progress.quizScore}% today. Keep learning to improve.</p>
      </div>
    `;
  } else {
    const current = quizQuestions[state.quiz.current];
    if (!current) {
      state.quiz.finished = true;
      state.progress.quizScore = Math.round((state.quiz.score / quizQuestions.length) * 100);
      state.progress.xp += 120;
      saveState();
      renderQuiz();
      return;
    }
    quizCard.innerHTML = `
      <div class="notice-card">
        <h4>${current.question}</h4>
        <div class="quiz-options">
          ${current.options.map((option, index) => `<button class="primary-btn option-btn" data-index="${index}">${option}</button>`).join('')}
        </div>
      </div>
    `;
    quizCard.querySelectorAll('.option-btn').forEach((button) => {
      button.addEventListener('click', () => handleQuizAnswer(Number(button.dataset.index)));
    });
  }
  leaderboardList.innerHTML = `
    <h4>Weekly Leaderboard</h4>
    <div><span>Current score</span><strong>${state.quiz.score}/${quizQuestions.length}</strong></div>
    <div><span>XP earned</span><strong>${state.progress.xp}</strong></div>
  `;
}

function handleQuizAnswer(index) {
  const current = quizQuestions[state.quiz.current];
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, btnIndex) => {
    if (btnIndex === current.answer) btn.classList.add('correct');
    if (btnIndex === index && btnIndex !== current.answer) btn.classList.add('wrong');
  });
  if (index === current.answer) {
    state.quiz.score += 1;
    showToast('Correct!');
  } else {
    showToast('Try again next time');
  }
  setTimeout(() => {
    state.quiz.current += 1;
    if (state.quiz.current >= quizQuestions.length) {
      state.quiz.finished = true;
      state.progress.quizScore = Math.round((state.quiz.score / quizQuestions.length) * 100);
      state.progress.xp += 120;
      saveState();
    }
    renderQuiz();
    renderHome();
  }, 900);
}

function renderFlashcard() {
  const card = document.getElementById('flashCard');
  const item = flashcards[state.flashcards.index];
  const face = state.flashcards.flipped ? item.back : item.front;
  card.innerHTML = `
    <div class="inner ${state.flashcards.flipped ? 'flipped' : ''}">
      <div class="face">
        <div>
          <p class="eyebrow">Flash Card</p>
          <h3>${face}</h3>
          <p class="muted">Tap to flip</p>
        </div>
      </div>
      <div class="face back">
        <div>
          <p class="eyebrow">Answer</p>
          <h3>${item.back}</h3>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const label = document.getElementById('calendarMonthLabel');
  const grid = document.getElementById('calendarGrid');
  const eventList = document.getElementById('calendarEventList');
  if (!label || !grid || !eventList) return;

  const year = state.calendar.currentDate.getFullYear();
  const month = state.calendar.currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(`<div class="calendar-cell muted">${prevMonthDays - firstDay + i + 1}</div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    const iso = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const event = calendarEvents.find((entry) => entry.date === iso);
    const isToday = cellDate.toDateString() === today.toDateString();
    const isSpecial = iso === '2026-06-26';
    cells.push(`
      <div class="calendar-cell ${isToday ? 'today' : ''} ${isSpecial ? 'special-day' : ''}">
        <span class="day-number">${day}</span>
        ${event ? `<span class="event-dot"></span>` : ''}
        ${event ? `<small>${event.title}</small>` : ''}
      </div>
    `);
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length % 7 + 1;
    cells.push(`<div class="calendar-cell muted">${nextDay}</div>`);
  }

  label.textContent = state.calendar.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  grid.innerHTML = cells.join('');

  const monthEvents = calendarEvents.filter((entry) => entry.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
  eventList.innerHTML = monthEvents.length
    ? monthEvents.map((entry) => `
        <div class="calendar-event-item ${entry.type === 'special' ? 'special' : ''}">
          <strong>${entry.title}</strong>
          <p>${entry.note}</p>
        </div>
      `).join('')
    : '<p class="muted">No special plans this month.</p>';
}

function renderNotes() {
  const notesList = document.getElementById('notesList');
  const query = document.getElementById('noteSearch').value.toLowerCase();
  const filtered = state.notes.filter((note) => note.title.toLowerCase().includes(query) || note.text.toLowerCase().includes(query));
  if (!filtered.length) {
    notesList.innerHTML = '<p class="muted">No notes yet.</p>';
    return;
  }
  notesList.innerHTML = filtered.map((note) => `
    <div class="note-item glass-card" style="border-left:6px solid ${note.color}">
      <div class="note-meta">
        <strong>${note.title}</strong>
        <span>${note.pinned ? '📌' : ''}</span>
      </div>
      <p>${note.text}</p>
      <div class="note-meta">
        <span>${note.createdAt}</span>
        <div class="button-row">
          <button class="chip" data-id="${note.id}" data-action="pin">Pin</button>
          <button class="chip" data-id="${note.id}" data-action="edit">Edit</button>
          <button class="chip" data-id="${note.id}" data-action="delete">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
  notesList.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => handleNoteAction(btn.dataset.action, btn.dataset.id));
  });
}

function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const text = document.getElementById('noteText').value.trim();
  const color = document.getElementById('noteColor').value;
  if (!title || !text) return showToast('Fill title and note');
  if (state.notesEditingId) {
    state.notes = state.notes.map((note) => note.id === state.notesEditingId ? { ...note, title, text, color, updatedAt: new Date().toLocaleString() } : note);
    state.notesEditingId = null;
  } else {
    state.notes.unshift({ id: Date.now().toString(), title, text, color, pinned: false, createdAt: new Date().toLocaleString() });
  }
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteText').value = '';
  saveState();
  renderNotes();
  showToast('Note saved');
}

function handleNoteAction(action, id) {
  if (action === 'delete') {
    state.notes = state.notes.filter((note) => note.id !== id);
    saveState();
    renderNotes();
    return;
  }
  if (action === 'pin') {
    state.notes = state.notes.map((note) => note.id === id ? { ...note, pinned: !note.pinned } : note);
    saveState();
    renderNotes();
    return;
  }
  if (action === 'edit') {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteText').value = note.text;
    document.getElementById('noteColor').value = note.color;
    state.notesEditingId = id;
    showToast('Editing note');
  }
}

function renderPlanner() {
  const plannerList = document.getElementById('plannerList');
  if (!state.planner.length) {
    plannerList.innerHTML = '<p class="muted">No tasks yet.</p>';
    return;
  }
  plannerList.innerHTML = state.planner.map((task) => `
    <div class="planner-item glass-card">
      <div class="planner-meta">
        <strong>${task.text}</strong>
        <span>${task.date}</span>
      </div>
      <div class="button-row">
        <button class="chip" data-id="${task.id}" data-action="toggle">${task.done ? 'Undo' : 'Complete'}</button>
        <button class="chip" data-id="${task.id}" data-action="delete">Delete</button>
      </div>
    </div>
  `).join('');
  plannerList.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => handlePlannerAction(btn.dataset.action, btn.dataset.id));
  });
}

function saveTask() {
  const text = document.getElementById('plannerTask').value.trim();
  const date = document.getElementById('plannerDate').value || new Date().toISOString().slice(0, 10);
  if (!text) return showToast('Write a task');
  state.planner.unshift({ id: Date.now().toString(), text, date, done: false });
  document.getElementById('plannerTask').value = '';
  saveState();
  renderPlanner();
  showToast('Task added');
}

function handlePlannerAction(action, id) {
  if (action === 'delete') {
    state.planner = state.planner.filter((task) => task.id !== id);
    saveState();
    renderPlanner();
    return;
  }
  if (action === 'toggle') {
    state.planner = state.planner.map((task) => task.id === id ? { ...task, done: !task.done } : task);
    saveState();
    renderPlanner();
  }
}

function renderAnalytics() {
  document.getElementById('hoursValue').textContent = `${state.progress.studyHours}h`;
  document.getElementById('hourRing').style.background = `conic-gradient(var(--primary) ${state.progress.studyHours * 8}deg, rgba(148, 163, 184, 0.2) 0deg)`;
  document.getElementById('subjectBars').innerHTML = state.subjects.map((subject) => {
    const completed = subject.chapters.filter((chapter) => chapter.completed).length;
    const total = subject.chapters.length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    return `
      <div class="progress-row" style="margin-bottom:0.55rem">
        <label>${subject.name}</label>
        <div class="bar"><span style="width:${progress}%"></span></div>
      </div>
    `;
  }).join('');
  document.getElementById('masteryBars').innerHTML = state.subjects.map((subject) => {
    const completed = subject.chapters.filter((chapter) => chapter.completed).length;
    const total = subject.chapters.length;
    const mastery = total ? Math.round((completed / total) * 100) : 0;
    return `
      <div class="progress-row" style="margin-bottom:0.55rem">
        <label>${subject.name} Mastery</label>
        <div class="bar"><span style="width:${mastery}%"></span></div>
      </div>
    `;
  }).join('');
  document.getElementById('sessionHistory').innerHTML = state.progress.sessions.length ? state.progress.sessions.slice(0, 5).map((session) => `
    <div class="session-item">
      <span>${session.title}</span>
      <strong>${session.duration} min • ${session.completedAt}</strong>
    </div>
  `).join('') : '<p class="muted">No sessions completed yet.</p>';
  document.getElementById('graphBars').innerHTML = state.progress.weekly.map((value) => `<span style="height:${value}%"></span>`).join('');
  document.getElementById('heatmapGrid').innerHTML = state.progress.studyHeatmap.map((value, index) => {
    const intensity = value >= 5 ? 'high' : value >= 3 ? 'medium' : 'low';
    return `<div class="heatmap-cell ${intensity}" title="Day ${index + 1}: ${value} hours"></div>`;
  }).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = achievements.map((item) => `
    <div class="achievement-card glass-card ${item.unlocked ? 'unlocked' : 'locked'}">
      <h4>${item.icon} ${item.title}</h4>
      <p class="muted">${item.unlocked ? 'Unlocked' : 'Keep going to unlock'}</p>
    </div>
  `).join('');
}

function showLaunchNotice() {
  if (localStorage.getItem(LAUNCH_NOTICE_KEY)) return;
  const message = 'This app currently uses local browser storage only and does not support a database yet. Full database support will be added in a future update.';
  window.alert(message);
  localStorage.setItem(LAUNCH_NOTICE_KEY, '1');
  showToast('Local-only mode • database support coming soon');
}

function handleProfileAvatarSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      profileAvatarDraft = reader.result;
      renderProfile();
      showToast('Image ready. Use crop or resize, then save.');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function transformProfileAvatar(mode) {
  if (!profileAvatarDraft) {
    showToast('Choose an image first');
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (mode === 'crop') {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      canvas.width = 256;
      canvas.height = 256;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
    } else {
      const scale = Math.min(1, 220 / Math.max(img.width, img.height));
      canvas.width = Math.max(80, Math.round(img.width * scale));
      canvas.height = Math.max(80, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    profileAvatarDraft = canvas.toDataURL('image/jpeg', 0.92);
    renderProfile();
    showToast(mode === 'crop' ? 'Image cropped' : 'Image resized');
  };
  img.src = profileAvatarDraft;
}

function removeProfileAvatar() {
  profileAvatarDraft = null;
  state.user.avatar = '';
  document.getElementById('profileAvatarInput').value = '';
  saveState();
  renderProfile();
  renderHome();
  showToast('Image removed');
}

function renderProfile() {
  const avatarEl = document.getElementById('profileAvatar');
  const previewSource = profileAvatarDraft || state.user?.avatar;
  if (previewSource && previewSource.startsWith('data:image')) {
    avatarEl.innerHTML = `<img src="${previewSource}" alt="Profile" />`;
  } else {
    avatarEl.innerHTML = state.user?.avatar || '😊';
  }
  document.getElementById('profileName').textContent = state.user?.name || 'Student';
  document.getElementById('profileMeta').textContent = `${state.user?.class || 'Class 11'} • ${state.user?.stream || 'Science'}`;
  document.getElementById('profileBio').textContent = state.user?.bio || 'Focused, calm, and ready to learn.';
  document.getElementById('profileLevel').textContent = state.progress.level;
  document.getElementById('profileXP').textContent = state.progress.xp;
  document.getElementById('profileNameInput').value = state.user?.name || '';
  document.getElementById('profileBioInput').value = state.user?.bio || '';
  document.getElementById('profileStyleSelect').value = state.user?.style || 'calm';
  document.getElementById('profileDarkToggle').checked = state.settings.dark;
  document.getElementById('profileNotifyToggle').checked = state.settings.notifications;
  document.getElementById('profileSoundToggle').checked = state.settings.sound;
  document.getElementById('profileAnimationToggle').checked = state.settings.animations;
  document.getElementById('profileFocusToggle').checked = state.settings.focusMode;
  document.getElementById('profileReminderToggle').checked = state.settings.reminders;
  document.body.classList.remove('style-calm', 'style-energetic', 'style-minimal');
  document.body.classList.add(`style-${getProfileStyleClass()}`);
}

function renderSettings() {
  document.getElementById('darkModeToggle').checked = state.settings.dark;
  document.getElementById('notifyToggle').checked = state.settings.notifications;
  document.getElementById('soundToggleSetting').checked = state.settings.sound;
  document.getElementById('animationToggle').checked = state.settings.animations;
  document.getElementById('focusModeToggle').checked = state.settings.focusMode;
  document.getElementById('reminderToggle').checked = state.settings.reminders;
}

function renderChallenges() {
  const container = document.getElementById('challengesList');
  if (!container) return;
  container.innerHTML = state.progress.challenges.map((challenge) => `
    <div class="challenge-item ${challenge.done ? 'done' : ''}">
      <span>${challenge.text}</span>
      <button class="chip" data-id="${challenge.id}">${challenge.done ? 'Done' : 'Mark'}</button>
    </div>
  `).join('');
  container.querySelectorAll('.chip').forEach((btn) => btn.addEventListener('click', () => toggleChallenge(btn.dataset.id)));
}

function renderRevisionTips() {
  const container = document.getElementById('revisionTips');
  if (!container) return;
  const weakest = state.subjects
    .map((subject) => ({
      ...subject,
      completed: subject.chapters.filter((chapter) => chapter.completed).length,
      total: subject.chapters.length
    }))
    .sort((a, b) => ((a.completed / a.total) || 0) - ((b.completed / b.total) || 0))[0];
  container.innerHTML = `
    <div class="tip-item">
      <span>Focus on ${weakest?.name || 'your next subject'} for a short 15-minute drill.</span>
    </div>
    <div class="tip-item">
      <span>Use flash cards and a quiz set to reinforce weak chapters.</span>
    </div>
    <div class="tip-item">
      <span>Review formulas before your next study sprint to lift accuracy.</span>
    </div>
  `;
}

function toggleChallenge(id) {
  state.progress.challenges = state.progress.challenges.map((challenge) => challenge.id === id ? { ...challenge, done: !challenge.done } : challenge);
  saveState();
  renderChallenges();
  renderHome();
}

function resetAppData() {
  if (!confirm('Reset all local data and start fresh?')) return;
  localStorage.clear();
  state.subjects = defaultSubjects.map((subject) => ({ ...subject, chapters: subject.chapters.map((chapter) => ({ ...chapter })) }));
  state.progress = {
    streak: 0,
    level: 1,
    xp: 0,
    studyHours: 0,
    revision: 0,
    focus: 0,
    quizScore: 0,
    weekly: [0, 0, 0, 0, 0, 0, 0],
    studyHeatmap: [0, 0, 0, 0, 0, 0, 0],
    dailyGoal: { sessions: 0, revision: 0, targetSessions: 3, targetRevision: 2 },
    exam: 'Maths Practice',
    challenges: []
  };
  state.settings = { dark: false, notifications: true, sound: true, animations: true, focusMode: false, reminders: true };
  state.notes = [];
  state.planner = [];
  state.user = null;
  state.quiz = { current: 0, score: 0, finished: false, selected: null };
  state.flashcards = { index: 0, flipped: false, bookmarked: [] };
  state.session = { minutes: 25, remaining: 25 * 60, running: false, intervalId: null };
  state.currentView = 'home';
  saveState();
  location.reload();
}

function addSubject() {
  const input = document.getElementById('subjectNameInput');
  const name = input.value.trim();
  if (!name) return showToast('Enter a subject name');
  state.subjects.unshift({
    id: `subject-${Date.now()}`,
    name,
    chapters: []
  });
  input.value = '';
  saveState();
  renderSubjects();
  renderRevision();
  renderAnalytics();
  showToast('Subject added');
}

function deleteSubject(id) {
  state.subjects = state.subjects.filter((subject) => subject.id !== id);
  saveState();
  renderSubjects();
  renderRevision();
  renderAnalytics();
  showToast('Subject removed');
}

function addChapter(subjectId) {
  const input = document.getElementById(`chapterInput-${subjectId}`);
  const title = input?.value.trim();
  if (!title) return showToast('Enter a chapter name');
  state.subjects = state.subjects.map((subject) => subject.id === subjectId ? {
    ...subject,
    chapters: [...subject.chapters, { id: `${subjectId}-${Date.now()}`, title, completed: false }]
  } : subject);
  input.value = '';
  saveState();
  renderSubjects();
  renderRevision();
  renderAnalytics();
  showToast('Chapter added');
}

function toggleChapter(subjectId, chapterId, completed) {
  state.subjects = state.subjects.map((subject) => subject.id === subjectId ? {
    ...subject,
    chapters: subject.chapters.map((chapter) => chapter.id === chapterId ? { ...chapter, completed } : chapter)
  } : subject);
  if (completed) {
    state.progress.dailyGoal.revision += 1;
  }
  saveState();
  renderSubjects();
  renderRevision();
  renderAnalytics();
  renderHome();
}

function exportNotes() {
  const text = state.notes.map((note) => `# ${note.title}\n${note.text}\n`).join('\n');
  const blob = new Blob([text || 'No notes yet.'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'studyverse-notes.txt';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Notes exported');
}

function setView(view) {
  document.querySelectorAll('.view').forEach((viewEl) => viewEl.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.target === view));
  state.currentView = view;
  document.getElementById('topbarTitle').textContent = `Anushka Study Studio • ${view}`;
}

function applyTheme() {
  document.body.classList.toggle('dark', state.settings.dark);
  document.body.classList.toggle('reduced-motion', !state.settings.animations);
  document.body.classList.toggle('focus-mode', state.settings.focusMode);
  document.getElementById('themeToggle').textContent = state.settings.dark ? '🌙' : '☀️';
}

function showSplash() {
  let progress = 0;
  const fill = document.getElementById('loadingFill');
  const text = document.getElementById('loadingText');
  const step = state.settings.animations ? 140 : 20;
  const interval = setInterval(() => {
    progress += Math.random() * 16 + 6;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
    }
    fill.style.width = `${progress}%`;
    text.textContent = `${Math.round(progress)}%`;
  }, step);
}

function toggleSession() {
  if (state.session.running) {
    clearInterval(state.session.intervalId);
    state.session.running = false;
    stopStudySound();
    document.getElementById('startSessionBtn').textContent = 'Resume';
  } else {
    state.session.running = true;
    if (state.settings.sound) {
      startStudySound();
    }
    document.getElementById('startSessionBtn').textContent = 'Pause';
    state.session.intervalId = setInterval(() => {
      state.session.remaining -= 1;
      updateTimerUI();
      if (state.session.remaining <= 0) {
        clearInterval(state.session.intervalId);
        state.session.running = false;
        stopStudySound();
        document.getElementById('startSessionBtn').textContent = 'Start';
        state.progress.streak += 1;
        state.progress.xp += 180;
        state.progress.studyHours += 1;
        state.progress.dailyGoal.sessions += 1;
        if (state.settings.reminders) {
          showToast('Reminder: keep your next study block going');
        }
        state.progress.sessions.unshift({
          id: Date.now().toString(),
          title: state.settings.focusMode ? 'Focus Sprint' : 'Study Sprint',
          duration: state.session.minutes,
          completedAt: new Date().toLocaleString()
        });
        state.progress.sessions = state.progress.sessions.slice(0, 12);
        saveState();
        renderHome();
        renderAnalytics();
        triggerCelebration();
        showToast('Session complete!');
      }
    }, 1000);
  }
}

function updateTimerUI() {
  const display = document.getElementById('timerDisplay');
  const label = document.getElementById('timerLabel');
  const ring = document.getElementById('timerRing');
  const minutes = Math.floor(state.session.remaining / 60).toString().padStart(2, '0');
  const seconds = (state.session.remaining % 60).toString().padStart(2, '0');
  display.textContent = `${minutes}:${seconds}`;
  label.textContent = state.session.running ? 'In focus' : 'Ready to start';
  const percent = (state.session.remaining / (state.session.minutes * 60)) * 100;
  ring.style.background = `conic-gradient(var(--primary) ${360 - (percent / 100) * 360}deg, rgba(148, 163, 184, 0.2) 0deg)`;
}

function startStudySound() {
  if (!state.settings.sound || state.audio.playing) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!state.audio.context) {
    state.audio.context = new AudioContextClass();
  }
  const ctx = state.audio.context;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(220, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(320, ctx.currentTime + 1.4);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.1);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  state.audio.oscillator = oscillator;
  state.audio.gain = gain;
  state.audio.playing = true;
}

function stopStudySound() {
  if (!state.audio.playing) return;
  const gain = state.audio.gain;
  const oscillator = state.audio.oscillator;
  const ctx = state.audio.context;
  if (gain && ctx) {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  }
  if (oscillator) {
    setTimeout(() => {
      try { oscillator.stop(); } catch (error) {}
    }, 220);
  }
  state.audio.playing = false;
}

function triggerCelebration() {
  const layer = document.getElementById('confettiLayer');
  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = ['#4F46E5', '#06B6D4', '#F59E0B', '#22C55E'][Math.floor(Math.random() * 4)];
    piece.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 2500);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 1800);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  init();
});

// --- 1. SHTIMI I DETYRAVE ME PRIORITET, TAGS DHE DATA ---
function addTask() {
    const input = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-input');
    const tagSelect = document.getElementById('tag-input');
    const dateInput = document.getElementById('date-input'); 
    
    if (!input || !prioritySelect || !tagSelect || !dateInput) return;

    const taskText = input.value.trim();
    const priority = prioritySelect.value;
    const tag = tagSelect.value;
    const dueDate = dateInput.value;

    if (taskText === '') return;

    createTaskElement(taskText, 'todo-list', priority, tag, dueDate);
    
    input.value = '';
    dateInput.value = '';
    saveData();
}

function createTaskElement(text, listId, priority = 'warning', tag = '💻 Puna', dueDate = '') {
    const list = document.getElementById(listId);
    if (!list) return;

    const taskCard = document.createElement('div');
    taskCard.className = `task-card shadow-sm border-start border-4 border-${priority} animate__animated animate__fadeInUp`;
    taskCard.draggable = true;
    taskCard.id = 'task-' + Date.now();
    taskCard.dataset.priority = priority;
    taskCard.dataset.tag = tag;
    taskCard.dataset.date = dueDate;

    const dateDisplay = dueDate ? `<small class="task-date-display">📅 Afati: ${dueDate}</small>` : '';

    taskCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="w-100">
                <span class="badge bg-light text-dark border mb-2" style="font-size: 0.7rem;">${tag}</span>
                <p class="mb-0 text-break" style="max-width: 100%; font-size: 0.95rem;">${text}</p>
                ${dateDisplay}
            </div>
            <button class="btn btn-sm text-danger p-0 ms-2 no-export" onclick="deleteTask(this)">×</button>
        </div>
    `;

    addDragEvents(taskCard);
    list.appendChild(taskCard);
    updateCounters();
    checkDeadlines();
}

function deleteTask(btn) {
    const card = btn.closest('.task-card');
    card.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
    card.addEventListener('animationend', () => {
        card.remove();
        saveData();
    });
}

// --- 2. DRAG & DROP LOGJIKA ME CONFETTI ---
function addDragEvents(card) {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
        setTimeout(() => card.classList.add('opacity-50'), 0);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
    });
}

const columns = ['todo-list', 'progress-list', 'done-list'];
columns.forEach(id => {
    const column = document.getElementById(id);
    if (!column) return;

    column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('bg-light-subtle');
    });

    column.addEventListener('dragleave', () => {
        column.classList.remove('bg-light-subtle');
    });

    column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('bg-light-subtle');
        const taskId = e.dataTransfer.getData('text/plain');
        const taskCard = document.getElementById(taskId);
        
        if (taskCard) {
            column.appendChild(taskCard);
            if (id === 'done-list') {
                triggerConfetti();
                taskCard.classList.remove('border-danger');
            }
            saveData();
        }
    });
});

function triggerConfetti() {
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffc107', '#28a745', '#17a2b8', '#ffffff']
    });
}

// --- 3. PERSISTENCE (RUJTJA DHE NGARKIMI) ---
function saveData() {
    const tasks = [];
    columns.forEach(colId => {
        const columnElement = document.getElementById(colId);
        if (columnElement) {
            const colTasks = columnElement.querySelectorAll('.task-card');
            colTasks.forEach(card => {
                tasks.push({ 
                    text: card.querySelector('p').innerText, 
                    column: colId, 
                    priority: card.dataset.priority,
                    tag: card.dataset.tag,
                    date: card.dataset.date 
                });
            });
        }
    });
    localStorage.setItem('skillSyncTasks', JSON.stringify(tasks));
    updateCounters();
}

function loadData() {
    const savedTasks = localStorage.getItem('skillSyncTasks');
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        tasks.forEach(t => createTaskElement(t.text, t.column, t.priority, t.tag, t.date));
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const darkBtn = document.getElementById('dark-mode-toggle');
        if (darkBtn) darkBtn.textContent = '☀️';
    }
    updateCounters();
    checkDeadlines();
}

// --- 4. COUNTERS, PROGRESS BAR DHE STATISTIKAT ---
function updateCounters() {
    let totalTasks = 0;
    let doneTasks = 0;
    let pendingTasks = 0;

    columns.forEach(id => {
        const shortName = id.split('-')[0];
        const countElement = document.getElementById(`count-${shortName}`);
        const listElement = document.getElementById(id);
        
        if (countElement && listElement) {
            const currentCount = listElement.children.length;
            countElement.innerText = currentCount;
            
            totalTasks += currentCount;
            if (id === 'done-list') {
                doneTasks = currentCount;
            } else {
                pendingTasks += currentCount;
            }
        }
    });

    // Përditësimi i Progress Bar
    updateProgressBar(totalTasks, doneTasks);

    // Përditësimi i Seksionit të Statistikave (Dashboard)
    const statEff = document.getElementById('stat-efficiency');
    const statDone = document.getElementById('stat-done');
    const statPending = document.getElementById('stat-pending');

    if (statDone) statDone.innerText = doneTasks;
    if (statPending) statPending.innerText = pendingTasks;
    if (statEff) {
        const efficiency = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        statEff.innerText = efficiency + "%";
    }
}

function updateProgressBar(total, done) {
    const progressBar = document.getElementById('project-progress');
    if (!progressBar) return;
    
    if (total === 0) {
        progressBar.style.width = "0%";
        progressBar.innerText = "0%";
        return;
    }
    
    const percentage = Math.round((done / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.innerText = `${percentage}%`;
}

// --- 5. FILTRIMI (SEARCH) ---
function filterTasks() {
    const query = document.getElementById('search-tasks').value.toLowerCase();
    const allTasks = document.querySelectorAll('.task-card');

    allTasks.forEach(task => {
        const text = task.querySelector('p').innerText.toLowerCase();
        const tag = task.dataset.tag.toLowerCase();
        if (text.includes(query) || tag.includes(query)) {
            task.style.display = "block";
        } else {
            task.style.display = "none";
        }
    });
}

// --- 6. FUNKSIONET E TJERA (PASTRIMI, DARK MODE, TIMER) ---
function clearAllTasks() {
    if (confirm("A jeni i sigurt? Kjo do të fshijë çdo detyrë përgjithmonë.")) {
        columns.forEach(id => {
            const col = document.getElementById(id);
            if (col) col.innerHTML = '';
        });
        localStorage.removeItem('skillSyncTasks');
        updateCounters();
    }
}

const darkBtn = document.getElementById('dark-mode-toggle');
if (darkBtn) {
    darkBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        darkBtn.textContent = isDark ? '☀️' : '🌙';
    });
}

let timeLeft = 25 * 60;
let timerId = null;
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const alarm = document.getElementById('alarm-sound');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
            startBtn.textContent = 'Vazhdo';
            startBtn.classList.replace('btn-warning', 'btn-outline-warning');
        } else {
            startBtn.textContent = 'Pauzo';
            startBtn.classList.replace('btn-outline-warning', 'btn-warning');
            timerId = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    timerId = null;
                    if (alarm) alarm.play();
                    alert("Koha mbaroi! Merr një pushim.");
                    timeLeft = 25 * 60;
                    updateTimerDisplay();
                    startBtn.textContent = 'Start Focus';
                }
            }, 1000);
        }
    });
}

function updateTimerDisplay() {
    if (timerDisplay) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// --- 7. VOICE RECOGNITION ---
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Browser-i juaj nuk mbështet kërkimin me zë.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'sq-AL'; 
    recognition.onstart = () => {
        const input = document.getElementById('task-input');
        input.placeholder = "Duke dëgjuar...";
        input.classList.add('border-warning');
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('task-input').value = transcript;
        document.getElementById('task-input').placeholder = "Shkruaj detyrën këtu...";
        document.getElementById('task-input').classList.remove('border-warning');
    };
    recognition.start();
}

// --- 8. SHKARKO RAPORTIN SI FOTO ---
function downloadAsImage() {
    const elementsToHide = document.querySelectorAll('.no-export');
    const board = document.getElementById('capture-area');
    
    elementsToHide.forEach(el => el.style.display = 'none');

    html2canvas(board, {
        backgroundColor: document.body.classList.contains('dark-theme') ? '#0b0e14' : '#f8f9fa',
        scale: 2, 
        logging: false,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `SkillSync-Raporti-${date}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        elementsToHide.forEach(el => el.style.display = '');
    });
}

// --- 9. DEADLINE CHECKER ---
function checkDeadlines() {
    const allTasks = document.querySelectorAll('.task-card');
    const today = new Date().toISOString().split('T')[0];

    allTasks.forEach(card => {
        const taskDate = card.dataset.date;
        const flexContainer = card.querySelector('.d-flex div');

        if (taskDate && taskDate < today && card.parentElement.id !== 'done-list') {
            card.classList.add('border-danger');
            if (!card.querySelector('.overdue-label')) {
                const label = document.createElement('span');
                label.className = 'badge bg-danger ms-2 overdue-label';
                label.innerText = 'VONUAR';
                if (flexContainer) flexContainer.appendChild(label);
            }
        } else if (taskDate >= today || card.parentElement.id === 'done-list') {
            card.classList.remove('border-danger');
            const label = card.querySelector('.overdue-label');
            if (label) label.remove();
        }
    });
}

setInterval(checkDeadlines, 30000);

window.onload = loadData;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('skill/sw.js')
      .then(reg => console.log('SkillSync App është gati!'))
      .catch(err => console.log('Gabim në regjistrim:', err));
  });
}

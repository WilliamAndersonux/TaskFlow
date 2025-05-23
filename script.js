class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const searchInput = document.getElementById('searchInput');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        taskInput.focus();
                        break;
                    case 'f':
                        e.preventDefault();
                        searchInput.focus();
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportTasks();
                        break;
                }
            }
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const taskText = input.value.trim();
        const priority = prioritySelect.value;

        if (taskText === '') {
            alert('Please enter a task');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            priority: priority,
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        input.value = '';
        prioritySelect.value = 'medium';
    }

    saveTasks() {
        localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        const todoList = document.getElementById('todoList');
        const inProgressList = document.getElementById('inProgressList');
        const doneList = document.getElementById('doneList');

        todoList.innerHTML = '';
        inProgressList.innerHTML = '';
        doneList.innerHTML = '';

        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        });

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            if (task.status === 'todo') {
                todoList.appendChild(taskElement);
            } else if (task.status === 'inprogress') {
                inProgressList.appendChild(taskElement);
            } else if (task.status === 'done') {
                doneList.appendChild(taskElement);
            }
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        const priorityBadge = task.priority ? `<span class="priority-badge priority-${task.priority}">${task.priority}</span>` : '';
        const createdTime = this.formatTime(task.createdAt);
        
        taskDiv.innerHTML = `
            <div class="task-content">
                <div class="task-main">
                    <span class="task-text">${priorityBadge}${task.text}</span>
                    <span class="task-timestamp">Created: ${createdTime}</span>
                </div>
                <div class="task-actions">
                    ${task.status === 'todo' ? '<button onclick="app.moveTask(' + task.id + ', \'inprogress\')">Start</button>' : ''}
                    ${task.status === 'inprogress' ? '<button onclick="app.moveTask(' + task.id + ', \'done\')">Complete</button>' : ''}
                    ${task.status === 'inprogress' ? '<button onclick="app.moveTask(' + task.id + ', \'todo\')">Back</button>' : ''}
                    <button onclick="app.deleteTask(' + task.id + ')" class="delete-btn">Delete</button>
                </div>
            </div>
        `;
        return taskDiv;
    }

    formatTime(isoString) {
        if (!isoString) return 'Unknown';
        const date = new Date(isoString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 24 * 7) {
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    moveTask(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    filterTasks(priority) {
        this.currentFilter = priority;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        this.renderTasks();
    }

    getFilteredTasks() {
        let filteredTasks = this.tasks;
        
        if (this.currentFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === this.currentFilter);
        }
        
        if (this.searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }
        
        return filteredTasks;
    }

    exportTasks() {
        const data = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importTasks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedTasks = JSON.parse(e.target.result);
                        if (confirm('This will replace all current tasks. Continue?')) {
                            this.tasks = importedTasks;
                            this.saveTasks();
                            this.renderTasks();
                        }
                    } catch (error) {
                        alert('Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
}

const app = new TaskFlow();
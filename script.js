class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
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

        const sortedTasks = this.tasks.sort((a, b) => {
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
        
        taskDiv.innerHTML = `
            <div class="task-content">
                <span class="task-text">${priorityBadge}${task.text}</span>
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
}

const app = new TaskFlow();
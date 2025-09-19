class TodoApp {
    constructor() {
        this.todos = this.loadFromStorage();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        const todoInput = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const clearBtn = document.getElementById('clearCompleted');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        clearBtn.addEventListener('click', () => this.clearCompleted());

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
                this.updateFilterButtons(btn);
            });
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (text === '') {
            this.shakeInput(input);
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        input.value = '';
        this.saveToStorage();
        this.render();
        this.updateStats();

        input.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('removing');
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveToStorage();
                this.render();
                this.updateStats();
            }, 300);
        }
    }

    clearCompleted() {
        const completedTodos = document.querySelectorAll('.todo-item.completed');

        if (completedTodos.length === 0) return;

        completedTodos.forEach((todo, index) => {
            setTimeout(() => {
                todo.classList.add('removing');
            }, index * 100);
        });

        setTimeout(() => {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
            this.updateStats();
        }, completedTodos.length * 100 + 300);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    updateFilterButtons(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>${this.getEmptyMessage()}</p>
                </div>
            `;
            return;
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}"
                     onclick="app.toggleTodo(${todo.id})"></div>
                <span class="todo-text" onclick="app.toggleTodo(${todo.id})">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            todoList.appendChild(li);
        });

        this.updateClearButton();
    }

    getEmptyMessage() {
        switch (this.currentFilter) {
            case 'pending':
                return '没有待完成的任务';
            case 'completed':
                return '没有已完成的任务';
            default:
                return '暂无任务，添加一个新任务开始吧！';
        }
    }

    updateStats() {
        const totalTasks = document.getElementById('totalTasks');
        const completedTasks = document.getElementById('completedTasks');

        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;

        totalTasks.textContent = total;
        completedTasks.textContent = completed;
    }

    updateClearButton() {
        const clearBtn = document.getElementById('clearCompleted');
        const hasCompleted = this.todos.some(t => t.completed);

        clearBtn.disabled = !hasCompleted;
        clearBtn.style.opacity = hasCompleted ? '1' : '0.5';
    }

    shakeInput(input) {
        input.style.animation = 'none';
        input.offsetHeight;
        input.style.animation = 'shake 0.5s ease-in-out';

        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        try {
            localStorage.setItem('todoApp', JSON.stringify(this.todos));
        } catch (error) {
            console.error('无法保存到本地存储:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('todoApp');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('无法从本地存储加载:', error);
            return [];
        }
    }
}

const app = new TodoApp();

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('todoInput').focus();
});

window.addEventListener('beforeunload', () => {
    app.saveToStorage();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('todoInput').blur();
    }
});

let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            document.getElementById('todoInput').focus();
        }
    }
}
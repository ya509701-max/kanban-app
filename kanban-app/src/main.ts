
import TaskManager from "./task-manager";
import type { Task, TaskStatus, TaskPriority } from "./types";
import "./style.css";

const manager = new TaskManager();

const addTaskButton = document.querySelector<HTMLButtonElement>("#addTaskButton")!;
const taskModal = document.querySelector<HTMLDivElement>("#taskModal")!;
const taskForm = document.querySelector<HTMLFormElement>("#taskForm")!;
const taskIdInput = document.querySelector<HTMLInputElement>("#taskId")!;
const taskTitleInput = document.querySelector<HTMLInputElement>("#taskTitle")!;
const taskPriorityInput = document.querySelector<HTMLSelectElement>("#taskPriority")!;
const taskDueDateInput = document.querySelector<HTMLInputElement>("#taskDueDate")!;
const taskDescriptionInput = document.querySelector<HTMLTextAreaElement>("#taskDescription")!;
const titleError = document.querySelector<HTMLElement>("#titleError")!;
const modalTitle = document.querySelector<HTMLElement>("#modalTitle")!;
const saveTaskButton = document.querySelector<HTMLButtonElement>("#saveTaskButton")!;
const closeModalButton = document.querySelector<HTMLButtonElement>("#closeModalButton")!;
const cancelButton = document.querySelector<HTMLButtonElement>("#cancelButton")!;
const descriptionCount = document.querySelector<HTMLElement>("#descriptionCount")!;
const toast = document.querySelector<HTMLElement>("#toast")!;

const columns: Record<TaskStatus, HTMLElement> = {
    todo: document.querySelector<HTMLElement>("#todoList")!,
    inProgress: document.querySelector<HTMLElement>("#progressList")!,
    completed: document.querySelector<HTMLElement>("#completedList")!
};

const counters: Record<TaskStatus, HTMLElement> = {
    todo: document.querySelector<HTMLElement>("#todoCount")!,
    inProgress: document.querySelector<HTMLElement>("#progressCount")!,
    completed: document.querySelector<HTMLElement>("#completedCount")!
};

function escapeHTML(value: string): string {
    return value.replace(/[&<>"']/g, character => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function showToast(message: string): void {
    toast.textContent = message;
    toast.classList.add("show");

    window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function formatDate(date: string): string {
    if (!date) return "No due date";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

function renderTask(task: Task): string {
    let actions = "";

    if (task.status === "todo") {
        actions = `
            <button class="task-action start-action" data-action="start" data-id="${task.id}">▶ Start</button>
            <button class="task-action complete-action" data-action="complete" data-id="${task.id}">✓ Complete</button>
        `;
    } else if (task.status === "inProgress") {
        actions = `
            <button class="task-action back-action" data-action="todo" data-id="${task.id}">↶ To Do</button>
            <button class="task-action complete-action" data-action="complete" data-id="${task.id}">✓ Complete</button>
        `;
    } else {
        actions = `
            <button class="task-action back-action" data-action="todo" data-id="${task.id}">↶ To Do</button>
            <button class="task-action start-action" data-action="start" data-id="${task.id}">▶ Start</button>
        `;
    }

    return `
        <article class="task-card ${task.status === "completed" ? "is-completed" : ""}">
            <div class="task-topline">
                <span class="task-number">
                    <i class="status-dot ${task.status}"></i>
                    #${escapeHTML(task.id.slice(-3))}
                </span>

                <div class="task-tools">
                    <button class="icon-button" data-action="edit" data-id="${task.id}" title="Edit">✎</button>
                    <button class="icon-button delete-icon" data-action="delete" data-id="${task.id}" title="Delete">▤</button>
                </div>
            </div>

            <h3 class="task-title">${escapeHTML(task.title)}</h3>

            ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}

            <div class="task-badges">
                <span class="priority-badge ${task.priority}">
                    <i></i>${task.priority.toUpperCase()} PRIORITY
                </span>

                ${task.status === "completed" ? '<span class="done-badge">✓ DONE</span>' : ""}
            </div>

            <div class="task-meta">
                <span>▢ &nbsp;${formatDate(task.dueDate)}</span>
            </div>

            <div class="task-actions">
                ${actions}
            </div>
        </article>
    `;
}

function renderBoard(): void {
    const tasks = manager.getTasks();

    const statuses: TaskStatus[] = ["todo", "inProgress", "completed"];

    statuses.forEach(status => {
        const filteredTasks = tasks.filter(task => task.status === status);

        counters[status].textContent =
            `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;

        if (filteredTasks.length === 0) {
            columns[status].innerHTML = `
                <div class="empty-state">
                    <div class="empty-folder">▱</div>
                    <p>No tasks yet</p>
                    <span>Click + to add one</span>
                </div>
            `;
        } else {
            columns[status].innerHTML = filteredTasks.map(renderTask).join("");
        }
    });
}

function openModal(task?: Task): void {
    taskForm.reset();

    taskIdInput.value = task?.id ?? "";
    taskTitleInput.value = task?.title ?? "";
    taskPriorityInput.value = task?.priority ?? "medium";
    taskDueDateInput.value = task?.dueDate ?? "";
    taskDescriptionInput.value = task?.description ?? "";

    descriptionCount.textContent = String(taskDescriptionInput.value.length);
    titleError.textContent = "";
    taskTitleInput.classList.remove("invalid");

    const editing = Boolean(task);

    modalTitle.textContent = editing ? "Edit Task" : "Create New Task";
    saveTaskButton.textContent = editing ? "✓ Save Changes" : "＋ Add Task";

    taskModal.classList.remove("hidden");
    taskTitleInput.focus();
}

function closeModal(): void {
    taskModal.classList.add("hidden");
    taskForm.reset();
    titleError.textContent = "";
    taskTitleInput.classList.remove("invalid");
}

function validateTitle(): boolean {
    if (taskTitleInput.value.trim().length < 3) {
        titleError.textContent = "Task title must be at least 3 characters.";
        taskTitleInput.classList.add("invalid");
        taskTitleInput.focus();

        return false;
    }

    titleError.textContent = "";
    taskTitleInput.classList.remove("invalid");

    return true;
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateTitle()) return;

    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPriorityInput.value as TaskPriority;
    const dueDate = taskDueDateInput.value;

    if (id) {
        const updated = manager.updateTask(id, title, description, priority, dueDate);

        if (updated) {
            showToast("Task updated successfully");
        }
    } else {
        const added = manager.addTask(title, description, priority, dueDate);

        if (added) {
            showToast("Task added successfully");
        }
    }

    renderBoard();
    closeModal();
});

document.querySelector(".board")!.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (!id || !action) return;

    const task = manager.getTasks().find(item => item.id === id);

    if (!task) return;

    if (action === "edit") {
        openModal(task);
    } else if (action === "delete") {
        if (confirm(`Delete "${task.title}"?`)) {
            manager.deleteTask(id);
            renderBoard();
            showToast("Task deleted");
        }
    } else if (action === "start") {
        manager.changeStatus(id, "inProgress");
        renderBoard();
        showToast("Task moved to In Progress");
    } else if (action === "complete") {
        manager.changeStatus(id, "completed");
        renderBoard();
        showToast("Task completed");
    } else if (action === "todo") {
        manager.changeStatus(id, "todo");
        renderBoard();
        showToast("Task moved to To Do");
    }
});

addTaskButton.addEventListener("click", () => openModal());

closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) closeModal();
});

taskDescriptionInput.addEventListener("input", () => {
    descriptionCount.textContent = String(taskDescriptionInput.value.length);
});

taskTitleInput.addEventListener("input", () => {
    if (taskTitleInput.value.trim().length >= 3) {
        titleError.textContent = "";
        taskTitleInput.classList.remove("invalid");
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

renderBoard();

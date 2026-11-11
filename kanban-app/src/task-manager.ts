
import type { Task, TaskStatus, TaskPriority } from "./types";

export default class TaskManager {
    private tasks: Task[] = [];
    private storageKey = "kanbanTasks";

    constructor() {
        this.loadTasks();
    }

    private loadTasks(): void {
        const savedTasks = localStorage.getItem(this.storageKey);

        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks) as Task[];
            } catch {
                this.tasks = [];
            }
        }
    }

    private saveTasks(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    getTasks(): Task[] {
        return [...this.tasks];
    }

    addTask(
        title: string,
        description: string,
        priority: TaskPriority,
        dueDate: string
    ): boolean {
        const cleanTitle = title.trim();

        if (cleanTitle.length < 3) {
            return false;
        }

        const now = Date.now();

        const task: Task = {
            id: crypto.randomUUID(),
            title: cleanTitle,
            description: description.trim(),
            priority,
            dueDate,
            status: "todo",
            createdAt: now,
            updatedAt: now
        };

        this.tasks.push(task);
        this.saveTasks();

        return true;
    }

    updateTask(
        id: string,
        title: string,
        description: string,
        priority: TaskPriority,
        dueDate: string
    ): boolean {
        const task = this.tasks.find(item => item.id === id);

        if (!task || title.trim().length < 3) {
            return false;
        }

        task.title = title.trim();
        task.description = description.trim();
        task.priority = priority;
        task.dueDate = dueDate;
        task.updatedAt = Date.now();

        this.saveTasks();

        return true;
    }

    deleteTask(id: string): void {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    changeStatus(id: string, status: TaskStatus): void {
        const task = this.tasks.find(item => item.id === id);

        if (!task) {
            return;
        }

        task.status = status;
        task.updatedAt = Date.now();

        this.saveTasks();
    }
}

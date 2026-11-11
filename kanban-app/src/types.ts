
export type TaskStatus = "todo" | "inProgress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
    createdAt: number;
    updatedAt: number;
}

import { toast } from "@/hooks/use-toast";

const API_BASE_URL = "http://localhost:8000";

export interface Task {
    id: string;
    title: string;
    completed: boolean;
    time?: string;
    day?: string;
}

export interface ScheduleItem {
    id: string;
    time: string;
    title: string;
    duration: string;
    category: "work" | "personal" | "health" | "learning";
    completed?: boolean;
    day?: string;
}

export interface Subject {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro na requisição");
    }
    return response.json();
}

// --- TASKS ---
export async function fetchTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    return handleResponse(response);
}

export async function createTask(task: Task): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
    });
    return handleResponse(response);
}

export async function updateTask(id: string, task: Task): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
    });
    return handleResponse(response);
}

export async function deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "DELETE",
    });
    await handleResponse(response);
}

// --- SCHEDULE ---
export async function fetchSchedule(): Promise<ScheduleItem[]> {
    const response = await fetch(`${API_BASE_URL}/schedule`);
    return handleResponse(response);
}

export async function createScheduleItem(item: ScheduleItem): Promise<ScheduleItem> {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
    });
    return handleResponse(response);
}

export async function updateScheduleItem(id: string, item: ScheduleItem): Promise<ScheduleItem> {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
    });
    return handleResponse(response);
}

export async function deleteScheduleItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
        method: "DELETE",
    });
    await handleResponse(response);
}

// --- SUBJECT NOTES ---
export async function fetchNotes(date: string): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/notes/${date}`);
    return handleResponse(response);
}

export async function saveNotes(date: string, subjects: Subject[]): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/notes/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subjects), // Enviamos apenas a lista, o backend espera lista no corpo mas endpoint no backend espera { date, subjects }? Não.
        // Backend espera: async def save_notes(date: str, subjects: List[Subject]):
        // FastAPI vai ler subjects do body se for List[Subject].
    });
    return handleResponse(response);
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskItem } from "@/components/TaskItem";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import SubjectNotes from "@/components/SubjectNotes";
import { StatsCard } from "@/components/StatsCard";
import { DaySelector } from "@/components/DaySelector";
import { MonthlyOverview } from "@/components/MonthlyOverview";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Plus,
  Target,
  TrendingUp,
  Sparkles,
  FileText
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  time?: string;
  day?: string; // YYYY-MM-DD
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: string;
  category: "work" | "personal" | "health" | "learning";
  completed?: boolean;
  day?: string; // YYYY-MM-DD
}

const todayISO = new Date().toISOString().slice(0, 10);

const initialTasks: Task[] = [
  { id: "1", title: "Revisar emails importantes", completed: false, time: "09:00", day: todayISO },
  { id: "2", title: "Reunião de planejamento", completed: true, time: "10:00", day: todayISO },
  { id: "3", title: "Exercícios de alongamento", completed: false, time: "12:00", day: todayISO },
  { id: "4", title: "Estudar novo framework", completed: false, time: "14:00", day: todayISO },
];

const initialSchedule: ScheduleItem[] = [
  { id: "1", time: "08:00", title: "Rotina matinal", duration: "45min", category: "personal", completed: false, day: todayISO },
  { id: "2", time: "09:00", title: "Bloco de foco - Trabalho", duration: "2h", category: "work", completed: false, day: todayISO },
  { id: "3", time: "12:00", title: "Almoço + Descanso", duration: "1h", category: "personal", completed: false, day: todayISO },
  { id: "4", time: "14:00", title: "Aprendizado", duration: "1h", category: "learning", completed: false, day: todayISO },
  { id: "5", time: "17:00", title: "Exercícios físicos", duration: "1h", category: "health", completed: false, day: todayISO },
];

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem("rotin.tasks");
      return raw ? JSON.parse(raw) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const raw = localStorage.getItem("rotin.schedule");
      return raw ? JSON.parse(raw) : initialSchedule;
    } catch {
      return initialSchedule;
    }
  });

  const [newTask, setNewTask] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>(todayISO);

  // Dialog states for creating items
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  // Task dialog fields
  const [taskDialogTitle, setTaskDialogTitle] = useState("");
  const [taskDialogTime, setTaskDialogTime] = useState("");

  // Schedule dialog fields
  const [scheduleDialogTitle, setScheduleDialogTitle] = useState("");
  const [scheduleDialogTime, setScheduleDialogTime] = useState("");
  const [scheduleDialogDuration, setScheduleDialogDuration] = useState("");
  const [scheduleDialogCategory, setScheduleDialogCategory] = useState<ScheduleItem["category"]>("work");

  const { toast } = useToast();

  const resetTaskDialog = () => {
    setTaskDialogTitle("");
    setTaskDialogTime("");
  };

  const resetScheduleDialog = () => {
    setScheduleDialogTitle("");
    setScheduleDialogTime("");
    setScheduleDialogDuration("");
    setScheduleDialogCategory("work");
  };

  const handleCreateTaskFromDialog = () => {
    if (!taskDialogTitle.trim()) {
      toast({ title: "Erro", description: "Informe o assunto da tarefa", variant: "destructive" });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: taskDialogTitle.trim(),
      completed: false,
      time: taskDialogTime || undefined,
      day: selectedDay,
    };

    setTasks((prev) => [...prev, task]);
    setIsTaskDialogOpen(false);
    resetTaskDialog();
    toast({ title: "Tarefa criada", description: "Tarefa adicionada com sucesso" });
  };

  const handleCreateScheduleFromDialog = () => {
    if (!scheduleDialogTitle.trim()) {
      toast({ title: "Erro", description: "Informe o assunto do bloco", variant: "destructive" });
      return;
    }

    const item: ScheduleItem = {
      id: Date.now().toString(),
      time: scheduleDialogTime || "",
      title: scheduleDialogTitle.trim(),
      duration: scheduleDialogDuration || "30min",
      category: scheduleDialogCategory,
      completed: false,
      day: selectedDay,
    };

    setSchedule((prev) => [...prev, item]);
    setIsScheduleDialogOpen(false);
    resetScheduleDialog();
    toast({ title: "Bloco criado", description: "Cronograma atualizado" });
  };

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("rotin.tasks", JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks:", e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("rotin.schedule", JSON.stringify(schedule));
    } catch (e) {
      console.error("Failed to save schedule:", e);
    }
  }, [schedule]);

  // Filter by selected date
  const filteredSchedule = schedule.filter((s) => s.day === selectedDay || !s.day);
  const filteredTasks = tasks.filter((t) => t.day === selectedDay || !t.day);

  const completedTasks = filteredTasks.filter((t) => t.completed).length;
  const completedSchedule = filteredSchedule.filter((s) => s.completed).length;

  const totalItems = filteredTasks.length + filteredSchedule.length;
  const completedCount = completedTasks + completedSchedule;
  const completionRate = totalItems ? Math.round((completedCount / totalItems) * 100) : 0;

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleOpenEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setEditingTaskId(id);
    setTaskDialogTitle(task.title);
    setTaskDialogTime(task.time || "");
    setIsTaskDialogOpen(true);
  };

  const handleSaveEditedTask = () => {
    if (!editingTaskId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTaskId ? { ...t, title: taskDialogTitle.trim() || t.title, time: taskDialogTime || t.time } : t))
    );
    setIsTaskDialogOpen(false);
    resetTaskDialog();
    setEditingTaskId(null);
    toast({ title: "Tarefa atualizada" });
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask,
        completed: false,
        day: selectedDay,
      };
      setTasks((prev) => [...prev, task]);
      setNewTask("");
    }
  };

  const handleOpenEditSchedule = (id?: string) => {
    if (!id) return;
    const item = schedule.find((s) => s.id === id);
    if (!item) return;
    setEditingScheduleId(id);
    setScheduleDialogTitle(item.title);
    setScheduleDialogTime(item.time);
    setScheduleDialogDuration(item.duration);
    setScheduleDialogCategory(item.category);
    setIsScheduleDialogOpen(true);
  };

  const handleSaveEditedSchedule = () => {
    if (!editingScheduleId) return;
    setSchedule((prev) =>
      prev.map((s) =>
        s.id === editingScheduleId
          ? { ...s, title: scheduleDialogTitle.trim() || s.title, time: scheduleDialogTime || s.time, duration: scheduleDialogDuration || s.duration, category: scheduleDialogCategory }
          : s
      )
    );
    setIsScheduleDialogOpen(false);
    resetScheduleDialog();
    setEditingScheduleId(null);
    toast({ title: "Bloco atualizado" });
  };

  const handleDeleteSchedule = (id?: string) => {
    if (!id) return;
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSchedule = (id?: string) => {
    if (!id) return;
    setSchedule((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };



  const today = new Date(selectedDay).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="gradient-primary bg-clip-text text-transparent">Rotin</span>
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{today}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Tarefas Hoje"
            value={totalItems}
            subtitle={`${completedCount} concluídas`}
            icon={CheckCircle2}
            trend="up"
          />
          <StatsCard
            title="Taxa de Conclusão"
            value={`${completionRate}%`}
            subtitle="Ótimo progresso!"
            icon={Target}
            trend={completionRate >= 50 ? "up" : "down"}
          />
          <StatsCard
            title="Próxima Tarefa"
            value="09:00"
            subtitle="Revisar emails"
            icon={Clock}
            trend="neutral"
          />
          <StatsCard
            title="Sequência"
            value="5 dias"
            subtitle="Continue assim!"
            icon={TrendingUp}
            trend="up"
          />
        </div>

        {/* Day Selector */}
        <DaySelector selectedDate={selectedDay} onSelectDay={setSelectedDay} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Schedule */}
          <Card className="lg:col-span-1 shadow-card">
            <CardHeader className="pb-3 flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <CalendarDays className="h-5 w-5 text-primary" />
                Cronograma
              </CardTitle>
              <Button size="icon" onClick={() => { setEditingScheduleId(null); setIsScheduleDialogOpen(true); }} className="gradient-primary shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {filteredSchedule.length > 0 ? (
                  filteredSchedule.map((item, index) => (
                    <div key={item.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <ScheduleBlock
                        id={item.id}
                        time={item.time}
                        title={item.title}
                        duration={item.duration}
                        category={item.category}
                        completed={item.completed}
                        onEdit={handleOpenEditSchedule}
                        onToggle={handleToggleSchedule}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item para este dia
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="lg:col-span-1 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Checklist Diária
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nova tarefa rápida (Enter)..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="bg-secondary/50"
                />
                <Button size="icon" onClick={() => { setEditingTaskId(null); setIsTaskDialogOpen(true); }} className="gradient-primary shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <div key={task.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                      <TaskItem
                        id={task.id}
                        title={task.title}
                        completed={task.completed}
                        time={task.time}
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleOpenEditTask}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa para este dia
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 shadow-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <FileText className="h-5 w-5 text-primary" />
                Gestor de Notas por Assunto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectNotes />
            </CardContent>
          </Card>
        </div>

        {/* Monthly Overview */}
        <MonthlyOverview tasks={tasks} schedule={schedule} />

        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTaskId ? "Editar tarefa" : "Adicionar tarefa"}</DialogTitle>
              <DialogDescription>Insira o assunto e o horário (opcional) para {today}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Input placeholder="Assunto" value={taskDialogTitle} onChange={(e) => setTaskDialogTitle(e.target.value)} />
              <Input type="time" placeholder="Horário" value={taskDialogTime} onChange={(e) => setTaskDialogTime(e.target.value)} />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsTaskDialogOpen(false); resetTaskDialog(); setEditingTaskId(null); }}>
                Cancelar
              </Button>
              <Button onClick={editingTaskId ? handleSaveEditedTask : handleCreateTaskFromDialog}>{editingTaskId ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingScheduleId ? "Editar bloco" : "Adicionar bloco no cronograma"}</DialogTitle>
              <DialogDescription>Assunto, horário e duração para {today}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Input placeholder="Assunto" value={scheduleDialogTitle} onChange={(e) => setScheduleDialogTitle(e.target.value)} />
              <Input type="time" placeholder="Horário" value={scheduleDialogTime} onChange={(e) => setScheduleDialogTime(e.target.value)} />
              <Input placeholder="Duração (ex: 30min)" value={scheduleDialogDuration} onChange={(e) => setScheduleDialogDuration(e.target.value)} />
              <select
                value={scheduleDialogCategory}
                onChange={(e) => setScheduleDialogCategory(e.target.value as ScheduleItem["category"])}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="work">Trabalho</option>
                <option value="personal">Pessoal</option>
                <option value="health">Saúde</option>
                <option value="learning">Aprendizado</option>
              </select>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsScheduleDialogOpen(false); resetScheduleDialog(); setEditingScheduleId(null); }}>
                Cancelar
              </Button>
              {editingScheduleId && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    // delete the schedule being edited
                    handleDeleteSchedule(editingScheduleId);
                    setIsScheduleDialogOpen(false);
                    resetScheduleDialog();
                    setEditingScheduleId(null);
                    toast({ title: "Bloco removido", description: "O bloco foi excluído com sucesso" });
                  }}
                >
                  Excluir
                </Button>
              )}
              <Button onClick={editingScheduleId ? handleSaveEditedSchedule : handleCreateScheduleFromDialog}>{editingScheduleId ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}

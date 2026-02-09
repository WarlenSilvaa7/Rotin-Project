import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, calculateCurrentStreak } from "@/lib/utils";
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
import useAuth from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  fetchTasks,
  createTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  fetchSchedule,
  createScheduleItem,
  updateScheduleItem as apiUpdateScheduleItem,
  deleteScheduleItem as apiDeleteScheduleItem,
  Task as ApiTask,
  ScheduleItem as ApiScheduleItem
} from "@/lib/api";

interface Task extends ApiTask { }
interface ScheduleItem extends ApiScheduleItem { }

const today = new Date();
const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { toast } = useToast();

  // Carregar dados do backend ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTasks, loadedSchedule] = await Promise.all([
          fetchTasks(),
          fetchSchedule()
        ]);
        setTasks(loadedTasks);
        setSchedule(loadedSchedule);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({ title: "Erro de conexão", description: "Não foi possível carregar os dados do servidor.", variant: "destructive" });
      }
    };
    loadData();
  }, [toast]);

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

  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { user, loading, signInWithGoogle, logout } = useAuth();

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

  const handleCreateTaskFromDialog = async () => {
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

    try {
      const createdTask = await createTask(task);
      setTasks((prev) => [...prev, createdTask]);
      setIsTaskDialogOpen(false);
      resetTaskDialog();
      toast({ title: "Tarefa criada", description: "Tarefa adicionada com sucesso" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar tarefa", variant: "destructive" });
    }
  };

  const handleCreateScheduleFromDialog = async () => {
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

    try {
      const createdItem = await createScheduleItem(item);
      setSchedule((prev) => [...prev, createdItem]);
      setIsScheduleDialogOpen(false);
      resetScheduleDialog();
      toast({ title: "Bloco criado", description: "Cronograma atualizado" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar bloco", variant: "destructive" });
    }
  };

  // Filter by selected date
  const filteredSchedule = schedule.filter((s) => s.day === selectedDay || !s.day);
  const filteredTasks = tasks.filter((t) => t.day === selectedDay || !t.day);

  const completedTasks = filteredTasks.filter((t) => t.completed).length;
  const completedSchedule = filteredSchedule.filter((s) => s.completed).length;

  const totalItems = filteredTasks.length + filteredSchedule.length;
  const completedCount = completedTasks + completedSchedule;
  const completionRate = totalItems ? Math.round((completedCount / totalItems) * 100) : 0;

  const nextTask = (() => {
    const taskItems = filteredTasks
      .filter((t) => t.time && !t.completed)
      .map((t) => ({ time: t.time!, title: t.title }));

    const scheduleItems = filteredSchedule
      .filter((s) => !s.completed)
      .map((s) => ({ time: s.time, title: s.title }));

    const allItems = [...taskItems, ...scheduleItems].sort((a, b) => a.time.localeCompare(b.time));

    if (selectedDay > todayISO) return allItems[0];
    if (selectedDay < todayISO) return null;

    return allItems.find((item) => item.time >= currentTime) || null;
  })();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = { ...task, completed: !task.completed };

    // Optimistic
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    try {
      await apiUpdateTask(id, updated);
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      toast({ title: "Erro", description: "Falha ao atualizar tarefa", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const oldTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));
    try {
      await apiDeleteTask(id);
    } catch (e) {
      setTasks(oldTasks);
      toast({ title: "Erro", description: "Falha ao excluir tarefa", variant: "destructive" });
    }
  };

  const handleOpenEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setEditingTaskId(id);
    setTaskDialogTitle(task.title);
    setTaskDialogTime(task.time || "");
    setIsTaskDialogOpen(true);
  };

  const handleSaveEditedTask = async () => {
    if (!editingTaskId) return;
    const task = tasks.find((t) => t.id === editingTaskId);
    if (!task) return;

    const updated = { ...task, title: taskDialogTitle.trim() || task.title, time: taskDialogTime || task.time };

    try {
      await apiUpdateTask(editingTaskId, updated);
      setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
      setIsTaskDialogOpen(false);
      resetTaskDialog();
      setEditingTaskId(null);
      toast({ title: "Tarefa atualizada" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao salvar edição", variant: "destructive" });
    }
  };

  const handleAddTask = async () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask,
        completed: false,
        day: selectedDay,
      };

      try {
        const created = await createTask(task);
        setTasks((prev) => [...prev, created]);
        setNewTask("");
      } catch (e) {
        toast({ title: "Erro", description: "Falha ao adicionar tarefa", variant: "destructive" });
      }
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

  const handleSaveEditedSchedule = async () => {
    if (!editingScheduleId) return;
    const item = schedule.find((s) => s.id === editingScheduleId);
    if (!item) return;

    const updated = {
      ...item,
      title: scheduleDialogTitle.trim() || item.title,
      time: scheduleDialogTime || item.time,
      duration: scheduleDialogDuration || item.duration,
      category: scheduleDialogCategory
    };

    try {
      await apiUpdateScheduleItem(editingScheduleId, updated);
      setSchedule((prev) => prev.map((s) => (s.id === editingScheduleId ? updated : s)));
      setIsScheduleDialogOpen(false);
      resetScheduleDialog();
      setEditingScheduleId(null);
      toast({ title: "Bloco atualizado" });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao atualizar bloco", variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (id?: string) => {
    if (!id) return;
    const oldSchedule = schedule;
    setSchedule((prev) => prev.filter((s) => s.id !== id));
    try {
      await apiDeleteScheduleItem(id);
    } catch (e) {
      setSchedule(oldSchedule);
      toast({ title: "Erro", description: "Falha ao excluir bloco", variant: "destructive" });
    }
  };

  const handleToggleSchedule = async (id?: string) => {
    if (!id) return;
    const item = schedule.find((s) => s.id === id);
    if (!item) return;

    const updated = { ...item, completed: !item.completed };

    // Optimistic
    setSchedule((prev) => prev.map((s) => (s.id === id ? updated : s)));

    try {
      await apiUpdateScheduleItem(id, updated);
    } catch (e) {
      setSchedule((prev) => prev.map((s) => (s.id === id ? item : s)));
      toast({ title: "Erro", description: "Falha ao atualizar bloco", variant: "destructive" });
    }
  };



  const [year, month, day] = selectedDay.split('-').map(Number);
  const today = new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const currentStreak = calculateCurrentStreak(tasks, schedule);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="text-primary">Rotin</span>
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{today}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-md hover:opacity-90 focus:outline-none">
                      <Avatar>
                        <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "Usuário"} />
                        <AvatarFallback>{user.displayName?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block ml-2 text-sm">{user.displayName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium">{user.displayName}</div>
                      {user.email && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
                    </div>
                    <DropdownMenuItem
                      onSelect={async (e) => {
                        e.preventDefault();
                        try {
                          await signOut(auth);
                          toast({ title: "Sessão encerrada" });
                        } catch (err: any) {
                          console.error("Erro ao sair", err);
                          toast({ title: "Erro ao sair", description: err?.message ?? "Falha ao encerrar sessão", variant: "destructive" });
                        }
                      }}
                    >
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      // Se o login for feito via popup, mostra um feedback
                      toast({ title: "Login efetuado", description: "Bem-vindo!" });
                    } catch (e: any) {
                      console.error("Login error", e);
                      toast({ title: "Erro ao entrar", description: e?.code ?? e?.message ?? "Falha no login", variant: "destructive" });
                    }
                  }}
                  className="gradient-primary"
                  disabled={loading}
                >
                  Entrar com Google
                </Button>
              )}
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
            value={nextTask ? nextTask.time : "--:--"}
            subtitle={nextTask ? nextTask.title : "Sem tarefas pendentes"}
            icon={Clock}
            trend="neutral"
          />
          <StatsCard
            title="Sequência"
            value={`${currentStreak} dias`}
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
                Bloco de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectNotes date={selectedDay} key={selectedDay} />
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

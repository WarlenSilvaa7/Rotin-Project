import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, CheckCircle2, Target } from "lucide-react";
import { cn, calculateCurrentStreak } from "@/lib/utils";

interface MonthlyStats {
  totalTasks: number;
  completedTasks: number;
  bestStreak: number;
  currentStreak: number;
  averageCompletion: number;
}

interface MonthlyOverviewProps {
  stats?: MonthlyStats;
  tasks?: Array<{ day?: string; completed?: boolean }>;
  schedule?: Array<{ day?: string; completed?: boolean }>;
}

export function MonthlyOverview({ stats, tasks = [], schedule = [] }: MonthlyOverviewProps) {
  const defaultStats: MonthlyStats = {
    totalTasks: 124,
    completedTasks: 98,
    bestStreak: 12,
    currentStreak: 0,
    averageCompletion: 79,
  };

  // If stats aren't provided, compute from `tasks` and `schedule` for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const date = new Date(year, month, dayNumber);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const isToday = dayNumber === today.getDate();

    const tasksForDay = tasks.filter((t) => t.day === iso);
    const scheduleForDay = schedule.filter((s) => s.day === iso);

    const total = tasksForDay.length + scheduleForDay.length;
    const completed = (tasksForDay.filter((t) => t.completed).length) + (scheduleForDay.filter((s) => s.completed).length);

    return { day: dayNumber, iso, isToday, total, completed };
  });

  // Aggregate totals and compute average completion
  const totalTasksCount = calendarDays.reduce((acc, d) => acc + d.total, 0);
  const completedTasksCount = calendarDays.reduce((acc, d) => acc + d.completed, 0);
  const averageCompletion = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

  // Compute best streak: longest run of days where all activities that day are completed
  let bestStreak = 0;
  let run = 0;
  for (let i = 0; i < calendarDays.length; i++) {
    const d = calendarDays[i];
    if (d.total > 0 && d.completed === d.total) {
      run++;
    } else {
      if (run > bestStreak) bestStreak = run;
      run = 0;
    }
  }
  if (run > bestStreak) bestStreak = run;

  const computedStats: MonthlyStats = {
    totalTasks: totalTasksCount,
    completedTasks: completedTasksCount,
    bestStreak,
    currentStreak: calculateCurrentStreak(tasks, schedule),
    averageCompletion,
  };

  const data = stats || computedStats || defaultStats;

  const monthName = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Calendar className="h-5 w-5 text-primary" />
          Resumo de {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-accent/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Concluídas</span>
            </div>
            <p className="text-xl font-bold font-display">
              {data.completedTasks}/{data.totalTasks}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Média</span>
            </div>
            <p className="text-xl font-bold font-display">{data.averageCompletion}%</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Melhor sequência</span>
            </div>
            <p className="text-xl font-bold font-display text-success">{data.bestStreak} dias</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Sequência atual</span>
            </div>
            <p className="text-xl font-bold font-display text-orange-500">{data.currentStreak} dias</p>
          </div>
        </div>

        {/* Mini Calendar */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Atividade diária</p>
          <div className="grid grid-cols-7 gap-1">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
            {/* Empty cells for alignment */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Calendar days */}
            {calendarDays.map(({ day, iso, isToday, total, completed }) => (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors",
                  isToday && "ring-2 ring-primary ring-offset-1",
                  total === 0 && "bg-transparent text-muted-foreground",
                  total > 0 && completed === total && "bg-success/60 text-success-foreground",
                  total > 0 && completed > 0 && completed < total && "bg-amber-400/60 text-amber-900",
                  total > 0 && completed === 0 && "bg-destructive/50 text-destructive-foreground"
                )}
                title={total > 0 ? `${completed}/${total} concluídos` : "Sem atividades"}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success/60" />
              <span>100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-400/60" />
              <span>Parcial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive/50" />
              <span>0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-transparent border border-muted" />
              <span>Sem atividades</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

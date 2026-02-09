import { cn } from "@/lib/utils";

interface DaySelectorProps {
  selectedDate: string; // format: YYYY-MM-DD
  onSelectDay: (date: string) => void;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DaySelector({ selectedDate, onSelectDay }: DaySelectorProps) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekStart = startOfWeek(today);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const shortNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const fullNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return {
      iso,
      short: shortNames[d.getDay()],
      full: fullNames[d.getDay()],
      dateNumber: d.getDate(),
      weekday: d.getDay(),
    };
  });

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {days.map((day) => (
        <button
          key={day.iso}
          onClick={() => onSelectDay(day.iso)}
          className={cn(
            "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
            "hover:bg-accent/50",
            selectedDate === day.iso
              ? "gradient-primary text-primary-foreground shadow-card"
              : "bg-secondary/50 text-muted-foreground",
            day.iso === todayISO && selectedDate !== day.iso && "ring-1 ring-primary/30"
          )}
        >
          <div className="text-xs leading-3">
            <span className="block sm:hidden">{day.short}</span>
            <span className="hidden sm:block">{day.full}</span>
          </div>
          <div className="text-sm font-medium">{day.dateNumber}</div>
        </button>
      ))}
    </div>
  );
}

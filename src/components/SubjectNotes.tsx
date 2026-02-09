import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2, Loader2, Check } from "lucide-react";
import { fetchNotes, saveNotes, Subject } from "@/lib/api";

function now() {
  return Date.now();
}
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

interface SubjectNotesProps {
  date: string;
}

const BASE_ACTIVE_KEY = "subject-notes.active";

// Minimalist Subject Notes manager. Uses API to sync data
export default function SubjectNotes({ date }: SubjectNotesProps) {
  const activeKey = `${BASE_ACTIVE_KEY}.${date}`;

  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Load from API on mount or date change
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchNotes(date);
        if (mounted) {
          if (data && data.length > 0) {
            setSubjects(data);
          } else {
            // Default subjects for new day if empty
            // Verify if we should create them on backend immediately or just local state?
            // Let's just set local state. User needs to interact to save?
            // Or better: load default if empty FROM BACKEND? 
            // The backend returns empty list if not found.
            // Let's emulate the previous behavior: default items.
            setSubjects([
              { id: generateId(), title: "🇧🇷 Língua Portuguesa", content: "", updatedAt: now() },
              { id: generateId(), title: "⚖️ Direito", content: "", updatedAt: now() },
            ]);
          }
        }
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [date]);

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(activeKey) || null;
    } catch {
      return null;
    }
  });

  const timerRef = useRef<number | null>(null);
  const subjectsRef = useRef<Subject[]>(subjects);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    subjectsRef.current = subjects;
  }, [subjects]);

  useEffect(() => {
    if (!activeId && subjects.length > 0) setActiveId(subjects[0].id);
  }, [subjects, activeId]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(activeKey, activeId);
    } catch { }
  }, [activeId, activeKey]);

  const active = subjects.find((s) => s.id === activeId) || subjects[0] || null;

  // Modal-based creation (choose emoji + title)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmoji, setNewEmoji] = useState("");
  const [newTitle, setNewTitle] = useState("");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const openCreate = () => {
    setNewEmoji("");
    setNewTitle("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    const title = (newEmoji ? `${newEmoji} ` : "") + newTitle.trim();
    if (!newTitle.trim()) return;
    const s: Subject = { id: generateId(), title, content: "", updatedAt: now() };
    const next = [s, ...subjects];
    setSubjects(next);
    setActiveId(s.id);
    setIsCreateOpen(false);

    // Save to API
    try {
      setIsSaving(true);
      await saveNotes(date, next);
      setLastSavedAt(now());
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setEditContent(s.content || "");
    setActiveId(id);
    setIsEditOpen(true);
  };

  const saveEditNow = async (id: string) => {
    const next = subjectsRef.current.map((s) => (s.id === id ? { ...s, content: editContent, updatedAt: now() } : s));
    setSubjects(next);
    try {
      setIsSaving(true);
      await saveNotes(date, next);
      setLastSavedAt(now());
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClose = () => {
    if (editingId) {
      // flush pending changes
      if (timerRef.current) window.clearTimeout(timerRef.current);
      saveEditNow(editingId);
    }
    setIsEditOpen(false);
    setEditingId(null);
    setEditContent("");
  };

  const renameSubject = async (id: string) => {
    const sub = subjects.find((x) => x.id === id);
    if (!sub) return;
    const title = prompt("Renomear assunto (inclua emoji se desejar)", sub.title)?.trim();
    if (!title) return;
    const next = subjects.map((x) => (x.id === id ? { ...x, title, updatedAt: now() } : x));
    setSubjects(next);

    try {
      setIsSaving(true);
      await saveNotes(date, next);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Remover assunto e todas as suas notas?")) return;
    const next = subjects.filter((s) => s.id !== id);
    setSubjects(next);
    if (activeId === id) setActiveId(next[0]?.id || null);

    try {
      setIsSaving(true);
      await saveNotes(date, next);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Save content for subject with debounce
  const updateContent = (id: string, content: string) => {
    const next = subjectsRef.current.map((s) => (s.id === id ? { ...s, content, updatedAt: now() } : s));
    setSubjects(next);
    setIsSaving(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await saveNotes(date, next);
        setLastSavedAt(now());
      } catch (e) {
        // noop
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  return (
    <div className="w-full rounded-md bg-card/50 p-3 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">Assuntos</div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {isSaving ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> <span>Salvando…</span></div>
            ) : lastSavedAt ? (
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> <span>Salvo</span></div>
            ) : (
              <span className="opacity-60">Nenhuma alteração</span>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={openCreate} aria-label="Criar assunto">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
        {subjects.map((s) => {
          const activeS = s.id === activeId;
          return (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <button
                className={
                  "text-sm text-left truncate py-2 px-2 rounded-md w-full transition-all " +
                  (activeS ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/5")
                }
                onClick={() => openEdit(s.id)}
                onDoubleClick={() => renameSubject(s.id)}
                title={s.title}
              >
                <span className="truncate">{s.title}</span>
              </button>
              <button className="text-muted-foreground hover:text-destructive ml-2" onClick={() => deleteSubject(s.id)} aria-label={`Remover ${s.title}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">Clique em um assunto para abrir a anotação</div>

      {/* Create Subject Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Matéria</DialogTitle>
            <DialogDescription>Escolha um emoji e um nome para o assunto</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 mt-2">
            <div className="flex gap-2">
              <Input placeholder="Emoji (ex: 🇧🇷)" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-20" maxLength={2} />
              <Input placeholder="Nome do assunto" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubmit(); } }} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSubmit}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subjects.find(s => s.id === editingId)?.title || 'Editar Anotação'}</DialogTitle>
            <DialogDescription>Escreva suas anotações (salvamento automático)</DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                if (editingId) updateContent(editingId, e.target.value);
              }}
              placeholder="Escreva a anotação..."
              className="w-full h-[300px] min-h-[180px] resize-none rounded-md px-3 py-3 bg-secondary/50 text-sm outline-none focus:outline-none scroll-smooth scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted/40"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleEditClose}>Fechar</Button>
            <Button onClick={() => { if (editingId) { saveEditNow(editingId); setIsEditOpen(false); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

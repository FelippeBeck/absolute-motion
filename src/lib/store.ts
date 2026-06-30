// Camada de persistência com duas implementações:
//   • SupabaseStore — usada quando SUPABASE_URL/KEY estão preenchidos.
//   • MemoryStore   — fallback em memória, deixa o app rodar ponta a ponta
//                     sem banco (ideal pra demo / desenvolvimento local).
//
// Todo o resto do código fala só com `store` (interface única), então ligar o
// Supabase de verdade é só preencher o .env — nada mais muda.

import { randomUUID } from "node:crypto";
import { has } from "./mode.js";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  product?: string;
  brief: any;
  concept?: any;
  status: string;
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Folder = { id: string; user_id: string; name: string; created_at: string };
export type Member = { id: string; owner: string; email: string; role: string; created_at: string };
export type Metric = {
  id: string; user_id: string; project_id?: string | null; project_name: string; style: string;
  platform: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number;
  created_at: string;
};

export type Job = {
  id: string;
  project_id: string;
  user_id: string;
  status: string;
  step?: string;
  progress: number;
  video_model: string;
  image_model: string;
  output_url?: string;
  cost_usd?: number | string;
  error?: string;
  created_at: string;
  updated_at: string;
};

export type SceneRow = {
  id: string;
  project_id: string;
  idx: number;
  duration_sec: number;
  keyframe_prompt?: string;
  motion_prompt?: string;
  narration?: string;
  caption?: string;
  keyframe_url?: string | null;
  clip_url?: string | null;
  status: string;
};

export interface Store {
  createProject(p: Partial<Project>): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(id: string, patch: Partial<Project>): Promise<void>;
  listProjects(userId?: string, limit?: number): Promise<Project[]>;

  createJob(j: Partial<Job>): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  updateJob(id: string, patch: Partial<Job>): Promise<void>;
  listJobs(userId?: string, limit?: number): Promise<Job[]>;

  replaceScenes(projectId: string, scenes: Partial<SceneRow>[]): Promise<void>;
  getScenes(projectId: string): Promise<SceneRow[]>;
  getScene(id: string): Promise<SceneRow | null>;
  updateScene(id: string, patch: Partial<SceneRow>): Promise<void>;
  updateSceneByIdx(projectId: string, idx: number, patch: Partial<SceneRow>): Promise<void>;

  addWaitlist(email: string, source: string): Promise<void>;

  getCredits(userId: string): Promise<number>;
  spendCredits(userId: string, amount: number): Promise<number>;
  grantCredits(userId: string, amount: number): Promise<number>;

  listFolders(userId: string): Promise<Folder[]>;
  createFolder(p: { user_id: string; name: string }): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  listMembers(owner: string): Promise<Member[]>;
  addMember(m: { owner: string; email: string; role: string }): Promise<Member>;
  updateMember(id: string, role: string): Promise<void>;
  removeMember(id: string): Promise<void>;

  addMetric(m: Partial<Metric>): Promise<Metric>;
  listMetrics(userId: string): Promise<Metric[]>;
  deleteMetric(id: string): Promise<void>;
}

const now = () => new Date().toISOString();

// ───────────────────────────── Memory ─────────────────────────────
class MemoryStore implements Store {
  private projects = new Map<string, Project>();
  private jobs = new Map<string, Job>();
  private scenes = new Map<string, SceneRow>();
  private waitlist: { email: string; source: string; created_at: string }[] = [];
  private credits = new Map<string, number>();
  private folders = new Map<string, Folder>();
  private members = new Map<string, Member>();
  private metrics = new Map<string, Metric>();

  async createProject(p: Partial<Project>): Promise<Project> {
    const proj: Project = {
      id: randomUUID(),
      user_id: p.user_id || "demo",
      name: p.name || "Novo anúncio",
      product: p.product,
      brief: p.brief ?? {},
      concept: p.concept,
      status: p.status || "draft",
      folder_id: p.folder_id ?? null,
      created_at: now(),
      updated_at: now(),
    };
    this.projects.set(proj.id, proj);
    return proj;
  }
  async getProject(id: string) {
    return this.projects.get(id) ?? null;
  }
  async updateProject(id: string, patch: Partial<Project>) {
    const cur = this.projects.get(id);
    if (cur) this.projects.set(id, { ...cur, ...patch, updated_at: now() });
  }
  async listProjects(userId?: string, limit = 40) {
    return [...this.projects.values()]
      .filter((p) => !userId || p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  async createJob(j: Partial<Job>): Promise<Job> {
    const job: Job = {
      id: randomUUID(),
      project_id: j.project_id!,
      user_id: j.user_id || "demo",
      status: j.status || "queued",
      step: j.step,
      progress: j.progress ?? 0,
      video_model: j.video_model || "seedance-2.0",
      image_model: j.image_model || "flux-dev",
      output_url: j.output_url,
      cost_usd: j.cost_usd ?? 0,
      error: j.error,
      created_at: now(),
      updated_at: now(),
    };
    this.jobs.set(job.id, job);
    return job;
  }
  async getJob(id: string) {
    return this.jobs.get(id) ?? null;
  }
  async updateJob(id: string, patch: Partial<Job>) {
    const cur = this.jobs.get(id);
    if (cur) this.jobs.set(id, { ...cur, ...patch, updated_at: now() });
  }
  async listJobs(userId?: string, limit = 20) {
    return [...this.jobs.values()]
      .filter((j) => !userId || j.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  async replaceScenes(projectId: string, scenes: Partial<SceneRow>[]) {
    for (const [id, s] of this.scenes) if (s.project_id === projectId) this.scenes.delete(id);
    for (const s of scenes) {
      const row: SceneRow = {
        id: randomUUID(),
        project_id: projectId,
        idx: s.idx!,
        duration_sec: s.duration_sec ?? 5,
        keyframe_prompt: s.keyframe_prompt,
        motion_prompt: s.motion_prompt,
        narration: s.narration,
        caption: s.caption,
        keyframe_url: s.keyframe_url ?? null,
        clip_url: s.clip_url ?? null,
        status: s.status || "pending",
      };
      this.scenes.set(row.id, row);
    }
  }
  async getScenes(projectId: string) {
    return [...this.scenes.values()]
      .filter((s) => s.project_id === projectId)
      .sort((a, b) => a.idx - b.idx);
  }
  async getScene(id: string) {
    return this.scenes.get(id) ?? null;
  }
  async updateScene(id: string, patch: Partial<SceneRow>) {
    const cur = this.scenes.get(id);
    if (cur) this.scenes.set(id, { ...cur, ...patch });
  }
  async updateSceneByIdx(projectId: string, idx: number, patch: Partial<SceneRow>) {
    for (const s of this.scenes.values()) {
      if (s.project_id === projectId && s.idx === idx) {
        this.scenes.set(s.id, { ...s, ...patch });
        return;
      }
    }
  }

  async addWaitlist(email: string, source: string) {
    this.waitlist.push({ email, source, created_at: now() });
  }

  async getCredits(userId: string) {
    if (!this.credits.has(userId)) this.credits.set(userId, 300); // saldo inicial demo
    return this.credits.get(userId)!;
  }
  async spendCredits(userId: string, amount: number) {
    const cur = await this.getCredits(userId);
    const next = Math.max(0, cur - Math.max(0, Math.round(amount)));
    this.credits.set(userId, next);
    return next;
  }
  async grantCredits(userId: string, amount: number) {
    const cur = await this.getCredits(userId);
    const next = cur + Math.max(0, Math.round(amount));
    this.credits.set(userId, next);
    return next;
  }

  async listFolders(userId: string) {
    return [...this.folders.values()].filter((f) => f.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async createFolder(p: { user_id: string; name: string }) {
    const f: Folder = { id: randomUUID(), user_id: p.user_id, name: p.name, created_at: now() };
    this.folders.set(f.id, f);
    return f;
  }
  async deleteFolder(id: string) {
    this.folders.delete(id);
    for (const p of this.projects.values()) if (p.folder_id === id) this.projects.set(p.id, { ...p, folder_id: null });
  }

  async listMembers(owner: string) {
    const list = [...this.members.values()].filter((m) => m.owner === owner);
    if (!list.length) { const me = await this.addMember({ owner, email: owner, role: "owner" }); return [me]; }
    return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  async addMember(m: { owner: string; email: string; role: string }) {
    const mem: Member = { id: randomUUID(), owner: m.owner, email: m.email, role: m.role, created_at: now() };
    this.members.set(mem.id, mem);
    return mem;
  }
  async updateMember(id: string, role: string) { const m = this.members.get(id); if (m) this.members.set(id, { ...m, role }); }
  async removeMember(id: string) { this.members.delete(id); }

  async addMetric(m: Partial<Metric>) {
    const rec: Metric = {
      id: randomUUID(), user_id: m.user_id || "local-user", project_id: m.project_id ?? null,
      project_name: m.project_name || "Ad", style: m.style || "—", platform: m.platform || "Meta",
      spend: m.spend || 0, impressions: m.impressions || 0, clicks: m.clicks || 0, conversions: m.conversions || 0, revenue: m.revenue || 0,
      created_at: now(),
    };
    this.metrics.set(rec.id, rec);
    return rec;
  }
  async listMetrics(userId: string) {
    return [...this.metrics.values()].filter((x) => x.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async deleteMetric(id: string) { this.metrics.delete(id); }
}

// ───────────────────────────── Supabase ─────────────────────────────
class SupabaseStore implements Store {
  private db = () => {
    // import dinâmico pra não exigir Supabase quando rodando em memória
    return import("./db.js").then((m) => m.db);
  };

  async createProject(p: Partial<Project>): Promise<Project> {
    const db = await this.db();
    const { data, error } = await db
      .from("projects")
      .insert({ user_id: p.user_id, name: p.name, product: p.product, brief: p.brief })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  }
  async getProject(id: string) {
    const db = await this.db();
    const { data } = await db.from("projects").select("*").eq("id", id).single();
    return (data as Project) ?? null;
  }
  async updateProject(id: string, patch: Partial<Project>) {
    const db = await this.db();
    await db.from("projects").update({ ...patch, updated_at: now() }).eq("id", id);
  }
  async listProjects(userId?: string, limit = 40) {
    const db = await this.db();
    let q = db.from("projects").select("*").order("created_at", { ascending: false }).limit(limit);
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data as Project[]) ?? [];
  }

  async createJob(j: Partial<Job>): Promise<Job> {
    const db = await this.db();
    const { data, error } = await db
      .from("jobs")
      .insert({
        project_id: j.project_id,
        user_id: j.user_id,
        video_model: j.video_model,
        image_model: j.image_model,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Job;
  }
  async getJob(id: string) {
    const db = await this.db();
    const { data } = await db.from("jobs").select("*").eq("id", id).single();
    return (data as Job) ?? null;
  }
  async updateJob(id: string, patch: Partial<Job>) {
    const db = await this.db();
    await db.from("jobs").update({ ...patch, updated_at: now() }).eq("id", id);
  }
  async listJobs(userId?: string, limit = 20) {
    const db = await this.db();
    let q = db.from("jobs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data as Job[]) ?? [];
  }

  async replaceScenes(projectId: string, scenes: Partial<SceneRow>[]) {
    const db = await this.db();
    await db.from("scenes").delete().eq("project_id", projectId);
    await db.from("scenes").insert(scenes.map((s) => ({ ...s, project_id: projectId })));
  }
  async getScenes(projectId: string) {
    const db = await this.db();
    const { data } = await db.from("scenes").select("*").eq("project_id", projectId).order("idx");
    return (data as SceneRow[]) ?? [];
  }
  async getScene(id: string) {
    const db = await this.db();
    const { data } = await db.from("scenes").select("*").eq("id", id).single();
    return (data as SceneRow) ?? null;
  }
  async updateScene(id: string, patch: Partial<SceneRow>) {
    const db = await this.db();
    await db.from("scenes").update(patch).eq("id", id);
  }
  async updateSceneByIdx(projectId: string, idx: number, patch: Partial<SceneRow>) {
    const db = await this.db();
    await db.from("scenes").update(patch).eq("project_id", projectId).eq("idx", idx);
  }

  async addWaitlist(email: string, source: string) {
    const db = await this.db();
    await db.from("waitlist").insert({ email, source });
  }

  async getCredits(userId: string) {
    const db = await this.db();
    const { data } = await db.from("profiles").select("credits").eq("id", userId).single();
    return (data?.credits as number) ?? 0;
  }
  async spendCredits(userId: string, amount: number) {
    const db = await this.db();
    const cur = await this.getCredits(userId);
    const next = Math.max(0, cur - Math.max(0, Math.round(amount)));
    await db.from("profiles").update({ credits: next }).eq("id", userId);
    return next;
  }
  async grantCredits(userId: string, amount: number) {
    const db = await this.db();
    const cur = await this.getCredits(userId);
    const next = cur + Math.max(0, Math.round(amount));
    await db.from("profiles").update({ credits: next }).eq("id", userId);
    return next;
  }

  async listFolders(userId: string) {
    const db = await this.db();
    const { data } = await db.from("folders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data as Folder[]) ?? [];
  }
  async createFolder(p: { user_id: string; name: string }) {
    const db = await this.db();
    const { data, error } = await db.from("folders").insert(p).select().single();
    if (error) throw error;
    return data as Folder;
  }
  async deleteFolder(id: string) {
    const db = await this.db();
    await db.from("projects").update({ folder_id: null }).eq("folder_id", id);
    await db.from("folders").delete().eq("id", id);
  }

  async listMembers(owner: string) {
    const db = await this.db();
    const { data } = await db.from("members").select("*").eq("owner", owner).order("created_at");
    return (data as Member[]) ?? [];
  }
  async addMember(m: { owner: string; email: string; role: string }) {
    const db = await this.db();
    const { data, error } = await db.from("members").insert(m).select().single();
    if (error) throw error;
    return data as Member;
  }
  async updateMember(id: string, role: string) { const db = await this.db(); await db.from("members").update({ role }).eq("id", id); }
  async removeMember(id: string) { const db = await this.db(); await db.from("members").delete().eq("id", id); }

  async addMetric(m: Partial<Metric>) {
    const db = await this.db();
    const { data, error } = await db.from("metrics").insert(m).select().single();
    if (error) throw error;
    return data as Metric;
  }
  async listMetrics(userId: string) {
    const db = await this.db();
    const { data } = await db.from("metrics").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data as Metric[]) ?? [];
  }
  async deleteMetric(id: string) { const db = await this.db(); await db.from("metrics").delete().eq("id", id); }
}

export const store: Store = has.supabase() ? new SupabaseStore() : new MemoryStore();

// Helpers de progresso usados pelo pipeline.
export async function updateJob(jobId: string, patch: Partial<Job>) {
  await store.updateJob(jobId, patch);
}
export async function setJobProgress(jobId: string, progress: number, step: string) {
  await store.updateJob(jobId, { progress, step });
}

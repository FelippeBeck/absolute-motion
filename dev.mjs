// Sobe backend (:8787) e frontend (:5173) juntos, com um comando: `npm run dev:all`.
import { spawn } from "node:child_process";

const procs = [
  { name: "backend ", cmd: "npm", args: ["run", "dev"], cwd: "." },
  { name: "frontend", cmd: "npm", args: ["run", "dev"], cwd: "frontend" },
];

const children = procs.map(({ name, cmd, args, cwd }) => {
  const c = spawn(cmd, args, { cwd, shell: process.platform === "win32" });
  const tag = (line) => line.split("\n").filter(Boolean).map((l) => `[${name}] ${l}`).join("\n");
  c.stdout.on("data", (d) => console.log(tag(d.toString())));
  c.stderr.on("data", (d) => console.error(tag(d.toString())));
  c.on("exit", (code) => { console.log(`[${name}] exited (${code})`); shutdown(); });
  return c;
});

function shutdown() { children.forEach((c) => { try { c.kill(); } catch {} }); process.exit(0); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Absolute Motion → backend :8787  ·  frontend http://localhost:5173  (Ctrl+C para parar)");

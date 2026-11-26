// `pnpm dev:remote`: the normal dev server, reachable from a phone (HTTPS + password + /storycut proxy).
// A script instead of `OPENREEL_REMOTE=1 vite` so it also works in Windows PowerShell.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const vite = path.join(path.dirname(require.resolve("vite/package.json")), "bin", "vite.js");
const child = spawn(process.execPath, [vite, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, OPENREEL_REMOTE: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));

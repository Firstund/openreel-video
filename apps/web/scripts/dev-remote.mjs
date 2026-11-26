// `pnpm dev:remote`: OpenReel for a phone (HTTPS + password + /storycut proxy).
//
// By default this serves a *production build* (`vite build` + `vite preview`). The dev server sends ~1,400
// separate module files; a phone over Wi-Fi with a self-signed certificate (Chrome does not cache those)
// showed a white screen for a long time. A build is a few files and opens in seconds.
// The build is redone only when sources changed. `pnpm dev:remote --dev` keeps the old live-reload dev server.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const vite = path.join(path.dirname(require.resolve("vite/package.json")), "bin", "vite.js");
const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(webDir, "../..");
const args = process.argv.slice(2);
const env = { ...process.env, OPENREEL_REMOTE: "1" };

function run(argv) {
  const child = spawn(process.execPath, [vite, ...argv], { stdio: "inherit", env, cwd: webDir });
  child.on("exit", (code) => process.exit(code ?? 0));
}

if (args.includes("--dev")) {
  run(args.filter((a) => a !== "--dev"));
} else {
  const stampFile = path.join(webDir, "dist", ".remote-build-stamp");
  const watched = [
    path.join(webDir, "src"), path.join(webDir, "public"), path.join(webDir, "index.html"),
    path.join(webDir, "vite.config.ts"), path.join(webDir, "vite-plugins"), path.join(webDir, "package.json"),
    ...fs.readdirSync(path.join(repo, "packages")).map((p) => path.join(repo, "packages", p, "src")),
  ];
  let newest = 0;
  const walk = (p) => {
    let st;
    try { st = fs.statSync(p); } catch { return; }
    if (st.isDirectory()) {
      if (path.basename(p) === "node_modules") return;
      for (const name of fs.readdirSync(p)) walk(path.join(p, name));
    } else if (st.mtimeMs > newest) newest = st.mtimeMs;
  };
  watched.forEach(walk);
  let built = 0;
  try { built = fs.statSync(stampFile).mtimeMs; } catch { /* never built */ }
  const force = args.includes("--rebuild");
  if (force || !built || newest > built) {
    console.log("\n  OpenReel 폰용 화면을 준비(빌드)하는 중입니다. 처음이나 업데이트 직후에만 1~3분 걸립니다...\n");
    const res = spawnSync(process.execPath, ["--max-old-space-size=6144", vite, "build", "--logLevel", "warn"], { stdio: "inherit", env, cwd: webDir });
    if (res.status !== 0) {
      console.error("\n  빌드에 실패했습니다. 대신 개발 서버로 켭니다 (폰에서 처음 열 때 느릴 수 있음).\n");
      run(["--port", "5173", ...args.filter((a) => a !== "--rebuild")]);
    } else {
      fs.writeFileSync(stampFile, String(Date.now()));
      run(["preview", "--port", "5173", "--strictPort", ...args.filter((a) => a !== "--rebuild")]);
    }
  } else {
    run(["preview", "--port", "5173", "--strictPort", ...args]);
  }
}

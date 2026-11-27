/**
 * Phone / remote access for the dev server (opt-in with OPENREEL_REMOTE=1, i.e. `pnpm dev:remote`).
 *
 * - Listens on the LAN with a self-signed HTTPS certificate. Browsers only allow WebCodecs, OPFS and
 *   crypto.randomUUID on https:// (or localhost), so a phone needs HTTPS to edit.
 * - Asks for a password (the same token story-cut uses, saved in ~/.story-cut/token) before serving anything.
 * - `/storycut/` is proxied to a local `story-cut serve` (port 8765 by default), so the phone only needs
 *   one address and OpenReel can load story-cut results without CORS or mixed-content problems.
 * - `/lmstudio/` is proxied to LM Studio's OpenAI-compatible server on the PC (port 1234, LMSTUDIO_PORT), so the
 *   AI assistant works from a phone: the phone cannot reach the PC's localhost itself. Behind the same password.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ProxyOptions } from "vite";

export const isRemote = process.env.OPENREEL_REMOTE === "1";
export const storyCutPort = Number(process.env.STORYCUT_PORT || 8765);
export const lmStudioPort = Number(process.env.LMSTUDIO_PORT || 1234);
const COOKIE = "sc_token";

export function readAccessToken(): string {
  const fromEnv = process.env.STORYCUT_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const file = path.join(os.homedir(), ".story-cut", "token");
  try {
    const value = fs.readFileSync(file, "utf8").trim();
    if (value) return value;
  } catch {
    /* first run */
  }
  const value = crypto.randomBytes(8).toString("base64url");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
  return value;
}

function cookieValue(req: IncomingMessage, name: string): string {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function cookieHeader(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 60}; HttpOnly; SameSite=Lax; Secure`;
}

const LOGIN_PAGE = (failed: boolean) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenReel 접속</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0b0f17;color:#e8edf5;font:16px system-ui,"Malgun Gothic",sans-serif}
form{width:min(92vw,360px);background:#141a26;border:1px solid #263042;border-radius:14px;padding:18px}input,button{width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;font:inherit;font-size:16px}
input{background:#0b0f17;color:inherit;border:1px solid #263042;padding:0 12px;margin:12px 0}button{background:#38bdf8;border:0;font-weight:700;color:#04111c}p{color:#93a0b4;font-size:14px;margin:6px 0}</style></head>
<body><form method="post" action="/__openreel_login"><b>비밀번호</b><p>PC에서 OpenReel(pnpm dev:remote) 창에 보이는 접속 비밀번호를 넣으세요.</p>
${failed ? '<p style="color:#f43f5e">비밀번호가 맞지 않습니다.</p>' : ""}<input name="token" type="password" autocomplete="current-password" autofocus><button>들어가기</button></form></body></html>`;

function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list ?? []) {
      if (item.family === "IPv4" && !item.internal) out.push(item.address);
    }
  }
  const rank = (ip: string) => (ipKind(ip).startsWith("같은") ? 0 : ipKind(ip).startsWith("Tail") ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b));
}

type Middlewares = { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void };

function ipKind(ip: string): string {
  const [a, b] = ip.split(".").map(Number);
  if (a === 100 && b >= 64 && b <= 127) return "Tailscale     ";
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return "같은 와이파이 ";
  return "공인 IP       ";
}

function installMiddlewares(middlewares: Middlewares): string | null {
  // `/storycut` without the trailing slash would break the relative URLs of the story-cut page.
  middlewares.use((req, res, next) => {
    const url = req.url || "/";
    if (/^\/storycut(\?|$)/.test(url)) {
      res.statusCode = 302;
      res.setHeader("Location", "/storycut/" + url.slice("/storycut".length));
      res.end();
      return;
    }
    next();
  });
  if (!isRemote) return null;
  const token = readAccessToken();
  middlewares.use((req, res, next) => {
    const url = new URL(req.url || "/", "https://local");
    if (url.pathname === "/__openreel_login" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; if (body.length > 4096) req.destroy(); });
      req.on("end", () => {
        const given = new URLSearchParams(body).get("token")?.trim() || "";
        if (same(given, token)) {
          res.statusCode = 303;
          res.setHeader("Set-Cookie", cookieHeader(token));
          res.setHeader("Location", "/");
        } else {
          res.statusCode = 401;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(LOGIN_PAGE(true));
          return;
        }
        res.end();
      });
      return;
    }
    const queryToken = url.searchParams.get("token") || url.searchParams.get("key");
    if (queryToken && same(queryToken, token)) {
      url.searchParams.delete("token");
      url.searchParams.delete("key");
      res.statusCode = 302;
      res.setHeader("Set-Cookie", cookieHeader(token));
      res.setHeader("Location", url.pathname + (url.search || ""));
      res.end();
      return;
    }
    const auth = req.headers.authorization || "";
    const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (same(cookieValue(req, COOKIE), token) || (bearer && same(bearer, token))) {
      if (url.pathname === "/__openreel_ai") {
        // The AI client sends its requests without cookies (credentials: "omit"), so it authenticates to
        // /lmstudio/ with this password as a Bearer key. Only a signed-in page can read it.
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(JSON.stringify({ baseUrl: "/lmstudio/v1", key: token }));
        return;
      }
      next();
      return;
    }
    res.statusCode = 401;
    const wantsPage = (req.headers.accept || "").includes("text/html");
    res.setHeader("Content-Type", wantsPage ? "text/html; charset=utf-8" : "text/plain; charset=utf-8");
    res.end(wantsPage ? LOGIN_PAGE(false) : "password required");
  });
  return token;
}

function announce(httpServer: { once: (e: string, cb: () => void) => void } | null | undefined, port: number, token: string, log: (msg: string) => void) {
  httpServer?.once("listening", () => {
    setTimeout(() => {
      const ips = lanAddresses();
      const lines = [
        "",
        "  휴대폰 접속 (OpenReel + story-cut):",
        ...ips.map((ip) => `    ${ipKind(ip)} https://${ip}:${port}/storycut/?token=${token}`),
        `  접속 비밀번호: ${token}`,
        "  처음 열면 '안전하지 않음' 경고가 나옵니다. [고급] → [계속 진행]을 누르세요. (이 PC가 만든 인증서라서 그렇습니다)",
        ...(ips.some((ip) => ipKind(ip).startsWith("공인"))
          ? ["  주의: 이 PC는 공인 IP라 인터넷에서도 접속될 수 있습니다. 비밀번호가 막아 주지만 주소를 남에게 보내지 마세요."]
          : []),
        "",
      ];
      log(lines.join("\n"));
    }, 300);
  });
}

/** Password gate + friendly startup message (dev server and `vite preview`). Only active in remote mode. */
export function storyCutRemotePlugin(): Plugin {
  return {
    name: "openreel-storycut-remote",
    configureServer(server) {
      const token = installMiddlewares(server.middlewares as unknown as Middlewares);
      if (token) announce(server.httpServer, server.config.server.port ?? 5173, token, (m) => server.config.logger.info(m));
    },
    configurePreviewServer(server) {
      const token = installMiddlewares(server.middlewares as unknown as Middlewares);
      if (token) announce(server.httpServer, server.config.preview.port ?? 4173, token, (m) => server.config.logger.info(m));
    },
  };
}

export function storyCutProxy(): Record<string, ProxyOptions> {
  return {
    "/lmstudio/": {
      target: `http://127.0.0.1:${lmStudioPort}`,
      changeOrigin: true,
      ws: false,
      rewrite: (p) => p.replace(/^\/lmstudio/, "") || "/",
      // Local models can take minutes on a long prompt.
      timeout: 10 * 60 * 1000,
      proxyTimeout: 10 * 60 * 1000,
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          // The password is for this server, not for LM Studio.
          proxyReq.removeHeader("authorization");
          proxyReq.removeHeader("cookie");
        });
        proxy.on("error", (_err, _req, res) => {
          const out = res as ServerResponse;
          if (!out.headersSent && typeof out.writeHead === "function") {
            out.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
            out.end(JSON.stringify({ error: { message: `LM Studio (port ${lmStudioPort}) is not running on the PC` } }));
          }
        });
      },
    },
    "/storycut/": {
      target: `http://127.0.0.1:${storyCutPort}`,
      changeOrigin: true,
      ws: false,
      rewrite: (p) => p.replace(/^\/storycut/, "") || "/",
      configure: (proxy) => {
        proxy.on("error", (_err, _req, res) => {
          const out = res as ServerResponse;
          if (!out.headersSent && typeof out.writeHead === "function") {
            out.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
            out.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui,'Malgun Gothic';background:#0b0f17;color:#e8edf5;padding:24px">
<h3>story-cut이 꺼져 있습니다</h3><p>PC에서 PowerShell을 열고 <code>story-cut serve --videos D:\\_ForBroadcast</code> 를 실행한 뒤 새로고침하세요.</p></body>`);
          }
        });
      },
    },
  };
}

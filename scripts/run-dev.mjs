/**
 * Runs Vite dev server with esbuild binary from a short path.
 * Fixes "esbuild.exe ENOENT" when project lives in long/OneDrive paths on Windows.
 */
import { spawnSync, spawn } from "child_process";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const rootEsbuildExe = join(root, "node_modules", ".bin", "esbuild.exe");
const rootEsbuildBin = join(root, "node_modules", "esbuild", "bin", "esbuild");

const shortDir = join(tmpdir(), "esbuild-vite");
const shortExe = join(shortDir, "esbuild.exe");
const installDir = join(tmpdir(), "esbuild-vite-npm");
const installedExe = join(installDir, "node_modules", "@esbuild", "win32-x64", "esbuild.exe");

function getBinaryPath() {
  // Prefer existing copy in temp (avoids touching locked file in node_modules)
  if (existsSync(shortExe)) return shortExe;
  // Try to use root esbuild
  if (existsSync(rootEsbuildExe)) return rootEsbuildExe;
  if (existsSync(rootEsbuildBin)) return rootEsbuildBin;
  // Fallback: install @esbuild/win32-x64 to temp so we never touch the locked project file
  if (!existsSync(installedExe)) {
    mkdirSync(installDir, { recursive: true });
    spawnSync(
      "npm",
      ["install", "@esbuild/win32-x64", "--no-save", "--prefix", installDir],
      { cwd: root, stdio: "pipe", shell: true }
    );
  }
  if (existsSync(installedExe)) return installedExe;
  return shortExe;
}

const viteBin = join(root, "node_modules", "vite", "bin", "vite.js");
const vite = spawn(process.execPath, [viteBin], {
  cwd: root,
  stdio: "inherit",
});

vite.on("exit", (code) => process.exit(code ?? 0));

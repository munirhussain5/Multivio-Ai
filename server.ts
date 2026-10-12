import { spawn } from 'node:child_process';
import process from 'node:process';

// When invoked directly via `node server.ts`, ensure tsx module loader is attached for TypeScript resolution
if (!process.env.__TSX_LOADED__ && !process.execArgv.some(arg => arg.includes('tsx'))) {
  const child = spawn(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_LOADED__: '1' },
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
} else {
  const { startServer } = await import('./src/serverCore.ts');
  startServer().catch((err) => {
    console.error('Failed to start StudyMind server:', err);
    process.exit(1);
  });
}

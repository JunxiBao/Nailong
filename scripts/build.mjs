import { mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { homeRoot, frontendEntries } from './server.mjs';

const output = path.join(homeRoot, 'dist');

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyDirectory(from, to);
    else if (entry.isFile()) await copyFile(from, to);
  }
}

try {
  await stat(path.join(homeRoot, 'index.html'));
  // This directory contains only generated files owned by this project.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of frontendEntries) {
    const source = path.join(homeRoot, name);
    let info;
    try { info = await stat(source); } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (info.isDirectory()) await copyDirectory(source, path.join(output, name));
    else await copyFile(source, path.join(output, name));
  }
  console.log(`构建完成：${output}`);
  console.log('运行 npm run preview 检查；静态发布时使用整个 dist 目录。');
} catch (error) {
  console.error(`构建失败：${error.message}`);
  process.exitCode = 1;
}

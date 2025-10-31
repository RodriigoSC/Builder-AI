// scripts/ai-builder-deps.js
/**
 * Varre src (ou src/pages) recursivamente, detecta imports de libs (não-relativas)
 * e instala (npm/yarn) as que não estiverem em package.json.
 *
 * Uso: node scripts/ai-builder-deps.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC_DIR = path.resolve('./src');
const PKG_PATH = path.resolve('./package.json');

function readPackageJson() {
  if (!fs.existsSync(PKG_PATH)) return {};
  return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
}

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, fileList);
    else if (e.isFile() && /\.(js|jsx|ts|tsx)$/.test(e.name)) fileList.push(full);
  }
  return fileList;
}

function extractImports(content) {
  const libs = new Set();

  // regex básico para imports e require: import ... from 'x'  / require('x')
  const importRegex = /import\s+(?:[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
  const importRegex2 = /import\(['"]([^'"]+)['"]\)/g; // dynamic import
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

  let m;
  while ((m = importRegex.exec(content))) {
    const lib = m[1];
    if (!lib.startsWith('.') && !lib.startsWith('/')) libs.add(normalizePackage(lib));
  }
  while ((m = importRegex2.exec(content))) {
    const lib = m[1];
    if (!lib.startsWith('.') && !lib.startsWith('/')) libs.add(normalizePackage(lib));
  }
  while ((m = requireRegex.exec(content))) {
    const lib = m[1];
    if (!lib.startsWith('.') && !lib.startsWith('/')) libs.add(normalizePackage(lib));
  }

  return libs;
}

// para imports como "lodash/get" -> extrai "lodash"
function normalizePackage(lib) {
  if (lib.startsWith('@')) {
    // @scope/name/subpath -> @scope/name
    const parts = lib.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : lib;
  }
  return lib.split('/')[0];
}

function detectAndInstall() {
  const pkg = readPackageJson();
  const installedDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.peerDependencies || {}),
  };

  const files = walk(SRC_DIR);
  const needed = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const libs = extractImports(content);
    libs.forEach((lib) => {
      if (!installedDeps.hasOwnProperty(lib)) needed.add(lib);
    });
  }

  if (needed.size === 0) {
    console.log('✅ Nenhuma dependência adicional detectada.');
    return;
  }

  const depsList = Array.from(needed);
  console.log('📦 Dependências detectadas e ausentes:', depsList.join(', '));

  // Detecta package manager (yarn.lock, pnpm-lock.yaml)
  const useYarn = fs.existsSync(path.resolve('yarn.lock'));
  const usePnpm = fs.existsSync(path.resolve('pnpm-lock.yaml'));
  let installCmd;

  if (usePnpm) installCmd = `pnpm add ${depsList.join(' ')}`;
  else if (useYarn) installCmd = `yarn add ${depsList.join(' ')}`;
  else installCmd = `npm install ${depsList.join(' ')}`;

  console.log('➡️ Executando:', installCmd);
  try {
    execSync(installCmd, { stdio: 'inherit' });
    console.log('✅ Instalação concluída.');
  } catch (err) {
    console.error('❌ Falha ao instalar dependências:', err.message);
    process.exit(1);
  }
}

// Execução
detectAndInstall();

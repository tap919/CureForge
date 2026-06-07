import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parse } from 'acorn';

const execFileAsync = promisify(execFile);

export interface SandboxResult {
  failed?: boolean;
  error?: string;
  trace?: string[];
  data?: any;
}

export function validateSecureAST(source: string) {
  if (!source) return;
  if (source.length > 50000) {
    throw new Error('Code payload too large');
  }

  const ast = parse(source, { ecmaVersion: 2024, sourceType: 'script' });
  const forbidden = ["process", "require", "constructor", "__proto__", "eval", "global", "globalThis", "fs", "child_process", "worker_threads"];

  function walk(node: any) {
    if (!node) return;
    if (node.type === 'Identifier' && forbidden.includes(node.name)) {
      throw new Error(`Security Violation: Use of forbidden identifier: ${node.name}`);
    }
    if (node.type === 'Literal' && typeof node.value === 'string' && forbidden.includes(node.value)) {
      throw new Error(`Security Violation: Use of forbidden string: ${node.value}`);
    }
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        walk(node[key]);
      }
    }
  }

  walk(ast);
}

export async function runInSubprocess(code: string, timeoutMs: number = 3000): Promise<SandboxResult> {
  const tempId = Math.random().toString(36).substring(7);
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `sandbox-${tempId}.js`);

  const fastCheckPath = require.resolve('fast-check');
  const seedrandomPath = require.resolve('seedrandom');
  
  const wrappedCode = `
    const fc = require('${fastCheckPath}');
    const seedrandom = require('${seedrandomPath}');
    const util = require('util');
    
    const _trace = [];
    const console = {
      log: (...args) => _trace.push(args.map(a => util.format(a)).join(' ')),
      warn: (...args) => _trace.push('[warn] ' + args.map(a => util.format(a)).join(' ')),
      error: (...args) => _trace.push('[error] ' + args.map(a => util.format(a)).join(' ')),
    };
    
    let result = null;
    let assert = util.isDeepStrictEqual;
    
    try {
      ${code}
      process.stdout.write(JSON.stringify({ success: true, data: result, trace: _trace }));
    } catch (err) {
      process.stdout.write(JSON.stringify({ success: false, error: err.message, trace: _trace }));
    }
  `;

  await fs.writeFile(filePath, wrappedCode, 'utf8');

  try {
    const { stdout } = await execFileAsync('node', ['--no-warnings', '--disallow-code-generation-from-strings', filePath], {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024, // 1 MB limit
      cwd: process.cwd(), // ensure it resolves project node_modules
    });
    
    try {
      const parsed = JSON.parse(stdout.trim());
      if (parsed.success) {
        return { data: parsed.data, trace: parsed.trace };
      } else {
        return { failed: true, error: parsed.error, trace: parsed.trace };
      }
    } catch (parseErr) {
      return { failed: true, error: 'Could not parse sandbox output', trace: [stdout.substring(0, 100)] };
    }
  } catch (err: any) {
    if (err.killed) {
      return { failed: true, error: 'Execution timed out', trace: [] };
    }
    return { failed: true, error: err.message, trace: [] };
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

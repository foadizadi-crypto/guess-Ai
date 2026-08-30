/**
 * Resolver hook so plain `node` can run the app's TypeScript modules directly.
 *
 * Metro resolves extensionless imports (`./gameConfig`) and the `@/` alias;
 * Node's ESM resolver does not. This hook adds both so scripts/economy-sim.ts
 * can import the real config modules instead of duplicating their numbers.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
  let spec = specifier;

  if (spec.startsWith('@/')) {
    spec = pathToFileURL(path.join(projectRoot, spec.slice(2))).href;
  }

  const looksLocal = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('file:');
  if (looksLocal && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(spec)) {
    const base = spec.startsWith('file:')
      ? fileURLToPath(spec)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), spec);

    for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }

  return nextResolve(spec, context);
}

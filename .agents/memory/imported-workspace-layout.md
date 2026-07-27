---
name: Imported workspace layout
description: Durable setup guidance for imported pnpm workspaces whose package files are nested below the paths used by the original project.
---

When a project arrives from a zip with an extra directory layer, preserve the source structure but align the root workspace globs, lockfile importers, TypeScript project references, and package-relative config paths to the actual locations.

**Why:** Package managers and TypeScript resolve from the files' physical paths, while imported metadata may still describe the pre-archive layout. Leaving those references mismatched creates cascading “package not found” and missing config errors even when the application code is healthy.

**How to apply:** Before changing application code, compare each workspace package's physical path with `pnpm-workspace.yaml`, lockfile importer paths, and every `tsconfig` reference. Also check whether build scripts reserve a port already used by another running workflow.
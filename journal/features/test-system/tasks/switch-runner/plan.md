# switch-runner — plan

1. Switch the root and all granted project manifests to the `testing` bin, adding one root dev dependency. Keep the engine scripts and capture package untouched. Write the shared gate chain once as `check:base`, with `check` and `check:affected` appending their Nx target choice. Set `nx.json` parallelism to 1 and update test inputs to the testing package.
2. Remove the five old tooling runner files and their tsconfig references. Review the remaining tooling tests and remove its spawn grant only if none starts a child process. Keep all moved tests in `packages/testing` unchanged.
3. Update `AGENTS.md` and affected domain claims and source quotes. Stamp the touched claims, run journal drift, and fix any stale evidence within the grant. Check generated adapters and the root hook and workflow command paths.
4. Run the full check from cache and with the Nx cache skipped through `/var/tmp/kuib-guard.sh 30 1500 --`. Fix failures within the grant; report any outside it. Record the tests changed or deleted, new names and sibling patterns, and verification.

The new gate name `check:base` mirrors `check:circular` and `check:affected`. CI and other machines can pass Nx `--parallel=N` to override the workspace default in `nx.json`.

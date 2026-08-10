# Local Development Stack Rules

> Applies when a project has multiple local processes or supports concurrent Git
> worktrees.

## One Declarative Stack

- Prefer Process Compose for a local stack that combines application servers,
  workers, documentation, emulators, and container-backed infrastructure. Keep
  `process-compose.yaml` at the repository root and expose it through the root
  `dev` script.
- Use Process Compose as the process and log supervisor; keep Docker Compose
  focused on infrastructure that benefits from containers. Do not recreate
  orchestration, port allocation, or log multiplexing in a custom script without
  a requirement the tools cannot express.
- Enable strict config validation and ordered shutdown. Disable the Process
  Compose HTTP server when its API is unused so every worktree does not compete
  for the default server port.
- Model startup as a dependency graph. Readiness commands and migrations should
  exit successfully before dependent long-running processes start; do not treat
  mere process creation as service readiness.
- Run independent long-lived processes in parallel after their shared
  prerequisites complete.
- Decide explicitly who owns infrastructure shutdown. If a detached container
  is intentionally persistent, document that. Otherwise give its Process
  Compose entry a shutdown command that cleans it up.

Use this dependency shape as a starting point, adapting process names and
commands to the repository:

```yaml
version: "0.5"
is_strict: true
ordered_shutdown: true

processes:
  database:
    command: docker compose up --detach --wait database
    availability:
      restart: exit_on_failure

  migrations:
    command: bun run db:migrate
    depends_on:
      database:
        condition: process_completed_successfully
    availability:
      restart: exit_on_failure

  web:
    command: bun run --cwd apps/web dev
    depends_on:
      migrations:
        condition: process_completed_successfully

  worker:
    command: bun run --cwd apps/worker dev
    depends_on:
      migrations:
        condition: process_completed_successfully
```

The container service needs a health check for `docker compose --wait` to
represent readiness.

## Worktree Isolation with Git Treeline

- Prefer Git Treeline to custom worktree-aware runtime code. Commit
  `.treeline.yml`; keep Treeline's machine config and allocation registry outside
  the repository.
- Allocate one contiguous port for every listener that varies by worktree. Set
  the machine-wide port increment to at least the largest `port_count` used by
  local projects, with headroom for future listeners.
- Write all allocated values into one ignored environment file. Derive browser
  origins, API URLs, database URLs, worker configuration, and local CLI targets
  from that same contract instead of hard-coding fallback ports.
- Mark generated runtime values in `.env.example` separately from credentials.
  Seed or copy local secrets into new worktrees without committing them.
- Give every worktree a distinct hostname as well as a distinct port when
  browser cookies, OAuth callbacks, or origin checks could otherwise collide.
- Namespace Docker Compose resources per worktree with a generated
  `COMPOSE_PROJECT_NAME`. Keep mutable storage worktree-local or use a
  database-per-worktree strategy.
- Put the noninteractive stack command in Treeline's `commands.start`, disabling
  the TUI there. Keep the root `dev` command interactive for humans, and use
  `gtl start`, `gtl stop`, and `gtl restart` for supervised or agent-driven
  operation.
- Run `gtl doctor` after changing allocation or environment configuration. Run
  Process Compose's dry-run validation after changing its process graph.

A typical Treeline contract looks like this:

```yaml
project: my_app
port_count: 3

env_file: .env.local

env:
  APP_ORIGIN: "http://p{port}.localhost:{port}"
  COMPOSE_PROJECT_NAME: "my-app-{port}"
  DATABASE_URL: "postgresql://localhost:{port_3}/my_app"
  DEV_DATABASE_PORT: "{port_3}"
  DEV_DOCS_PORT: "{port_2}"
  PORT: "{port}"

commands:
  start: bun run dev -- --tui=false
```

## Agent Runtime Validation

- In a Treeline-managed isolated worktree, an agent may start the relevant local
  stack without asking when a runtime smoke test is useful. Stop what the agent
  started before handing off.
- Outside an isolated worktree, follow the general rule: do not start a dev
  server unless the user asks, and assume an existing server belongs to the
  user.

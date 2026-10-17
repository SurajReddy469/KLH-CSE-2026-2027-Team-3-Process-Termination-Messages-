# Linux Process Watchdog and Auto-Restart System
**Batch 3 — Operating Systems and System Programming (OSSP)**  
**Platform:** Ubuntu Linux (GCC, GNU Make, POSIX.1-2008 Standard)

---

## 1. Project Overview

The **Linux Process Watchdog and Auto-Restart System** is a robust, modular, system-level process supervisor engineered in pure C. It continuously monitors target processes, detects unexpected failures (segmentation faults, illegal instructions, aborts, and non-zero exit codes), automatically recovers them through controlled restarts, enforces crash-loop limits, ensures asynchronous signal safety, and reaps all child processes to guarantee **zero zombie processes**.

```
                              +----------------------------+
                              |         CLI / User         |
                              |  (Signals: SIGINT/SIGTERM) |
                              +--------------+-------------+
                                             |
                                             v
                             +-------------------------------+
                             |       Watchdog Supervisor     |
                             |           (Parent PID)        |
                             +---------------+---------------+
                                             |
                   +-------------------------+-------------------------+
                   |                         |                         |
                   v                         v                         v
     +---------------------------+  +-----------------+  +-------------------------+
     |   Process Manager Module  |  |  Logger Module  |  | Signal Handling Module  |
     |  (fork, execvp, waitpid)  |  | (Console & File)|  |   (sigaction, atomic)   |
     +-------------+-------------+  +-----------------+  +-------------------------+
                   |
     +-------------+-------------+
     | fork()      | waitpid()   |
     v             v             |
+---------------------+          |
|  Monitored Child    |----------+
|  Process (Worker)   |   Process Termination:
|     (Child PID)     |   - WIFEXITED (Code 0 vs Error)
+---------------------+   - WIFSIGNALED (SIGSEGV, etc.)
```

---

## 2. Key Features

- **Process Supervision (`fork` & `execvp`):** Launches and monitors any arbitrary executable and its arguments safely without shell injection.
- **Intelligent Exit Discrimination:** Differentiates between:
  - Normal successful completion (`WIFEXITED && WEXITSTATUS == 0`): Workload finished; watchdog stops cleanly without unnecessary restarts.
  - Abnormal application errors (`WEXITSTATUS != 0`): Triggers recovery.
  - Fatal signal crashes (`WIFSIGNALED`): Decodes terminating signal name (`SIGSEGV`, `SIGABRT`, `SIGFPE`, `SIGKILL`) and core dump flags.
- **Auto-Recovery & Loop Prevention:**
  - Configurable maximum restart limit (`--max-restarts N`).
  - Configurable cool-off delay (`--restart-delay SECONDS`) to prevent rapid thrashing.
  - Optional policy to restart even on normal exit (`--always-restart`).
- **Signal Handling & Safe Shutdown:**
  - Intercepts `SIGINT` (Ctrl+C) and `SIGTERM` via `sigaction()`.
  - Non-blocking signal-safe atomic flag (`volatile sig_atomic_t`).
  - Two-phase polite termination: `SIGTERM` followed by `SIGKILL` escalation on timeout.
  - Continuous child process reaping to prevent zombie (`defunct`) processes.
- **Dual-Stream Audit Logging:**
  - Colorized terminal UI with status badges (`[INFO]`, `[SUCCESS]`, `[WARN]`, `[ERROR]`).
  - Plain-text persistent log file with ISO timestamps (`[YYYY-MM-DD HH:MM:SS]`).
- **Linux `/proc` Inspection:** Query live metadata (`/proc/<PID>/status`) showing State, Memory RSS, and Threads.

---

## 3. Project Directory Structure

```text
linux-process-watchdog/
├── src/
│   ├── main.c              # CLI interface and argument validation (getopt_long)
│   ├── watchdog.c          # Core supervision loop, restart tracking, and delays
│   ├── watchdog.h          # Watchdog configuration definitions and prototypes
│   ├── process_manager.c   # fork, execvp, waitpid, graceful termination, and /proc
│   ├── process_manager.h   # Process lifecycle function prototypes and status enums
│   ├── logger.c            # Dual-stream logging (terminal and unbuffered text file)
│   ├── logger.h            # Logging levels and timestamp helpers
│   ├── signal_handler.c    # Signal handling using sigaction and atomic flag
│   └── signal_handler.h    # Signal handling prototypes and flag declaration
├── tests/
│   ├── stable_worker.c     # Continuous worker demonstrating uptime & clean signal exit
│   ├── crash_worker.c      # Demonstrator for segfaults, aborts, div-by-zero, exit codes
│   ├── normal_worker.c     # Demonstrator for normal successful task completion (code 0)
│   └── test_watchdog.sh    # Automated 8-test validation suite with timeout safety
├── logs/
│   └── .gitkeep            # Directory for output log files
├── docs/
│   ├── PROJECT_REPORT.md   # Complete 21-section college engineering report
│   ├── ARCHITECTURE.md     # Deep dive into process lifecycle and POSIX mechanics
│   ├── TEST_CASES.md       # Full test matrix with commands, expected & actual results
│   └── VIVA_QUESTIONS.md   # 28 OSSP viva questions with beginner-friendly answers
├── bin/                    # Compiled binaries (generated during build)
├── Makefile                # GNU Makefile with all, tests, test, clean targets
├── README.md               # Master project documentation
├── .gitignore              # Git ignore rules for build artifacts and logs
└── LICENSE                 # MIT License
```

---

## 4. Compilation & Installation in Ubuntu Linux

### Prerequisites
On Ubuntu Linux or WSL2, ensure standard development tools are installed:
```bash
sudo apt update
sudo apt install -y build-essential gcc make
```

### Build Everything
Run `make` from the project root:
```bash
make
```
This builds:
- `bin/watchdog`: The process watchdog supervisor.
- `bin/stable_worker`: Demonstration worker that runs continuously.
- `bin/crash_worker`: Demonstration worker that crashes on demand.
- `bin/normal_worker`: Demonstration worker that exits cleanly with code 0.

---

## 5. Usage Syntax and Command-Line Options

```text
Usage:
  ./bin/watchdog [OPTIONS] -- COMMAND [ARGS...]
  ./bin/watchdog --inspect-pid <PID>

Options:
  -h, --help                 Display usage information and exit
  -i, --interval SECONDS     Health monitoring check interval (default: 1s)
  -m, --max-restarts N       Maximum number of restarts allowed (default: 5, -1 for unlimited)
  -d, --restart-delay SEC    Delay in seconds between restart attempts (default: 2s)
  -l, --log FILE             Path to output log file (default: logs/watchdog.log)
  -a, --always-restart       Restart worker even on normal exit (exit code 0)
  -p, --inspect-pid PID      Inspect an existing process via Linux /proc and exit
  --                         Separator marking the beginning of the command to monitor
```

---

## 6. Practical Demonstration Scenarios

### Scenario 1: Normal Worker Completion (No Unintended Restart)
Demonstrates that normal tasks that finish with exit code 0 are **not** repeatedly restarted.
```bash
./bin/watchdog -- ./bin/normal_worker --duration 2
```
*Result:* Worker counts to 2, exits with code 0, watchdog detects clean completion, logs success, and exits.

---

### Scenario 2: Crash Detection and Automatic Recovery
Demonstrates automatic recovery when a process experiences a Segmentation Fault (`SIGSEGV`).
```bash
./bin/watchdog --max-restarts 2 --restart-delay 1 -- ./bin/crash_worker --delay 1 --type segfault
```
*Result:* Worker crashes after 1 second. Watchdog detects `SIGSEGV (11)`, logs the event, waits 1 second, and restarts it with a new PID.

---

### Scenario 3: Maximum Restart Limit (Preventing Infinite Loops)
Demonstrates protection against thrashing when a process repeatedly fails.
```bash
./bin/watchdog --max-restarts 3 --restart-delay 0 -- ./bin/crash_worker --delay 0 --type exit1
```
*Result:* Worker repeatedly exits with error code 42. After 3 attempts, the watchdog logs `Restart limit reached (3/3 attempts)` and halts.

---

### Scenario 4: Intentional External Termination (`kill`)
Demonstrates how the watchdog resurrects a worker killed by an outside process or administrator.

**Terminal 1:** Start supervising the stable worker:
```bash
./bin/watchdog -- ./bin/stable_worker
```
*Note the printed child PID (e.g. `12345`).*

**Terminal 2:** Intentionally terminate the worker:
```bash
kill -9 12345
```
**Terminal 1 Observation:**
The watchdog immediately captures `SIGKILL (9)`, logs `Monitored process terminated unexpectedly by signal SIGKILL`, enforces the restart delay, and launches a fresh instance with a new PID.

---

### Scenario 5: Graceful Shutdown via Ctrl+C & Zombie Verification
Demonstrates that pressing `Ctrl+C` cleanly terminates the worker and leaves **0 zombie processes**.
```bash
./bin/watchdog -- ./bin/stable_worker
```
Press `Ctrl+C`.

**Verification:**
In another terminal, run:
```bash
ps -ef | grep defunct | grep -v grep
```
*Result:* 0 defunct entries. The child process was politely stopped with `SIGTERM` and reaped cleanly.

---

### Scenario 6: Inspecting Process Internals via Linux `/proc`
Demonstrates inspecting process state, resident memory, parentage, and thread count from the Linux virtual `/proc` filesystem.
```bash
./bin/watchdog --inspect-pid 1
```

---

## 7. Running the Automated Test Suite

The project includes an automated test runner that validates all core requirements with built-in timeouts to prevent hanging:
```bash
make test
```
**Test Results (Actual Run):**
```text
==============================================================================
  OSSP BATCH 3 — PROCESS WATCHDOG AUTOMATED VALIDATION SUITE                
==============================================================================

  [PASS] Test 1: Normal worker exit handled cleanly without unintended restart
  [PASS] Test 2: SIGSEGV crash detected and process successfully restarted
  [PASS] Test 3: Enforced maximum restart threshold (stopped after 3 failures)
  [PASS] Test 4: Watchdog caught SIGINT, safely reaped child, 0 zombies left
  [PASS] Test 5: Correctly caught execvp failure (POSIX code 127)
  [PASS] Test 6: CLI correctly validates input parameters and provides help
  [PASS] Test 7: Successfully inspected target PID via Linux /proc filesystem
  [PASS] Test 8: Log file contains structured ISO-like timestamps and entries

==============================================================================
  TOTAL TESTS: 8 | PASSED: 8 | FAILED: 0
==============================================================================
ALL TESTS PASSED SUCCESSFULLY! The Process Watchdog is rock solid.
```

---

## 8. College Viva & Examination Reference

For viva examination preparation, refer to:
- [`docs/VIVA_QUESTIONS.md`](docs/VIVA_QUESTIONS.md): Contains 28 questions and answers covering `fork()`, `execvp()`, `waitpid()`, signals, zombie processes, `/proc`, and systems programming concepts.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Deep dive into internal state transitions, memory models, and signal safety.
- [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md): Complete 21-section formal project report.

---

## 9. License

This project is open-source under the [MIT License](LICENSE).
Batch 3 — Operating Systems and System Programming (OSSP).

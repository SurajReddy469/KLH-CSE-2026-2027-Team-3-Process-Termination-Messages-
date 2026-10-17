# Test Cases & Validation Report
**Project:** Linux Process Watchdog and Auto-Restart System  
**Course:** Operating Systems and System Programming (OSSP) — Batch 3  
**Environment:** Ubuntu 24.04 LTS on WSL2 (Kernel 6.18, GCC 15.2.0, GNU Make 4.4.1)

---

## 1. Test Verification Matrix

All tests below have been verified using the automated test suite `tests/test_watchdog.sh` and interactive terminal runs on Ubuntu Linux.

| Test ID | Test Name / Scenario | Objectives | Input / Command | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Normal Worker Exit | Verify clean termination with code 0 is NOT mistaken for failure. | `./bin/watchdog -- ./bin/normal_worker --duration 2` | Watchdog detects exit code 0, logs success, does not restart, exits with code 0. | Process finished cleanly. Watchdog logged normal exit and terminated safely. | **PASS** |
| **TC-02** | Crash Recovery (SIGSEGV) | Verify automatic crash detection and child process recovery. | `./bin/watchdog --max-restarts 1 -- ./bin/crash_worker --delay 1 --type segfault` | Detects `SIGSEGV (11)`, logs termination reason, increments count, restarts process with new PID. | Caught SIGSEGV, logged event, cool-off delay respected, re-spawned with new PID. | **PASS** |
| **TC-03** | Max Restarts Limit | Verify rapid crash loop prevention when limit is reached. | `./bin/watchdog --max-restarts 3 --restart-delay 0 -- ./bin/crash_worker --delay 0 --type exit1` | Attempts 3 restarts, halts when limit reached, logs warning, returns error code 2. | Logged `Restart limit reached (3/3 attempts)`. Halting auto-restart. Exited with code 2. | **PASS** |
| **TC-04** | Signal Handling & Safe Shutdown | Verify user `Ctrl+C` (`SIGINT`) triggers clean child reaping and leaves 0 zombies. | Launch with `./bin/stable_worker`, then `kill -INT <watchdog_pid>`. | Watchdog intercepts signal, sends SIGTERM to child, reaps with `waitpid()`, 0 zombies left. | Logged termination signal, reaped child PID, verified `ps -ef \| grep defunct` count is 0. | **PASS** |
| **TC-05** | Invalid Binary Execution | Verify handling when target executable does not exist. | `./bin/watchdog -- /bin/non_existent_binary_xyz123` | Child `execvp` fails, exits with code 127, watchdog logs error without hanging. | Caught exit code 127, logged execvp failure, handled gracefully. | **PASS** |
| **TC-06** | CLI Option Validation | Verify CLI parameter checking for invalid/negative values. | `./bin/watchdog --interval -5 -- ./bin/normal_worker` | Fails with clear validation error and non-zero exit status. | Printed `[ERROR] Invalid interval '-5': must be a positive integer.` Returned code 1. | **PASS** |
| **TC-07** | Linux `/proc` Inspection | Verify reading process metadata (State, Memory RSS, Threads) via `/proc`. | `./bin/watchdog --inspect-pid $$` | Outputs PID, Name, State, PPID, Memory RSS, Threads, and architectural notice. | Successfully retrieved `/proc/<PID>/status` details and printed notice. | **PASS** |
| **TC-08** | Log File Integrity | Verify plain-text logging with timestamps and uncolored file format. | Inspect generated `.log` file in `logs/` directory. | Each entry has ISO format `[YYYY-MM-DD HH:MM:SS] [LEVEL] msg`. | Verified exact regex match `^\[[0-9]{4}-[0-9]{2}-[0-9]{2} ...\]` across log files. | **PASS** |

---

## 2. Test Execution Details

### Automated Test Suite Execution Output
```text
==============================================================================
  OSSP BATCH 3 — PROCESS WATCHDOG AUTOMATED VALIDATION SUITE                
==============================================================================

Running Test 1: Normal Process Exit (No Unnecessary Restart)...
  [PASS] Test 1: Normal worker exit handled cleanly without unintended restart
Running Test 2: Crash Detection & Automatic Recovery...
  [PASS] Test 2: SIGSEGV crash detected and process successfully restarted
Running Test 3: Maximum Restart Limit Enforcement...
  [PASS] Test 3: Enforced maximum restart threshold (stopped after 3 failures)
Running Test 4: Safe Shutdown via Signal and Zombie Prevention...
  [PASS] Test 4: Watchdog caught SIGINT, safely reaped child, 0 zombies left
Running Test 5: Invalid Binary Execution Handling...
  [PASS] Test 5: Correctly caught execvp failure (POSIX code 127)
Running Test 6: CLI Argument Validation...
  [PASS] Test 6: CLI correctly validates input parameters and provides help
Running Test 7: Linux /proc Inspection Mode...
  [PASS] Test 7: Successfully inspected target PID via Linux /proc filesystem
Running Test 8: Log File Integrity & Timestamps...
  [PASS] Test 8: Log file contains structured ISO-like timestamps and entries

==============================================================================
  TOTAL TESTS: 8 | PASSED: 8 | FAILED: 0
==============================================================================

ALL TESTS PASSED SUCCESSFULLY! The Process Watchdog is rock solid.
```

---

## 3. Sample Log File Output (`logs/watchdog.log`)

```text
[2026-10-17 10:52:50] [INFO] ==========================================================
[2026-10-17 10:52:50] [INFO]    LINUX PROCESS WATCHDOG AND AUTO-RESTART SYSTEM         
[2026-10-17 10:52:50] [INFO]    OSSP Lab Project | Active Watchdog PID: 4512          
[2026-10-17 10:52:50] [INFO] ==========================================================
[2026-10-17 10:52:50] [INFO] Supervised Command: ./bin/crash_worker --delay 1 --type segfault
[2026-10-17 10:52:50] [INFO] Configuration: Interval=1s | Max Restarts=1 | Restart Delay=1s | Always Restart=NO
[2026-10-17 10:52:50] [INFO] Launching monitored process...
[2026-10-17 10:52:50] [SUCCESS] Process started with PID: 4513 (Parent Watchdog PID: 4512)
[2026-10-17 10:52:51] [WARN] Monitored process (PID: 4513) terminated unexpectedly by signal SIGSEGV (Segmentation fault).
[2026-10-17 10:52:51] [WARN] Termination reason: Process terminated by signal SIGSEGV (Segmentation fault)
[2026-10-17 10:52:51] [INFO] Auto-restart triggered [Attempt 1 of 1]
[2026-10-17 10:52:51] [INFO] Enforcing cool-off delay: waiting 1 second(s) before restart...
[2026-10-17 10:52:52] [INFO] Restarting monitored process...
[2026-10-17 10:52:52] [SUCCESS] Process restarted successfully with new PID: 4514 (Restart count: 1)
```

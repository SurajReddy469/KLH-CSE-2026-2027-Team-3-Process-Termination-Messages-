# OSSP Viva Voce Questions & Answers
## Linux Process Watchdog and Auto-Restart System
**Course:** Operating Systems and System Programming (OSSP)  
**Academic Batch:** Batch 3  
**Target Audience:** Undergraduate Computer Science / Engineering Students

---

### Category 1: Processes and Process Management

#### Q1. What is the fundamental difference between a program and a process?
**Answer:** A *program* is a passive collection of instructions stored on disk (an executable file). A *process* is an active instance of a program in execution, with its own allocated virtual address space, registers, program counter, stack, heap, and open file descriptors.

#### Q2. What are PID and PPID in Linux?
**Answer:**
- **PID (Process ID):** A unique positive integer assigned by the Linux kernel to identify every active process.
- **PPID (Parent Process ID):** The PID of the parent process that created this process via `fork()`. A child can discover its own PID with `getpid()` and its parent's PID with `getppid()`.

#### Q3. How does the `fork()` system call work in Linux?
**Answer:** `fork()` creates an exact duplicate of the calling process (the child). It is called once but returns twice:
- In the **parent process**, it returns the newly created child's PID.
- In the **child process**, it returns `0`.
- On **failure**, it returns `-1` and sets `errno`.

#### Q4. Why does the child process use `execvp()` instead of `system()`?
**Answer:**
- `execvp()` replaces the calling child process's address space directly with the new binary image without creating an unnecessary intermediate shell.
- `system()` invokes `/bin/sh -c`, which creates extra overhead, is vulnerable to shell command-injection attacks, and obscures the true child PID from the supervisor.

#### Q5. What happens if `execvp()` fails? Why do we call `_exit(127)` instead of `exit()`?
**Answer:** If `execvp()` fails (e.g. file not found or permission denied), it returns `-1`. The child must terminate immediately using `_exit()` rather than standard library `exit()` to avoid flushing or double-closing buffered I/O streams shared with the parent process. Code 127 is the standard POSIX exit status indicating command execution failure.

---

### Category 2: Process Termination and Zombies

#### Q6. What is a Zombie Process, and why is it dangerous?
**Answer:** A **zombie process** (Defunct process, state `Z`) is a process that has completed execution, but its exit entry remains in the kernel process table because its parent has not yet read its exit status via `wait()` or `waitpid()`. If zombies accumulate, they exhaust available PID slots in the operating system, preventing new processes from being launched.

#### Q7. How does the Watchdog prevent zombie processes?
**Answer:** The watchdog continuously invokes `waitpid()` to read the exit status of terminated child processes. When it reaps the termination status, the kernel immediately removes the child's entry from the process table, preventing zombies.

#### Q8. What is an Orphan Process, and how does Linux handle it?
**Answer:** An orphan process is a child whose parent terminated before the child finished. In modern Linux, orphan processes are automatically adopted by the system initialization daemon (`systemd` / PID 1 or a subreaper), which reaps them when they terminate.

#### Q9. What is the difference between `wait()` and `waitpid()`?
**Answer:**
- `wait(&status)` blocks until *any* child process terminates.
- `waitpid(pid, &status, options)` allows targeting a specific child PID and supports non-blocking polling via the `WNOHANG` flag, allowing the watchdog to perform periodic checks and remain responsive.

---

### Category 3: Termination Status Macros

#### Q10. What does the `status` integer from `waitpid()` contain?
**Answer:** The integer does not directly represent the exit code. Instead, it is an encoded bitmask populated by the kernel containing exit flags, termination signals, and core dump bits.

#### Q11. Explain `WIFEXITED` and `WEXITSTATUS`.
**Answer:**
- `WIFEXITED(status)`: Evaluates to true (non-zero) if the process terminated normally via `exit()` or `return` from `main()`.
- `WEXITSTATUS(status)`: Extracts the exit code (low-order 8 bits, 0–255) returned by the child.

#### Q12. Explain `WIFSIGNALED`, `WTERMSIG`, and `WCOREDUMP`.
**Answer:**
- `WIFSIGNALED(status)`: True if the child was terminated prematurely by an unhandled signal.
- `WTERMSIG(status)`: Extracts the signal number that caused the termination (e.g., 11 for `SIGSEGV`).
- `WCOREDUMP(status)`: Returns true if the kernel generated a core dump file for post-mortem debugging.

---

### Category 4: Signals and Asynchronous Signal Safety

#### Q13. What is a Signal in Linux?
**Answer:** A signal is an asynchronous software interrupt delivered by the kernel to a process to notify it of an event (e.g., illegal memory access, keyboard interrupt, or termination request).

#### Q14. What is the difference between `SIGINT`, `SIGTERM`, and `SIGKILL`?
**Answer:**
- `SIGINT` (Signal 2): Sent by the terminal when the user presses `Ctrl+C`. Can be caught, ignored, or blocked.
- `SIGTERM` (Signal 15): The standard polite request to terminate. It allows the program to clean up temporary files, flush logs, and exit gracefully.
- `SIGKILL` (Signal 9): Forceful termination by the kernel. It cannot be caught, ignored, or blocked, terminating the process immediately.

#### Q15. Why should `sigaction()` be used instead of `signal()`?
**Answer:** `signal()` has inconsistent, implementation-defined semantics across UNIX variants (e.g., whether signal handlers reset after being triggered). `sigaction()` is the robust POSIX standard, providing precise control over signal masks, flags (like `SA_RESTART`), and reentrancy.

#### Q16. What is Asynchronous Signal Safety?
**Answer:** A function is async-signal-safe if it can be safely called from inside a signal handler without causing deadlocks, memory corruption, or inconsistent state. Functions that allocate memory (`malloc`), use global buffers, or acquire mutex locks (such as `printf`) are **unsafe** inside signal handlers.

#### Q17. Why do we declare the shutdown flag as `volatile sig_atomic_t`?
**Answer:**
- `sig_atomic_t`: An integer type that can be read or written in a single atomic instruction, preventing partial reads/writes during signal interruption.
- `volatile`: Instructs the compiler not to optimize the variable into a CPU register, ensuring the CPU reads the updated value directly from memory in the main loop.

---

### Category 5: Watchdog Design & Supervision

#### Q18. How does the Watchdog distinguish between normal completion and a failure?
**Answer:**
- **Normal completion:** `WIFEXITED(status)` is true AND `WEXITSTATUS(status) == 0`. The worker completed its work successfully; by default, the watchdog terminates cleanly without restarting.
- **Abnormal failure:** `WEXITSTATUS(status) != 0` (application error) OR `WIFSIGNALED(status)` is true (crash such as Segmentation Fault). These trigger the auto-restart mechanism.

#### Q19. How does the system prevent infinite restart loops (thrashing)?
**Answer:** Through two mechanisms:
1. **Configurable Max Restarts (`--max-restarts N`):** Limits restart attempts to a threshold. When reached, the watchdog halts.
2. **Cool-off Delay (`--restart-delay SECONDS`):** Enforces a wait period before re-spawning, preventing high CPU utilization and thrashing.

#### Q20. What is the safe shutdown procedure when the user presses Ctrl+C?
**Answer:**
1. User presses `Ctrl+C`, delivering `SIGINT`.
2. The signal handler sets `g_shutdown_requested = 1`.
3. The main loop detects the flag and stops the restart cycle.
4. The watchdog sends `SIGTERM` to the child process.
5. It waits up to 2 seconds for the child to exit cleanly. If the child fails to exit, it sends `SIGKILL`.
6. It calls `waitpid()` to reap the child and closes the log file.

---

### Category 6: The Linux `/proc` Filesystem

#### Q21. What is the `/proc` filesystem in Linux?
**Answer:** `/proc` is a virtual pseudo-filesystem generated dynamically by the Linux kernel in memory. It provides a window into kernel data structures, system hardware, and real-time process metadata.

#### Q22. What information does the Watchdog extract from `/proc/<PID>/status`?
**Answer:** It extracts:
- `Name`: Executable name
- `State`: Execution state (`R` for Running, `S` for Sleeping, `Z` for Zombie)
- `PPid`: Parent Process ID
- `VmRSS`: Resident Set Size (physical memory currently consumed)
- `Threads`: Number of active threads

#### Q23. Why can't `waitpid()` be used to monitor arbitrary processes owned by other users or parents?
**Answer:** By POSIX architectural design, the kernel only delivers `SIGCHLD` and permits `waitpid()` to the **parent process** that created the child. Arbitrary processes can only be inspected via `/proc` or probed with `kill(pid, 0)`, but cannot be reaped to capture exact termination status or prevent zombies.

---

### Category 7: Error Handling and Toolchain

#### Q24. What does `kill(pid, 0)` do?
**Answer:** It does not send an actual signal. Instead, it performs error-checking to verify if a process with that PID exists and whether the calling process has permission to send signals to it.
- Returns `0`: Process exists.
- Returns `-1` with `ESRCH`: Process does not exist.
- Returns `-1` with `EPERM`: Process exists, but permission denied.

#### Q25. What is the purpose of the `-Wall -Wextra -Wpedantic` flags in the Makefile?
**Answer:**
- `-Wall`: Enables all common compiler warnings.
- `-Wextra`: Enables additional diagnostic warnings (e.g., unused parameters, sign comparisons).
- `-Wpedantic`: Enforces strict compliance with the ISO C standard, rejecting non-standard compiler extensions.

#### Q26. Why do we check for `errno == EINTR` after system calls?
**Answer:** Slow system calls (like `waitpid` or `read`) can be interrupted by a caught signal. When this happens, the call returns `-1` with `errno` set to `EINTR`. Checking `EINTR` allows the program to safely resume or re-evaluate loop conditions rather than treating the interruption as a fatal error.

#### Q27. What is Resident Set Size (VmRSS)?
**Answer:** `VmRSS` is the portion of a process's virtual memory that is currently held in physical RAM (pages loaded in memory), excluding swapped-out pages. It reflects the real memory footprint of the application.

#### Q28. What are the key industrial applications of a Process Watchdog?
**Answer:**
- Daemon supervisors (like systemd, runit, or supervisord).
- Embedded Linux and IoT devices where unattended 24/7 uptime is required.
- High-frequency trading and telecommunications servers where crashes must automatically recover in sub-second intervals.

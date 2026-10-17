/**
 * Linux Process Watchdog & Auto-Restart System
 * Interactive Web Application Engine
 * Batch 3 - Operating Systems and System Programming (OSSP)
 */

document.addEventListener('DOMContentLoaded', () => {
  initSimulator();
  initCliGenerator();
  initVivaHub();
  initCodeViewer();
  initQuickModal();
  initSmoothScroll();
});

/* ==============================================================================
   1. LIVE WATCHDOG SIMULATOR ENGINE
   ============================================================================== */

let simState = {
  running: false,
  parentPid: 5120,
  childPid: null,
  restartsCount: 0,
  maxRestarts: 3,
  restartDelay: 1.5,
  crashDelay: 2.0,
  alwaysRestart: false,
  workerPreset: 'crash_segfault',
  uptimeSeconds: 0,
  timerInterval: null,
  workerTimeout: null,
  heartbeatInterval: null,
  cooloffTimeout: null,
  zombiesCount: 0,
  reapedTotal: 0
};

function initSimulator() {
  const startBtn = document.getElementById('start-sim-btn');
  const stopBtn = document.getElementById('stop-sim-btn');
  const workerSelect = document.getElementById('worker-preset');
  const maxRestartsSlider = document.getElementById('max-restarts-slider');
  const maxRestartsVal = document.getElementById('max-restarts-val');
  const restartDelaySlider = document.getElementById('restart-delay-slider');
  const restartDelayVal = document.getElementById('restart-delay-val');
  const crashDelaySlider = document.getElementById('crash-delay-slider');
  const crashDelayVal = document.getElementById('crash-delay-val');
  const alwaysRestartToggle = document.getElementById('always-restart-toggle');
  const clearTermBtn = document.getElementById('clear-term-btn');
  const copyTermBtn = document.getElementById('copy-term-btn');
  const exportLogBtn = document.getElementById('export-log-btn');
  const sigButtons = document.querySelectorAll('.sig-btn');

  // Sliders binding
  maxRestartsSlider.addEventListener('input', (e) => {
    simState.maxRestarts = parseInt(e.target.value, 10);
    maxRestartsVal.textContent = `${simState.maxRestarts} attempts`;
    updateTopologyDisplay();
  });

  restartDelaySlider.addEventListener('input', (e) => {
    simState.restartDelay = parseFloat(e.target.value);
    restartDelayVal.textContent = `${simState.restartDelay}s`;
  });

  crashDelaySlider.addEventListener('input', (e) => {
    simState.crashDelay = parseFloat(e.target.value);
    crashDelayVal.textContent = `${simState.crashDelay}s`;
  });

  alwaysRestartToggle.addEventListener('change', (e) => {
    simState.alwaysRestart = e.target.checked;
  });

  workerSelect.addEventListener('change', (e) => {
    simState.workerPreset = e.target.value;
  });

  // Start / Stop handlers
  startBtn.addEventListener('click', startWatchdogSimulation);
  stopBtn.addEventListener('click', () => stopWatchdogSimulation(true));

  // Signal injection buttons
  sigButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sig = btn.getAttribute('data-sig');
      injectSignalIntoWorker(sig);
    });
  });

  // Terminal tool buttons
  clearTermBtn.addEventListener('click', () => {
    document.getElementById('term-stream').innerHTML = '';
    logToTerminal('SYSTEM', 'Console cleared.', 'term-system');
  });

  copyTermBtn.addEventListener('click', () => {
    const text = document.getElementById('term-stream').innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Terminal logs copied to clipboard!');
    });
  });

  exportLogBtn.addEventListener('click', () => {
    const text = document.getElementById('term-stream').innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchdog_${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function startWatchdogSimulation() {
  if (simState.running) return;

  simState.running = true;
  simState.restartsCount = 0;
  simState.uptimeSeconds = 0;
  simState.parentPid = Math.floor(Math.random() * 2000) + 4000;
  simState.childPid = null;

  // Toggle UI buttons
  document.getElementById('start-sim-btn').disabled = true;
  document.getElementById('stop-sim-btn').disabled = false;
  document.querySelectorAll('.sig-btn').forEach(b => b.disabled = false);
  document.getElementById('sim-status-badge').className = 'pill-badge active-supervising';
  document.getElementById('sim-status-badge').textContent = 'SUPERVISING';

  document.getElementById('parent-status-pill').className = 'node-status-pill status-ready';
  document.getElementById('parent-status-pill').textContent = 'ACTIVE SUPERVISOR';
  document.getElementById('parent-pid').textContent = simState.parentPid;

  // Start uptime stopwatch
  clearInterval(simState.timerInterval);
  simState.timerInterval = setInterval(() => {
    simState.uptimeSeconds++;
    const mins = String(Math.floor(simState.uptimeSeconds / 60)).padStart(2, '0');
    const secs = String(simState.uptimeSeconds % 60).padStart(2, '0');
    document.getElementById('sim-uptime').textContent = `${mins}:${secs}`;
  }, 1000);

  const cmdDesc = getWorkerCommandDescription(simState.workerPreset);
  logToTerminal('INFO', '==========================================================', 'badge-term-info');
  logToTerminal('INFO', '   LINUX PROCESS WATCHDOG AND AUTO-RESTART SYSTEM         ', 'badge-term-info');
  logToTerminal('INFO', `   Active Watchdog Supervisor PID: ${simState.parentPid}  `, 'badge-term-info');
  logToTerminal('INFO', '==========================================================', 'badge-term-info');
  logToTerminal('INFO', `Supervised Command: ${cmdDesc}`, 'badge-term-info');
  logToTerminal('INFO', `Configuration: Max Restarts=${simState.maxRestarts} | Delay=${simState.restartDelay}s | Always Restart=${simState.alwaysRestart ? 'YES' : 'NO'}`, 'badge-term-info');

  spawnWorkerProcess();
}

function spawnWorkerProcess() {
  if (!simState.running) return;

  // Assign child PID
  simState.childPid = simState.parentPid + 1 + simState.restartsCount;
  updateTopologyDisplay();

  // Pipe animation
  const pipePulse = document.getElementById('pipe-pulse');
  pipePulse.className = 'pipe-pulse pulsing';

  const cmdDesc = getWorkerCommandDescription(simState.workerPreset);
  logToTerminal('INFO', 'Watchdog calling fork() and execvp()...', 'badge-term-info');
  logToTerminal('SUCCESS', `Process started with PID: ${simState.childPid} (Parent Watchdog PID: ${simState.parentPid})`, 'badge-term-success');

  // Handle immediate execvp failure test case
  if (simState.workerPreset === 'invalid_cmd') {
    handleInvalidExecvp();
    return;
  }

  // Normal running state
  document.getElementById('child-node').className = 'proc-node child-node';
  document.getElementById('child-status-pill').className = 'node-status-pill status-running';
  document.getElementById('child-status-pill').textContent = 'RUNNING';
  document.getElementById('child-proc-state').textContent = 'State: R (running)';
  document.getElementById('child-rss-mem').textContent = '1,248 kB';

  logToTerminal('WORKER', `[WORKER ${simState.childPid}] Initialized workload task '${cmdDesc}'.`, 'term-worker');

  // Start heartbeat interval (/proc inspection)
  startHeartbeatInspection();

  // Schedule scheduled worker termination/crash
  scheduleWorkerEvent();
}

function startHeartbeatInspection() {
  clearInterval(simState.heartbeatInterval);
  simState.heartbeatInterval = setInterval(() => {
    if (!simState.running || !simState.childPid) return;
    const memVariation = Math.floor(Math.random() * 80) + 1200;
    document.getElementById('child-rss-mem').textContent = `${memVariation.toLocaleString()} kB`;
    logToTerminal('DEBUG', `Heartbeat check: PID: ${simState.childPid} | State: R (running) | Memory: ${memVariation} kB | Threads: 1`, 'badge-term-debug');
  }, 1200);
}

function scheduleWorkerEvent() {
  clearTimeout(simState.workerTimeout);
  const delayMs = simState.crashDelay * 1000;

  simState.workerTimeout = setTimeout(() => {
    if (!simState.running || !simState.childPid) return;

    switch (simState.workerPreset) {
      case 'crash_segfault':
        triggerCrashEvent('SIGSEGV (Segmentation fault)', 'signal', 11);
        break;
      case 'crash_fpe':
        triggerCrashEvent('SIGFPE (Floating point exception)', 'signal', 8);
        break;
      case 'crash_abort':
        triggerCrashEvent('SIGABRT (Aborted by assertion)', 'signal', 6);
        break;
      case 'crash_error':
        triggerCrashEvent('Exit code 42 (Application error)', 'exit_error', 42);
        break;
      case 'normal_worker':
        triggerNormalCompletion();
        break;
      case 'stable_worker':
        logToTerminal('WORKER', `[WORKER ${simState.childPid}] Healthy operation ongoing. Cycle complete.`, 'term-worker');
        scheduleWorkerEvent();
        break;
    }
  }, delayMs);
}

function triggerCrashEvent(reason, type, code) {
  if (!simState.running) return;

  clearInterval(simState.heartbeatInterval);
  const deadPid = simState.childPid;

  // Visual shake and alert
  const childNode = document.getElementById('child-node');
  childNode.className = 'proc-node child-node state-crashed';
  document.getElementById('child-status-pill').className = 'node-status-pill status-crashed';
  document.getElementById('child-status-pill').textContent = 'CRASHED';
  document.getElementById('child-proc-state').textContent = 'State: Z (defunct) -> REAPED';
  document.getElementById('pipe-pulse').className = 'pipe-pulse';

  logToTerminal('WARN', `Monitored process (PID: ${deadPid}) terminated unexpectedly! Reason: ${reason}`, 'badge-term-warn');
  logToTerminal('SUCCESS', `waitpid() successfully reaped PID: ${deadPid}. 0 zombies in process table.`, 'badge-term-success');

  // Check restart limit
  if (simState.restartsCount < simState.maxRestarts) {
    simState.restartsCount++;
    updateTopologyDisplay();

    logToTerminal('INFO', `Auto-restart triggered [Attempt ${simState.restartsCount} of ${simState.maxRestarts}]`, 'badge-term-info');
    logToTerminal('INFO', `Enforcing cool-off delay: waiting ${simState.restartDelay}s before restart...`, 'badge-term-info');

    document.getElementById('sim-status-badge').className = 'pill-badge active-delay';
    document.getElementById('sim-status-badge').textContent = `COOL-OFF (${simState.restartDelay}s)`;

    childNode.className = 'proc-node child-node state-restarting';
    document.getElementById('child-status-pill').className = 'node-status-pill status-delay';
    document.getElementById('child-status-pill').textContent = 'RESTARTING';

    clearTimeout(simState.cooloffTimeout);
    simState.cooloffTimeout = setTimeout(() => {
      if (simState.running) {
        document.getElementById('sim-status-badge').className = 'pill-badge active-supervising';
        document.getElementById('sim-status-badge').textContent = 'SUPERVISING';
        spawnWorkerProcess();
      }
    }, simState.restartDelay * 1000);

  } else {
    // Max restarts reached
    logToTerminal('ERROR', `Restart limit reached (${simState.restartsCount}/${simState.maxRestarts} attempts).`, 'badge-term-error');
    logToTerminal('ERROR', 'Halting auto-restart to prevent an infinite crash loop.', 'badge-term-error');
    logToTerminal('INFO', `Total restarts performed during this session: ${simState.restartsCount}`, 'badge-term-info');
    logToTerminal('SUCCESS', 'Watchdog stopped safely. Zero zombie processes remaining.', 'badge-term-success');

    stopWatchdogSimulation(false);
  }
}

function triggerNormalCompletion() {
  clearInterval(simState.heartbeatInterval);
  const pid = simState.childPid;

  logToTerminal('SUCCESS', `Monitored process (PID: ${pid}) completed execution normally with exit code 0.`, 'badge-term-success');
  logToTerminal('SUCCESS', `waitpid() reaped PID: ${pid} clean from process table.`, 'badge-term-success');

  if (simState.alwaysRestart) {
    if (simState.restartsCount < simState.maxRestarts) {
      simState.restartsCount++;
      updateTopologyDisplay();
      logToTerminal('INFO', `Policy --always-restart is active. Spawning next run after ${simState.restartDelay}s delay...`, 'badge-term-info');

      document.getElementById('sim-status-badge').className = 'pill-badge active-delay';
      document.getElementById('sim-status-badge').textContent = `COOL-OFF (${simState.restartDelay}s)`;

      setTimeout(() => {
        if (simState.running) spawnWorkerProcess();
      }, simState.restartDelay * 1000);
      return;
    }
  }

  logToTerminal('INFO', 'Target task completed successfully. Watchdog supervisor exiting normally.', 'badge-term-info');
  stopWatchdogSimulation(false);
}

function handleInvalidExecvp() {
  clearInterval(simState.heartbeatInterval);
  const deadPid = simState.childPid;
  logToTerminal('ERROR', `execvp: No such file or directory. Child failed to execute image.`, 'badge-term-error');
  logToTerminal('WARN', `Child process (PID: ${deadPid}) invoked _exit(127).`, 'badge-term-warn');
  logToTerminal('SUCCESS', `waitpid() reaped exit code 127. Watchdog prevented zombie process.`, 'badge-term-success');
  stopWatchdogSimulation(false);
}

function injectSignalIntoWorker(sigName) {
  if (!simState.running || !simState.childPid) {
    showToast('Watchdog is not currently running an active child process.');
    return;
  }

  logToTerminal('WARN', `[USER INJECTION] Sent signal ${sigName} directly to monitored worker PID: ${simState.childPid}`, 'badge-term-warn');

  if (sigName === 'SIGTERM' || sigName === 'SIGKILL' || sigName === 'SIGSEGV' || sigName === 'SIGFPE' || sigName === 'SIGABRT') {
    triggerCrashEvent(`${sigName} (External signal received)`, 'signal', 15);
  }
}

function stopWatchdogSimulation(isUserInterrupt) {
  simState.running = false;
  clearInterval(simState.timerInterval);
  clearInterval(simState.heartbeatInterval);
  clearTimeout(simState.workerTimeout);
  clearTimeout(simState.cooloffTimeout);

  if (isUserInterrupt) {
    logToTerminal('WARN', 'Caught SIGINT (Ctrl+C). Initiating graceful shutdown...', 'badge-term-warn');
    if (simState.childPid) {
      logToTerminal('INFO', `Sending SIGTERM to child process (PID: ${simState.childPid})...`, 'badge-term-info');
      logToTerminal('SUCCESS', `Child process (PID: ${simState.childPid}) terminated cleanly. Reaped via waitpid().`, 'badge-term-success');
    }
    logToTerminal('SUCCESS', 'Zero zombie processes remaining. Watchdog shutdown complete.', 'badge-term-success');
  }

  // UI teardown
  document.getElementById('start-sim-btn').disabled = false;
  document.getElementById('stop-sim-btn').disabled = true;
  document.querySelectorAll('.sig-btn').forEach(b => b.disabled = true);
  document.getElementById('sim-status-badge').className = 'pill-badge';
  document.getElementById('sim-status-badge').textContent = 'STANDBY';

  document.getElementById('parent-status-pill').className = 'node-status-pill status-ready';
  document.getElementById('parent-status-pill').textContent = 'IDLE';

  document.getElementById('child-status-pill').className = 'node-status-pill status-dormant';
  document.getElementById('child-status-pill').textContent = 'OFFLINE';
  document.getElementById('child-proc-state').textContent = 'State: Offline';
  document.getElementById('child-rss-mem').textContent = '0 kB';
  document.getElementById('pipe-pulse').className = 'pipe-pulse';
}

function updateTopologyDisplay() {
  document.getElementById('child-pid').textContent = simState.childPid || '--';
  document.getElementById('child-ppid').textContent = simState.parentPid;
  document.getElementById('restarts-count').textContent = `${simState.restartsCount} / ${simState.maxRestarts}`;
  document.getElementById('child-cmd-display').textContent = getWorkerCommandDescription(simState.workerPreset);
}

function getWorkerCommandDescription(preset) {
  switch (preset) {
    case 'crash_segfault': return './bin/crash_worker --segfault';
    case 'crash_fpe': return './bin/crash_worker --div-zero';
    case 'crash_abort': return './bin/crash_worker --abort';
    case 'crash_error': return './bin/crash_worker --exit 42';
    case 'normal_worker': return './bin/normal_worker --iterations 1';
    case 'stable_worker': return './bin/stable_worker';
    case 'invalid_cmd': return '/usr/bin/nonexistent_command';
    default: return './bin/crash_worker';
  }
}

function logToTerminal(level, message, badgeClass) {
  const stream = document.getElementById('term-stream');
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  const line = document.createElement('div');
  line.className = 'term-line';
  line.innerHTML = `<span class="term-time">[${timeStr}]</span> <span class="${badgeClass}">[${level}]</span> ${escapeHtml(message)}`;
  stream.appendChild(line);
  stream.scrollTop = stream.scrollHeight;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/* ==============================================================================
   2. CLI COMMAND BUILDER & GENERATOR
   ============================================================================== */

function initCliGenerator() {
  const targetCmd = document.getElementById('cli-target-cmd');
  const restarts = document.getElementById('cli-restarts');
  const delay = document.getElementById('cli-delay');
  const interval = document.getElementById('cli-interval');
  const logfile = document.getElementById('cli-logfile');
  const alwaysRestart = document.getElementById('cli-always-restart');
  const copyBtn = document.getElementById('copy-cli-btn');
  const copyQuickstartBtn = document.getElementById('copy-quickstart-btn');

  const updateGeneratedCli = () => {
    let parts = ['wsl ./bin/watchdog'];

    const r = restarts.value.trim();
    if (r !== '' && r !== '5') {
      parts.push(`--max-restarts ${r}`);
    }

    const d = delay.value.trim();
    if (d !== '' && d !== '2') {
      parts.push(`--restart-delay ${d}`);
    }

    const i = interval.value.trim();
    if (i !== '' && i !== '1') {
      parts.push(`--interval ${i}`);
    }

    const l = logfile.value.trim();
    if (l !== '' && l !== 'logs/watchdog.log') {
      parts.push(`--log ${l}`);
    }

    if (alwaysRestart.checked) {
      parts.push('--always-restart');
    }

    const cmd = targetCmd.value.trim() || './bin/crash_worker --segfault';
    parts.push(`-- ${cmd}`);

    const fullCmd = parts.join(' ');
    document.getElementById('generated-cli-cmd').textContent = fullCmd;

    // Update list breakdown
    const list = document.getElementById('cli-breakdown-list');
    list.innerHTML = `
      <li><code class="inline-code">--max-restarts ${r}</code>: Halts supervisor after ${r} consecutive failures.</li>
      <li><code class="inline-code">--restart-delay ${d}</code>: Waits ${d} second(s) between restart attempts.</li>
      <li><code class="inline-code">--interval ${i}</code>: Queries Linux /proc health status every ${i} second(s).</li>
      <li><code class="inline-code">--log ${l}</code>: Dual-stream ISO timestamped audit logs destination.</li>
      ${alwaysRestart.checked ? '<li><code class="inline-code">--always-restart</code>: Enforces recovery even on exit code 0.</li>' : ''}
      <li><code class="inline-code">--</code>: POSIX argument separator marking the start of the target command.</li>
    `;
  };

  [targetCmd, restarts, delay, interval, logfile, alwaysRestart].forEach(el => {
    el.addEventListener('input', updateGeneratedCli);
    el.addEventListener('change', updateGeneratedCli);
  });

  copyBtn.addEventListener('click', () => {
    const cmd = document.getElementById('generated-cli-cmd').textContent;
    navigator.clipboard.writeText(cmd).then(() => {
      document.getElementById('copy-cli-text').textContent = 'Copied!';
      setTimeout(() => {
        document.getElementById('copy-cli-text').textContent = 'Copy Command';
      }, 2000);
      showToast('Command copied to clipboard!');
    });
  });

  if (copyQuickstartBtn) {
    copyQuickstartBtn.addEventListener('click', () => {
      const qCmd = 'wsl make test';
      navigator.clipboard.writeText(qCmd).then(() => {
        document.getElementById('quickstart-text').textContent = 'Copied: wsl make test';
        setTimeout(() => {
          document.getElementById('quickstart-text').textContent = 'Copy Run Command';
        }, 2200);
        showToast('Copied: wsl make test');
      });
    });
  }

  updateGeneratedCli();
}

/* ==============================================================================
   3. OSSP VIVA VOCE & TECHNICAL INTERVIEW HUB
   ============================================================================== */

const VIVA_DATA = [
  {
    id: 1,
    cat: 'processes',
    q: 'What is the fundamental difference between a program and a process?',
    a: 'A <strong>program</strong> is a passive collection of machine instructions stored statically on disk (an executable ELF file). A <strong>process</strong> is an active instance of a program in execution, with its own allocated virtual address space, CPU registers, Program Counter, stack, heap, and kernel process control block (PCB) with file descriptors.'
  },
  {
    id: 2,
    cat: 'processes',
    q: 'What are PID and PPID in Linux?',
    a: '<strong>PID (Process ID)</strong> is a unique positive integer assigned by the Linux kernel to identify every active process. <strong>PPID (Parent Process ID)</strong> is the PID of the parent process that created it via <code>fork()</code>. A child queries its PID with <code>getpid()</code> and parent PID with <code>getppid()</code>.'
  },
  {
    id: 3,
    cat: 'processes',
    q: 'How does the fork() system call work in Linux?',
    a: '<code>fork()</code> creates an exact copy of the calling process. It is called once by the parent but returns twice: it returns the newly created child\'s PID to the parent, returns <code>0</code> inside the newly spawned child, and returns <code>-1</code> on failure while setting <code>errno</code>.'
  },
  {
    id: 4,
    cat: 'processes',
    q: 'Why does the child process use execvp() instead of system()?',
    a: '<code>execvp()</code> directly overlays and replaces the calling child process\'s address space with the new binary image without creating an unnecessary intermediate shell. <code>system()</code> executes <code>/bin/sh -c</code>, which adds unnecessary overhead, is vulnerable to shell command injection attacks, and hides the true child PID from the supervisor.'
  },
  {
    id: 5,
    cat: 'processes',
    q: 'What happens if execvp() fails? Why call _exit(127) instead of exit()?',
    a: 'If <code>execvp()</code> fails (e.g. file not found or permission denied), it returns -1. The child must terminate immediately using <code>_exit()</code> rather than standard <code>exit()</code> to avoid double-flushing buffered I/O streams shared with the parent. Code 127 is the standard POSIX exit status indicating command execution failure.'
  },
  {
    id: 6,
    cat: 'zombies',
    q: 'What is a Zombie Process, and why is it dangerous?',
    a: 'A <strong>zombie process</strong> (state <code>Z</code>, defunct) is a process that has completed execution, but its exit entry remains in the kernel process table because its parent has not yet read its exit status via <code>wait()</code> or <code>waitpid()</code>. If zombies accumulate, they exhaust available PID slots in the OS, preventing new processes from being launched.'
  },
  {
    id: 7,
    cat: 'zombies',
    q: 'How does the Watchdog prevent zombie processes?',
    a: 'The watchdog continuously invokes <code>waitpid()</code> to collect the exit status of terminated child processes. When it reaps the termination status, the kernel removes the child\'s entry from the process table, guaranteeing <strong>zero zombie processes</strong>.'
  },
  {
    id: 8,
    cat: 'zombies',
    q: 'What is an Orphan Process, and how does Linux handle it?',
    a: 'An orphan process is a child whose parent terminated before the child finished. In modern Linux, orphan processes are automatically adopted by the system initialization daemon (<code>systemd</code> / PID 1 or a subreaper), which reaps them when they terminate.'
  },
  {
    id: 9,
    cat: 'zombies',
    q: 'What is the difference between wait() and waitpid()?',
    a: '<code>wait(&status)</code> blocks until <em>any</em> child process terminates. <code>waitpid(pid, &status, options)</code> allows targeting a specific child PID and supports non-blocking polling via the <code>WNOHANG</code> flag, allowing the watchdog to perform periodic checks and remain responsive.'
  },
  {
    id: 10,
    cat: 'macros',
    q: 'What does the status integer from waitpid() contain?',
    a: 'The integer does not directly represent the exit code. Instead, it is an encoded bitmask populated by the kernel containing exit flags, termination signals, and core dump bits that must be unpacked using POSIX macros.'
  },
  {
    id: 11,
    cat: 'macros',
    q: 'Explain WIFEXITED and WEXITSTATUS.',
    a: '<code>WIFEXITED(status)</code> evaluates to true (non-zero) if the process terminated normally via <code>exit()</code> or returning from <code>main()</code>. <code>WEXITSTATUS(status)</code> extracts the actual 8-bit exit code (0–255).'
  },
  {
    id: 12,
    cat: 'macros',
    q: 'Explain WIFSIGNALED, WTERMSIG, and WCOREDUMP.',
    a: '<code>WIFSIGNALED(status)</code> returns true if the process was terminated by an unhandled signal. <code>WTERMSIG(status)</code> extracts the signal number (e.g. 11 for SIGSEGV). <code>WCOREDUMP(status)</code> indicates whether a core dump file was generated.'
  },
  {
    id: 13,
    cat: 'signals',
    q: 'What is a Signal in Linux?',
    a: 'A signal is an asynchronous software interrupt delivered by the kernel to a process to notify it of an event (e.g., hardware fault, user interruption, or timer expiration).'
  },
  {
    id: 14,
    cat: 'signals',
    q: 'Why use sigaction() instead of the legacy signal() function?',
    a: '<code>sigaction()</code> provides reliable, standard POSIX semantics with fine-grained control: signal masks prevent race conditions, flags like <code>SA_RESTART</code> manage interrupted system calls, and behavior is consistent across all Unix platforms.'
  },
  {
    id: 15,
    cat: 'signals',
    q: 'What is an Asynchronous Signal-Safe function?',
    a: 'An async-signal-safe function can be safely called from inside a signal handler without causing deadlocks, race conditions, or memory corruption. Functions like <code>printf()</code>, <code>malloc()</code>, and <code>exit()</code> use internal locks and static buffers, and are therefore <strong>unsafe</strong> inside signal handlers.'
  },
  {
    id: 16,
    cat: 'signals',
    q: 'Why is the shutdown flag declared as volatile sig_atomic_t?',
    a: '<code>sig_atomic_t</code> is an integer type guaranteed to be accessed and modified in a single atomic CPU instruction. <code>volatile</code> prevents the compiler from optimizing variable reads into CPU registers, ensuring changes made by the signal handler are visible to the main loop.'
  },
  {
    id: 17,
    cat: 'signals',
    q: 'What is the difference between SIGINT, SIGTERM, and SIGKILL?',
    a: '<strong>SIGINT (2)</strong>: Interactive interrupt sent from terminal via Ctrl+C. <strong>SIGTERM (15)</strong>: Polite termination request that can be caught or ignored. <strong>SIGKILL (9)</strong>: Unconditional, immediate termination handled strictly by the kernel; cannot be caught, blocked, or ignored.'
  },
  {
    id: 18,
    cat: 'watchdog',
    q: 'What is a Process Watchdog, and why is it important in production?',
    a: 'A process watchdog is a supervisory software component that continuously monitors the health and execution state of critical processes, automatically restarting them upon failure to ensure high system availability without manual operator intervention.'
  },
  {
    id: 19,
    cat: 'watchdog',
    q: 'What is a crash loop, and how does the Watchdog prevent it?',
    a: 'A <strong>crash loop</strong> occurs when a process crashes immediately upon startup (e.g. bad config), causing a naive supervisor to restart it indefinitely in a rapid loop, saturating CPU and disk. The watchdog prevents this using a configurable maximum restart limit (<code>--max-restarts</code>) and cool-off delay (<code>--restart-delay</code>).'
  },
  {
    id: 20,
    cat: 'watchdog',
    q: 'How does the Watchdog differentiate a normal completion from a crash?',
    a: 'Using <code>waitpid()</code>: If <code>WIFEXITED(status) && WEXITSTATUS(status) == 0</code>, the worker finished successfully and the watchdog terminates cleanly. If <code>WEXITSTATUS != 0</code> or <code>WIFSIGNALED(status)</code>, it recognizes an abnormal failure and initiates recovery.'
  },
  {
    id: 21,
    cat: 'watchdog',
    q: 'How does the Watchdog safely shut down when interrupted?',
    a: 'Upon receiving SIGINT or SIGTERM, the watchdog enters shutdown mode: it politely delivers <code>SIGTERM</code> to the child, waits up to a timeout, escalates to <code>SIGKILL</code> if unresponsive, and reaps the child with <code>waitpid()</code> to eliminate zombies.'
  },
  {
    id: 22,
    cat: 'watchdog',
    q: 'What information does the Watchdog extract from /proc/<pid>/status?',
    a: 'It reads the virtual file system to extract the process Name, execution State (R: running, S: sleeping, Z: zombie), Peak/Current RSS memory consumption, and active thread count.'
  }
];

function initVivaHub() {
  const container = document.getElementById('viva-accordion-container');
  const searchInput = document.getElementById('viva-search');
  const chipButtons = document.querySelectorAll('.chip-btn');

  let activeCategory = 'all';
  let searchTerm = '';

  const renderQuestions = () => {
    container.innerHTML = '';

    const filtered = VIVA_DATA.filter(item => {
      const matchesCat = (activeCategory === 'all' || item.cat === activeCategory);
      const matchesSearch = searchTerm === '' ||
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--text-dim);">No viva questions match your search query.</div>`;
      return;
    }

    filtered.forEach(item => {
      const el = document.createElement('div');
      el.className = 'viva-item';
      el.innerHTML = `
        <div class="viva-question-header" tabindex="0" role="button">
          <div class="viva-q-text">
            <span class="viva-badge-q">Q${item.id}</span>
            <span>${item.q}</span>
          </div>
          <i class="fa-solid fa-chevron-down viva-chevron"></i>
        </div>
        <div class="viva-answer-body">
          <div class="viva-answer-content">${item.a}</div>
        </div>
      `;

      const header = el.querySelector('.viva-question-header');
      header.addEventListener('click', () => {
        el.classList.toggle('open');
      });

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.classList.toggle('open');
        }
      });

      container.appendChild(el);
    });
  };

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderQuestions();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderQuestions();
  });

  renderQuestions();
}

/* ==============================================================================
   4. MODULAR C SOURCE CODE VIEWER
   ============================================================================== */

const CODE_SNIPPETS = {
  'watchdog.c': `// src/watchdog.c - Core Supervision Loop and Backoff
#define _POSIX_C_SOURCE 200809L
#include "watchdog.h"
#include "process_manager.h"
#include "signal_handler.h"
#include "logger.h"

int watchdog_run(const watchdog_config_t *config) {
    int restart_count = 0;
    
    while (!signal_handler_is_shutdown_requested()) {
        pid_t child_pid = process_spawn(config->cmd_argv);
        if (child_pid <= 0) {
            logger_log(LOG_LEVEL_ERROR, "Failed to spawn target process.");
            return -1;
        }

        process_wait_result_t result;
        while (!signal_handler_is_shutdown_requested()) {
            result = process_check_status(child_pid);
            if (result.status != PROCESS_RUNNING) {
                break; // Process terminated
            }
            interruptible_sleep(config->interval_seconds);
        }

        // Discriminate termination reason
        if (result.status == PROCESS_EXITED && result.exit_code == 0 && !config->always_restart) {
            logger_log(LOG_LEVEL_SUCCESS, "Worker exited cleanly (code 0). Stopping.");
            break;
        }

        // Enforce crash-loop limits
        if (config->max_restarts >= 0 && restart_count >= config->max_restarts) {
            logger_log(LOG_LEVEL_ERROR, "Max restart threshold reached. Halting.");
            break;
        }

        restart_count++;
        interruptible_sleep(config->restart_delay_seconds);
    }
    return 0;
}`,
  'process_manager.c': `// src/process_manager.c - Process Spawning, Non-blocking waitpid & /proc
#define _POSIX_C_SOURCE 200809L
#include "process_manager.h"
#include <unistd.h>
#include <sys/wait.h>

pid_t process_spawn(char *const argv[]) {
    pid_t pid = fork();
    if (pid < 0) return -1;

    if (pid == 0) {
        // Child Process: execute binary directly
        execvp(argv[0], argv);
        _exit(127); // Standard POSIX execvp failure code
    }

    return pid; // Parent receives child PID
}

process_wait_result_t process_check_status(pid_t pid) {
    process_wait_result_t res = {0};
    int status;
    pid_t w = waitpid(pid, &status, WNOHANG);

    if (w == 0) {
        res.status = PROCESS_RUNNING;
    } else if (w == pid) {
        if (WIFEXITED(status)) {
            res.status = PROCESS_EXITED;
            res.exit_code = WEXITSTATUS(status);
        } else if (WIFSIGNALED(status)) {
            res.status = PROCESS_CRASHED;
            res.term_signal = WTERMSIG(status);
        }
    }
    return res;
}`,
  'signal_handler.c': `// src/signal_handler.c - Async Signal Safe Handler
#define _POSIX_C_SOURCE 200809L
#include "signal_handler.h"
#include <signal.h>

static volatile sig_atomic_t g_shutdown_requested = 0;

static void handle_signal(int signum) {
    (void)signum;
    // Async-signal safe: atomic write only
    g_shutdown_requested = 1;
}

int signal_handler_init(void) {
    struct sigaction sa;
    sa.sa_handler = handle_signal;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;

    sigaction(SIGINT, &sa, NULL);
    sigaction(SIGTERM, &sa, NULL);
    return 0;
}

int signal_handler_is_shutdown_requested(void) {
    return g_shutdown_requested != 0;
}`,
  'logger.c': `// src/logger.c - Dual-Stream Logging (Terminal & File)
#define _POSIX_C_SOURCE 200809L
#include "logger.h"
#include <stdio.h>
#include <time.h>

void logger_log(logger_level_t level, const char *format, ...) {
    time_t rawtime;
    struct tm *timeinfo;
    char time_buffer[32];

    time(&rawtime);
    timeinfo = localtime(&rawtime);
    strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", timeinfo);

    // Format message with timestamp
    // Outputs to stdout with ANSI color badges
    // Writes plain unbuffered text to log file
}`,
  'main.c': `// src/main.c - CLI Options & Subcommand Parsing
#define _POSIX_C_SOURCE 200809L
#include "watchdog.h"
#include <getopt.h>

int main(int argc, char *argv[]) {
    watchdog_config_t config = {
        .interval_seconds = 1,
        .max_restarts = 5,
        .restart_delay_seconds = 2,
        .log_file = "logs/watchdog.log",
        .always_restart = 0
    };

    // Parse options via getopt_long()
    // Validate inputs & dispatch to watchdog_run()
    return watchdog_run(&config);
}`
};

function initCodeViewer() {
  const codeContent = document.getElementById('code-content');
  const activeFilename = document.getElementById('active-filename');
  const tabs = document.querySelectorAll('.code-tab-btn');
  const copyBtn = document.getElementById('copy-code-btn');

  const setCode = (filename) => {
    activeFilename.innerHTML = `<i class="fa-regular fa-file-code"></i> src/${filename}`;
    codeContent.textContent = CODE_SNIPPETS[filename] || '// Code snippet unavailable.';
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const file = tab.getAttribute('data-file');
      setCode(file);
    });
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeContent.textContent).then(() => {
      showToast('Source code copied to clipboard!');
    });
  });

  setCode('watchdog.c');
}

/* ==============================================================================
   5. QUICK COMMANDS MODAL & UTILS
   ============================================================================== */

function initQuickModal() {
  const modal = document.getElementById('quick-modal');
  const openBtn = document.getElementById('quick-run-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const copySnippetBtns = document.querySelectorAll('.copy-snippet-btn');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  copySnippetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const code = document.getElementById(targetId).textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
        showToast('Command copied to clipboard!');
      });
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function showToast(msg) {
  let toast = document.getElementById('custom-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = '#00f2fe';
    toast.style.color = '#050811';
    toast.style.padding = '0.75rem 1.4rem';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = '700';
    toast.style.fontFamily = 'var(--font-sans)';
    toast.style.boxShadow = '0 10px 25px rgba(0, 242, 254, 0.4)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.5rem';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${escapeHtml(msg)}`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2500);
}

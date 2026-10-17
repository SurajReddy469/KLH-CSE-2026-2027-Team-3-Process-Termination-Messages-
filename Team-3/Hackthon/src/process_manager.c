#define _POSIX_C_SOURCE 200809L

#include "process_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <signal.h>
#include <errno.h>
#include <time.h>

void process_get_signal_name(int signum, char *buffer, size_t buflen) {
    if (buffer == NULL || buflen == 0) return;

    const char *name = "UNKNOWN";
    switch (signum) {
        case SIGHUP:  name = "SIGHUP (Hangup)"; break;
        case SIGINT:  name = "SIGINT (Interrupt)"; break;
        case SIGQUIT: name = "SIGQUIT (Quit)"; break;
        case SIGILL:  name = "SIGILL (Illegal instruction)"; break;
        case SIGTRAP: name = "SIGTRAP (Trace/breakpoint trap)"; break;
        case SIGABRT: name = "SIGABRT (Aborted)"; break;
        case SIGBUS:  name = "SIGBUS (Bus error)"; break;
        case SIGFPE:  name = "SIGFPE (Floating point exception)"; break;
        case SIGKILL: name = "SIGKILL (Killed)"; break;
        case SIGUSR1: name = "SIGUSR1 (User-defined signal 1)"; break;
        case SIGSEGV: name = "SIGSEGV (Segmentation fault)"; break;
        case SIGUSR2: name = "SIGUSR2 (User-defined signal 2)"; break;
        case SIGPIPE: name = "SIGPIPE (Broken pipe)"; break;
        case SIGALRM: name = "SIGALRM (Alarm clock)"; break;
        case SIGTERM: name = "SIGTERM (Terminated)"; break;
        case SIGCHLD: name = "SIGCHLD (Child status changed)"; break;
        case SIGSTOP: name = "SIGSTOP (Stopped)"; break;
        case SIGTSTP: name = "SIGTSTP (Terminal stop)"; break;
        default: {
            const char *sys_sig = strsignal(signum);
            if (sys_sig != NULL) {
                snprintf(buffer, buflen, "Signal %d (%s)", signum, sys_sig);
                return;
            }
            break;
        }
    }
    snprintf(buffer, buflen, "%s", name);
}

pid_t process_spawn(char *const argv[]) {
    if (argv == NULL || argv[0] == NULL) {
        return -1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        /* Fork failed */
        return -1;
    }

    if (pid == 0) {
        /* Child process execution context */
        /* Execute binary using execvp - searches PATH if no slash present */
        execvp(argv[0], argv);

        /* If execvp returns, an error occurred */
        fprintf(stderr, "[ERROR] execvp failed for '%s': %s\n", argv[0], strerror(errno));
        fflush(stderr);
        _exit(127); /* POSIX standard exit code for command execution failure */
    }

    /* Parent process context returns child PID */
    return pid;
}

proc_status_t process_check_child(pid_t pid, proc_termination_info_t *info) {
    if (info != NULL) {
        memset(info, 0, sizeof(*info));
    }

    int status = 0;
    /* Non-blocking query of child status */
    pid_t result = waitpid(pid, &status, WNOHANG | WUNTRACED | WCONTINUED);

    if (result == 0) {
        /* Child is still executing normally */
        if (info != NULL) {
            info->status = PROC_STATUS_RUNNING;
            snprintf(info->description, sizeof(info->description), "Process is running");
        }
        return PROC_STATUS_RUNNING;
    }

    if (result == -1) {
        if (errno == EINTR) {
            /* Interrupted by a caught signal */
            if (info != NULL) {
                info->status = PROC_STATUS_RUNNING;
            }
            return PROC_STATUS_RUNNING;
        }
        if (errno == ECHILD) {
            if (info != NULL) {
                info->status = PROC_STATUS_NOT_FOUND;
                snprintf(info->description, sizeof(info->description), "Process not found (already reaped or not child)");
            }
            return PROC_STATUS_NOT_FOUND;
        }
        if (info != NULL) {
            info->status = PROC_STATUS_ERROR;
            snprintf(info->description, sizeof(info->description), "waitpid error: %s", strerror(errno));
        }
        return PROC_STATUS_ERROR;
    }

    /* Process terminated or changed state (result == pid) */
    if (info == NULL) {
        if (WIFEXITED(status)) {
            return (WEXITSTATUS(status) == 0) ? PROC_STATUS_EXITED_NORMAL : PROC_STATUS_EXITED_ERROR;
        }
        if (WIFSIGNALED(status)) {
            return PROC_STATUS_KILLED_SIGNAL;
        }
        return PROC_STATUS_STOPPED;
    }

    if (WIFEXITED(status)) {
        info->exit_code = WEXITSTATUS(status);
        if (info->exit_code == 0) {
            info->status = PROC_STATUS_EXITED_NORMAL;
            snprintf(info->description, sizeof(info->description), "Process exited normally with code 0");
        } else {
            info->status = PROC_STATUS_EXITED_ERROR;
            snprintf(info->description, sizeof(info->description), "Process exited with failure code %d", info->exit_code);
        }
    } else if (WIFSIGNALED(status)) {
        info->status = PROC_STATUS_KILLED_SIGNAL;
        info->signal_num = WTERMSIG(status);
#ifdef WCOREDUMP
        info->core_dumped = WCOREDUMP(status);
#else
        info->core_dumped = false;
#endif
        process_get_signal_name(info->signal_num, info->signal_name, sizeof(info->signal_name));
        snprintf(info->description, sizeof(info->description),
                 "Process terminated by signal %s%s",
                 info->signal_name, info->core_dumped ? " (core dumped)" : "");
    } else if (WIFSTOPPED(status)) {
        info->status = PROC_STATUS_STOPPED;
        info->signal_num = WSTOPSIG(status);
        snprintf(info->description, sizeof(info->description), "Process stopped by signal %d", info->signal_num);
    } else {
        info->status = PROC_STATUS_ERROR;
        snprintf(info->description, sizeof(info->description), "Unknown state change (raw status: 0x%x)", status);
    }

    return info->status;
}

int process_exists(pid_t pid) {
    if (pid <= 0) return 0;
    if (kill(pid, 0) == 0) {
        return 1;
    }
    if (errno == EPERM) {
        return -1; /* Exists but no permission to signal */
    }
    return 0; /* ESRCH: No such process */
}

int process_terminate_gracefully(pid_t pid, int timeout_seconds) {
    if (pid <= 0) return 0;

    /* First check if process is already dead or reaped */
    int status = 0;
    pid_t res = waitpid(pid, &status, WNOHANG);
    if (res == pid || (res == -1 && errno == ECHILD)) {
        return 0; /* Already terminated and reaped */
    }

    /* Send SIGTERM to request polite termination */
    if (kill(pid, SIGTERM) == -1) {
        if (errno == ESRCH) {
            /* Process died already; reap if possible */
            waitpid(pid, &status, WNOHANG);
            return 0;
        }
    }

    /* Wait up to timeout_seconds (in increments of 50ms) */
    int max_iterations = timeout_seconds * 20;
    struct timespec ts;
    ts.tv_sec = 0;
    ts.tv_nsec = 50000000; /* 50 ms */

    for (int i = 0; i < max_iterations; i++) {
        res = waitpid(pid, &status, WNOHANG);
        if (res == pid || (res == -1 && errno == ECHILD)) {
            return 0; /* Cleanly exited and reaped */
        }
        nanosleep(&ts, NULL);
    }

    /* If still running after timeout, escalate to SIGKILL */
    kill(pid, SIGKILL);

    /* Blocking wait to guarantee child process is reaped (no zombie) */
    while (waitpid(pid, &status, 0) == -1) {
        if (errno == EINTR) continue; /* Retry on signal interrupt */
        if (errno == ECHILD) break;   /* Reaped by another handler or already gone */
        break;
    }

    return 0;
}

int process_read_proc_info(pid_t pid, char *out_buffer, size_t max_len) {
    if (out_buffer == NULL || max_len == 0) return -1;

    char path[256];
    snprintf(path, sizeof(path), "/proc/%d/status", (int)pid);

    FILE *f = fopen(path, "r");
    if (!f) {
        return -1;
    }

    char line[256];
    char name[128] = "Unknown";
    char state[128] = "Unknown";
    char ppid_str[64] = "Unknown";
    char vmrss[64] = "0 kB";
    char threads[64] = "1";

    while (fgets(line, sizeof(line), f)) {
        if (strncmp(line, "Name:", 5) == 0) {
            sscanf(line + 5, "%127s", name);
        } else if (strncmp(line, "State:", 6) == 0) {
            char *s = line + 6;
            while (*s == ' ' || *s == '\t') s++;
            /* Remove newline */
            char *nl = strchr(s, '\n');
            if (nl) *nl = '\0';
            snprintf(state, sizeof(state), "%.127s", s);
        } else if (strncmp(line, "PPid:", 5) == 0) {
            sscanf(line + 5, "%63s", ppid_str);
        } else if (strncmp(line, "VmRSS:", 6) == 0) {
            char *s = line + 6;
            while (*s == ' ' || *s == '\t') s++;
            char *nl = strchr(s, '\n');
            if (nl) *nl = '\0';
            snprintf(vmrss, sizeof(vmrss), "%.63s", s);
        } else if (strncmp(line, "Threads:", 8) == 0) {
            sscanf(line + 8, "%63s", threads);
        }
    }
    fclose(f);

    /* Also try to read cmdline */
    char cmdline[256] = "";
    snprintf(path, sizeof(path), "/proc/%d/cmdline", (int)pid);
    FILE *fcmd = fopen(path, "r");
    if (fcmd) {
        size_t n = fread(cmdline, 1, sizeof(cmdline) - 1, fcmd);
        cmdline[n] = '\0';
        /* /proc/<pid>/cmdline uses null bytes to separate args */
        for (size_t i = 0; i < n; i++) {
            if (cmdline[i] == '\0' && i + 1 < n) {
                cmdline[i] = ' ';
            }
        }
        fclose(fcmd);
    }

    snprintf(out_buffer, max_len,
             "PID: %d | Name: %s | State: %s | PPID: %s | Memory (RSS): %s | Threads: %s%s%s",
             (int)pid, name, state, ppid_str, vmrss, threads,
             (cmdline[0] != '\0' ? " | Command: " : ""), cmdline);

    return 0;
}

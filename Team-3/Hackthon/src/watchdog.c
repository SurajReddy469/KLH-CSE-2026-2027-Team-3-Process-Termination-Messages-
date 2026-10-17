#define _POSIX_C_SOURCE 200809L

#include "watchdog.h"
#include "process_manager.h"
#include "signal_handler.h"
#include "logger.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <errno.h>

/* Helper for interruptible sleep in increments of 50ms */
static void interruptible_sleep(int seconds) {
    if (seconds <= 0) return;
    int slices = seconds * 20;
    struct timespec ts;
    ts.tv_sec = 0;
    ts.tv_nsec = 50000000; /* 50 milliseconds */

    for (int i = 0; i < slices; i++) {
        if (signal_handler_is_shutdown_requested()) {
            break;
        }
        nanosleep(&ts, NULL);
    }
}

int watchdog_inspect_mode(pid_t pid) {
    logger_log(LOG_LEVEL_INFO, "=== Linux /proc Process Inspector Mode ===");
    logger_log(LOG_LEVEL_INFO, "Target Process ID (PID): %d", (int)pid);

    char proc_info[512];
    if (process_read_proc_info(pid, proc_info, sizeof(proc_info)) == -1) {
        logger_log(LOG_LEVEL_ERROR, "Process %d not found or cannot access /proc/%d", (int)pid, (int)pid);
        return -1;
    }

    logger_log(LOG_LEVEL_SUCCESS, "Process information retrieved from /proc/%d:", (int)pid);
    printf("  --> %s\n\n", proc_info);

    printf("================================================================================\n");
    printf("[NOTE] OPERATING SYSTEMS AND SYSTEM PROGRAMMING (OSSP) ARCHITECTURAL NOTICE:\n");
    printf("  1. In POSIX/Linux, the waitpid() system call can ONLY reap and monitor direct\n");
    printf("     child processes spawned by the calling process (via fork()).\n");
    printf("  2. Arbitrary external processes (PID %d) can only be passively observed\n", (int)pid);
    printf("     via the /proc virtual filesystem or probed via kill(pid, 0).\n");
    printf("  3. Non-parent processes CANNOT receive child termination signals (SIGCHLD)\n");
    printf("     or reap exit status to prevent zombie processes.\n");
    printf("  4. For reliable auto-restart and zero-zombie lifecycle supervision, the\n");
    printf("     watchdog acts as the parent supervisor, launching the worker as a child.\n");
    printf("================================================================================\n");

    return 0;
}

int watchdog_run(const watchdog_config_t *config) {
    if (config == NULL || config->cmd_argv == NULL || config->cmd_argv[0] == NULL) {
        logger_log(LOG_LEVEL_ERROR, "Invalid watchdog configuration: no command specified.");
        return -1;
    }

    pid_t watchdog_pid = getpid();
    logger_log(LOG_LEVEL_INFO, "==========================================================");
    logger_log(LOG_LEVEL_INFO, "   LINUX PROCESS WATCHDOG AND AUTO-RESTART SYSTEM         ");
    logger_log(LOG_LEVEL_INFO, "   OSSP Lab Project | Active Watchdog PID: %d             ", (int)watchdog_pid);
    logger_log(LOG_LEVEL_INFO, "==========================================================");

    /* Construct command string for display and logging */
    char full_cmd[512] = {0};
    size_t offset = 0;
    for (int i = 0; config->cmd_argv[i] != NULL && offset < sizeof(full_cmd) - 2; i++) {
        int written = snprintf(full_cmd + offset, sizeof(full_cmd) - offset, "%s%s",
                               (i > 0 ? " " : ""), config->cmd_argv[i]);
        if (written > 0) offset += (size_t)written;
    }

    logger_log(LOG_LEVEL_INFO, "Supervised Command: %s", full_cmd);
    logger_log(LOG_LEVEL_INFO, "Configuration: Interval=%ds | Max Restarts=%d | Restart Delay=%ds | Always Restart=%s",
               config->interval_seconds,
               config->max_restarts,
               config->restart_delay_seconds,
               config->always_restart ? "YES" : "NO");

    int restart_count = 0;
    pid_t current_child_pid = 0;
    int exit_code_result = 0;

    /* Launch initial child process */
    logger_log(LOG_LEVEL_INFO, "Launching monitored process...");
    current_child_pid = process_spawn(config->cmd_argv);

    if (current_child_pid < 0) {
        logger_log(LOG_LEVEL_ERROR, "Failed to fork and spawn child process: %s", strerror(errno));
        return 1;
    }

    logger_log(LOG_LEVEL_SUCCESS, "Process started with PID: %d (Parent Watchdog PID: %d)",
               (int)current_child_pid, (int)watchdog_pid);

    /* Main monitoring and supervision loop */
    while (!signal_handler_is_shutdown_requested()) {
        /* Wait for configured interval, remaining responsive to shutdown */
        interruptible_sleep(config->interval_seconds);

        if (signal_handler_is_shutdown_requested()) {
            break;
        }

        /* Check the status of the child */
        proc_termination_info_t term_info;
        proc_status_t st = process_check_child(current_child_pid, &term_info);

        if (st == PROC_STATUS_RUNNING) {
            /* Child is healthy and running. Can inspect proc for diagnostics */
            char proc_buf[256];
            if (process_read_proc_info(current_child_pid, proc_buf, sizeof(proc_buf)) == 0) {
                logger_log(LOG_LEVEL_DEBUG, "Heartbeat check: %s", proc_buf);
            }
            continue;
        }

        /* Child process has terminated! */
        if (st == PROC_STATUS_EXITED_NORMAL) {
            logger_log(LOG_LEVEL_SUCCESS, "Monitored process (PID: %d) exited normally with status 0.",
                       (int)current_child_pid);
            if (!config->always_restart) {
                logger_log(LOG_LEVEL_INFO, "Process completed its workload cleanly. No restart required.");
                current_child_pid = 0;
                break;
            } else {
                logger_log(LOG_LEVEL_INFO, "Policy '--always-restart' is active. Proceeding with restart.");
            }
        } else if (st == PROC_STATUS_EXITED_ERROR) {
            logger_log(LOG_LEVEL_WARN, "Monitored process (PID: %d) terminated unexpectedly with exit code %d.",
                       (int)current_child_pid, term_info.exit_code);
            logger_log(LOG_LEVEL_WARN, "Termination reason: %s", term_info.description);
        } else if (st == PROC_STATUS_KILLED_SIGNAL) {
            logger_log(LOG_LEVEL_WARN, "Monitored process (PID: %d) terminated unexpectedly by signal %s%s.",
                       (int)current_child_pid, term_info.signal_name,
                       term_info.core_dumped ? " (core dumped)" : "");
            logger_log(LOG_LEVEL_WARN, "Termination reason: %s", term_info.description);
        } else {
            logger_log(LOG_LEVEL_WARN, "Monitored process (PID: %d) state change: %s",
                       (int)current_child_pid, term_info.description);
        }

        /* Check if shutdown was requested during termination handling */
        if (signal_handler_is_shutdown_requested()) {
            current_child_pid = 0;
            break;
        }

        /* Check if maximum restart limit is reached */
        if (config->max_restarts >= 0 && restart_count >= config->max_restarts) {
            logger_log(LOG_LEVEL_ERROR, "Restart limit reached (%d/%d attempts).",
                       restart_count, config->max_restarts);
            logger_log(LOG_LEVEL_ERROR, "Halting auto-restart to prevent an infinite restart loop.");
            current_child_pid = 0;
            exit_code_result = 2; /* Exit code indicating limit reached */
            break;
        }

        /* Auto-restart policy triggered */
        restart_count++;
        logger_log(LOG_LEVEL_INFO, "Auto-restart triggered [Attempt %d of %d]",
                   restart_count, config->max_restarts);
        logger_log(LOG_LEVEL_INFO, "Enforcing cool-off delay: waiting %d second(s) before restart...",
                   config->restart_delay_seconds);

        interruptible_sleep(config->restart_delay_seconds);

        if (signal_handler_is_shutdown_requested()) {
            logger_log(LOG_LEVEL_INFO, "Shutdown requested during restart delay. Cancelling restart.");
            current_child_pid = 0;
            break;
        }

        logger_log(LOG_LEVEL_INFO, "Restarting monitored process...");
        current_child_pid = process_spawn(config->cmd_argv);

        if (current_child_pid < 0) {
            logger_log(LOG_LEVEL_ERROR, "Failed to re-spawn process: %s", strerror(errno));
            exit_code_result = 1;
            break;
        }

        logger_log(LOG_LEVEL_SUCCESS, "Process restarted successfully with new PID: %d (Restart count: %d)",
                   (int)current_child_pid, restart_count);
    }

    /* Shutdown and cleanup handling */
    if (signal_handler_is_shutdown_requested()) {
        logger_log(LOG_LEVEL_WARN, "Watchdog received termination signal (Ctrl+C / SIGTERM / SIGINT).");
        logger_log(LOG_LEVEL_INFO, "Initiating safe shutdown sequence...");

        if (current_child_pid > 0) {
            logger_log(LOG_LEVEL_INFO, "Sending SIGTERM to child process (PID: %d)...", (int)current_child_pid);
            process_terminate_gracefully(current_child_pid, 2);
            logger_log(LOG_LEVEL_SUCCESS, "Child process (PID: %d) terminated and reaped.", (int)current_child_pid);
            current_child_pid = 0;
        }
    } else if (current_child_pid > 0) {
        /* Cleanup child if loop exited via other condition */
        process_terminate_gracefully(current_child_pid, 2);
        current_child_pid = 0;
    }

    logger_log(LOG_LEVEL_INFO, "Total restarts performed during this session: %d", restart_count);
    logger_log(LOG_LEVEL_SUCCESS, "Watchdog stopped safely. No zombie processes remaining.");

    return exit_code_result;
}

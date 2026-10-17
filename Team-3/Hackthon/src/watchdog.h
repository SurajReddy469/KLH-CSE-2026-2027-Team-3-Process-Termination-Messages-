#ifndef WATCHDOG_H
#define WATCHDOG_H

#include <sys/types.h>

/**
 * Watchdog configuration parameters.
 */
typedef struct {
    char **cmd_argv;              /* Executable and arguments to supervise */
    int interval_seconds;         /* Polling interval in seconds (default: 1) */
    int max_restarts;             /* Maximum restart attempts allowed (default: 5) */
    int restart_delay_seconds;    /* Delay between restarts in seconds (default: 2) */
    int always_restart;           /* Restart even if child exits cleanly with code 0 */
    const char *log_filepath;     /* Path to log file */
    pid_t inspect_pid;            /* PID for /proc inspection mode (if > 0) */
} watchdog_config_t;

/**
 * Run the watchdog supervision loop.
 * @param config Pointer to populated watchdog_config_t.
 * @return 0 on normal exit/shutdown, non-zero on failure or max restarts exceeded.
 */
int watchdog_run(const watchdog_config_t *config);

/**
 * Inspect an existing process using the Linux /proc filesystem.
 * @param pid Process ID to inspect.
 * @return 0 on success, -1 on failure.
 */
int watchdog_inspect_mode(pid_t pid);

#endif /* WATCHDOG_H */

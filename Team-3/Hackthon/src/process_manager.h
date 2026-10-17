#ifndef PROCESS_MANAGER_H
#define PROCESS_MANAGER_H

#include <sys/types.h>
#include <stdbool.h>
#include <stddef.h>

/**
 * Status of the monitored child process.
 */
typedef enum {
    PROC_STATUS_RUNNING,       /* Process is active and running */
    PROC_STATUS_EXITED_NORMAL, /* Process exited normally with return code 0 */
    PROC_STATUS_EXITED_ERROR,  /* Process exited with a non-zero error code */
    PROC_STATUS_KILLED_SIGNAL, /* Process was terminated by an unhandled signal */
    PROC_STATUS_STOPPED,       /* Process was stopped (e.g. SIGSTOP) */
    PROC_STATUS_NOT_FOUND,     /* Process does not exist (ECHILD or ESRCH) */
    PROC_STATUS_ERROR          /* System call failure */
} proc_status_t;

/**
 * Detailed information about process termination.
 */
typedef struct {
    proc_status_t status;
    int exit_code;             /* Populated if status == PROC_STATUS_EXITED_* */
    int signal_num;            /* Populated if status == PROC_STATUS_KILLED_SIGNAL */
    bool core_dumped;          /* True if WCOREDUMP is set */
    char signal_name[64];      /* e.g., "SIGSEGV (11)" */
    char description[256];     /* Human-readable explanation */
} proc_termination_info_t;

/**
 * Spawn a child process to be monitored using fork() and execvp().
 * @param argv NULL-terminated array of arguments. argv[0] is program path/name.
 * @return Child PID on success, -1 on fork failure.
 */
pid_t process_spawn(char *const argv[]);

/**
 * Check the status of a child process without blocking (using waitpid with WNOHANG).
 * @param pid Process ID to check.
 * @param info Pointer to struct to store termination details.
 * @return Current proc_status_t.
 */
proc_status_t process_check_child(pid_t pid, proc_termination_info_t *info);

/**
 * Gracefully terminate a child process.
 * Sends SIGTERM first, waits up to timeout_seconds for termination,
 * then sends SIGKILL if necessary to ensure no zombie processes remain.
 * @param pid Process ID to terminate.
 * @param timeout_seconds Maximum seconds to wait for SIGTERM before SIGKILL.
 * @return 0 on successful reap, -1 on error.
 */
int process_terminate_gracefully(pid_t pid, int timeout_seconds);

/**
 * Check if an arbitrary process exists using kill(pid, 0).
 * @param pid Target process ID.
 * @return 1 if exists, 0 if not found, -1 if permission denied.
 */
int process_exists(pid_t pid);

/**
 * Read process information from the Linux /proc filesystem (/proc/<pid>/status & cmdline).
 * @param pid Process ID.
 * @param out_buffer Output buffer to hold formatted details.
 * @param max_len Size of output buffer.
 * @return 0 on success, -1 if process does not exist or read failed.
 */
int process_read_proc_info(pid_t pid, char *out_buffer, size_t max_len);

/**
 * Convert a signal number to a standard name and description (e.g., SIGSEGV).
 * @param signum Signal number.
 * @param buffer Output buffer.
 * @param buflen Size of buffer.
 */
void process_get_signal_name(int signum, char *buffer, size_t buflen);

#endif /* PROCESS_MANAGER_H */

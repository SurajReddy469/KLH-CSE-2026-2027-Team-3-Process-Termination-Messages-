#ifndef SIGNAL_HANDLER_H
#define SIGNAL_HANDLER_H

#include <signal.h>

/**
 * Global atomic flag indicating whether a shutdown has been requested (e.g. via SIGINT / SIGTERM).
 * Declared volatile sig_atomic_t for signal safety.
 */
extern volatile sig_atomic_t g_shutdown_requested;

/**
 * Configure signal handlers for SIGINT and SIGTERM using sigaction().
 * @return 0 on success, -1 on failure.
 */
int signal_handler_init(void);

/**
 * Check if a shutdown signal was received.
 * @return 1 if shutdown requested, 0 otherwise.
 */
int signal_handler_is_shutdown_requested(void);

/**
 * Reset the shutdown flag (useful for testing).
 */
void signal_handler_reset(void);

#endif /* SIGNAL_HANDLER_H */

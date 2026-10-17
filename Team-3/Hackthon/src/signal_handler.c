#define _POSIX_C_SOURCE 200809L
#include "signal_handler.h"
#include <signal.h>
#include <string.h>
#include <unistd.h>

/* Global atomic flag */
volatile sig_atomic_t g_shutdown_requested = 0;

/* Signal handler routine - strictly async-signal-safe */
static void handle_signal(int sig) {
    (void)sig; /* Unused parameter */
    g_shutdown_requested = 1;
}

int signal_handler_init(void) {
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));

    sa.sa_handler = handle_signal;
    sigemptyset(&sa.sa_mask);
    /* Note: We do not set SA_RESTART so that blocking calls like sleep() or waitpid()
     * can be interrupted immediately when the user presses Ctrl+C. */
    sa.sa_flags = 0;

    if (sigaction(SIGINT, &sa, NULL) == -1) {
        return -1;
    }

    if (sigaction(SIGTERM, &sa, NULL) == -1) {
        return -1;
    }

    /* Ignore SIGPIPE so writing to broken pipes doesn't crash the watchdog */
    struct sigaction sa_pipe;
    memset(&sa_pipe, 0, sizeof(sa_pipe));
    sa_pipe.sa_handler = SIG_IGN;
    sigemptyset(&sa_pipe.sa_mask);
    sa_pipe.sa_flags = 0;
    sigaction(SIGPIPE, &sa_pipe, NULL);

    return 0;
}

int signal_handler_is_shutdown_requested(void) {
    return g_shutdown_requested != 0;
}

void signal_handler_reset(void) {
    g_shutdown_requested = 0;
}

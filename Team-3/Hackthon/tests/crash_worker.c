#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>

int main(int argc, char *argv[]) {
    int delay = 2;
    const char *crash_type = "segfault";

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--delay") == 0 && i + 1 < argc) {
            delay = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--type") == 0 && i + 1 < argc) {
            crash_type = argv[++i];
        }
    }

    pid_t pid = getpid();
    pid_t ppid = getppid();

    printf("[CRASH WORKER] Started (PID: %d, PPID: %d). Will crash in %d second(s) with '%s'...\n",
           (int)pid, (int)ppid, delay, crash_type);
    fflush(stdout);

    for (int i = 1; i <= delay; i++) {
        sleep(1);
        printf("[CRASH WORKER] Running... %d/%d seconds\n", i, delay);
        fflush(stdout);
    }

    printf("[CRASH WORKER] Simulating crash event now! Mode: %s\n", crash_type);
    fflush(stdout);

    if (strcmp(crash_type, "abort") == 0) {
        /* Triggers SIGABRT */
        abort();
    } else if (strcmp(crash_type, "divzero") == 0) {
        /* Triggers SIGFPE */
        volatile int zero = 0;
        volatile int result = 100 / zero;
        (void)result;
    } else if (strcmp(crash_type, "exit1") == 0) {
        /* Exits with non-zero status code */
        exit(42);
    } else {
        /* Default: NULL pointer dereference triggering SIGSEGV */
        volatile int *bad_ptr = NULL;
        *bad_ptr = 999;
    }

    return 0;
}

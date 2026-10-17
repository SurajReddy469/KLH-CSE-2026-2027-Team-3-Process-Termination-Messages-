#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

int main(int argc, char *argv[]) {
    int duration = 3;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--duration") == 0 && i + 1 < argc) {
            duration = atoi(argv[++i]);
        }
    }

    pid_t pid = getpid();
    pid_t ppid = getppid();

    printf("[NORMAL WORKER] Starting job processing (PID: %d, PPID: %d)\n", (int)pid, (int)ppid);
    printf("[NORMAL WORKER] Task requires %d unit(s) of processing...\n", duration);
    fflush(stdout);

    for (int i = 1; i <= duration; i++) {
        sleep(1);
        printf("[NORMAL WORKER] Processing step %d/%d (status: healthy)\n", i, duration);
        fflush(stdout);
    }

    printf("[NORMAL WORKER] All tasks completed successfully. Exiting cleanly with exit code 0.\n");
    fflush(stdout);

    return 0;
}

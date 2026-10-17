#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <stdbool.h>
#include <time.h>

static volatile sig_atomic_t g_stop = 0;

static void handle_signal(int sig) {
    (void)sig;
    g_stop = 1;
}

int main(int argc, char *argv[]) {
    (void)argc;
    (void)argv;

    struct sigaction sa;
    sa.sa_handler = handle_signal;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT, &sa, NULL);

    pid_t pid = getpid();
    pid_t ppid = getppid();

    printf("[STABLE WORKER] Started successfully. PID: %d | PPID: %d\n", (int)pid, (int)ppid);
    fflush(stdout);

    int seconds = 0;
    while (!g_stop) {
        sleep(1);
        seconds++;
        ppid = getppid(); /* In case parent changes */
        printf("[STABLE WORKER] Heartbeat | PID: %d | PPID: %d | Uptime: %ds\n", (int)pid, (int)ppid, seconds);
        fflush(stdout);
    }

    printf("[STABLE WORKER] Received stop signal. Performing graceful shutdown... Done.\n");
    fflush(stdout);
    return 0;
}

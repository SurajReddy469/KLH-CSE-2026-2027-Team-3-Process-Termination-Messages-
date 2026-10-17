#define _POSIX_C_SOURCE 200809L

#include "watchdog.h"
#include "logger.h"
#include "signal_handler.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <getopt.h>
#include <unistd.h>
#include <errno.h>

static void print_banner(void) {
    printf("\n");
    printf("======================================================================\n");
    printf("     LINUX PROCESS WATCHDOG AND AUTO-RESTART SYSTEM                   \n");
    printf("     Course: Operating Systems and System Programming (OSSP)          \n");
    printf("     Batch 3 Project | System-Level Process Supervision & Recovery    \n");
    printf("======================================================================\n\n");
}

static void print_usage(const char *prog_name) {
    printf("Usage:\n");
    printf("  %s [OPTIONS] -- COMMAND [ARGS...]\n", prog_name);
    printf("  %s --inspect-pid <PID>\n\n", prog_name);
    printf("Options:\n");
    printf("  -h, --help                 Display this help message and exit\n");
    printf("  -i, --interval SECONDS     Health monitoring check interval (default: 1s)\n");
    printf("  -m, --max-restarts N       Maximum number of restarts allowed (default: 5, -1 for unlimited)\n");
    printf("  -d, --restart-delay SEC    Delay in seconds between restart attempts (default: 2s)\n");
    printf("  -l, --log FILE             Path to output log file (default: logs/watchdog.log)\n");
    printf("  -a, --always-restart       Restart worker even on normal exit (exit code 0)\n");
    printf("  -p, --inspect-pid PID      Inspect an existing process via Linux /proc and exit\n");
    printf("  --                         Separator marking the beginning of the command to monitor\n\n");
    printf("Examples:\n");
    printf("  # Supervise a crash worker with 3 max restarts and 1s delay:\n");
    printf("  %s --max-restarts 3 --restart-delay 1 -- ./tests/crash_worker --delay 2\n\n", prog_name);
    printf("  # Supervise a stable worker with custom log file:\n");
    printf("  %s --log logs/stable.log -- ./tests/stable_worker\n\n", prog_name);
    printf("  # Inspect a running process by PID via /proc:\n");
    printf("  %s --inspect-pid 1234\n\n", prog_name);
}

int main(int argc, char *argv[]) {
    watchdog_config_t config;
    memset(&config, 0, sizeof(config));

    config.interval_seconds = 1;
    config.max_restarts = 5;
    config.restart_delay_seconds = 2;
    config.always_restart = 0;
    config.log_filepath = "logs/watchdog.log";
    config.inspect_pid = 0;

    static struct option long_options[] = {
        {"help",           no_argument,       0, 'h'},
        {"interval",       required_argument, 0, 'i'},
        {"max-restarts",   required_argument, 0, 'm'},
        {"restart-delay",  required_argument, 0, 'd'},
        {"log",            required_argument, 0, 'l'},
        {"always-restart", no_argument,       0, 'a'},
        {"inspect-pid",    required_argument, 0, 'p'},
        {0, 0, 0, 0}
    };

    int opt;
    int option_index = 0;

    while ((opt = getopt_long(argc, argv, "+hi:m:d:l:ap:", long_options, &option_index)) != -1) {
        switch (opt) {
            case 'h':
                print_banner();
                print_usage(argv[0]);
                return 0;
            case 'i': {
                int val = atoi(optarg);
                if (val <= 0) {
                    fprintf(stderr, "[ERROR] Invalid interval '%s': must be a positive integer.\n", optarg);
                    return 1;
                }
                config.interval_seconds = val;
                break;
            }
            case 'm': {
                int val = atoi(optarg);
                if (val < -1) {
                    fprintf(stderr, "[ERROR] Invalid max-restarts '%s': must be >= -1.\n", optarg);
                    return 1;
                }
                config.max_restarts = val;
                break;
            }
            case 'd': {
                int val = atoi(optarg);
                if (val < 0) {
                    fprintf(stderr, "[ERROR] Invalid restart-delay '%s': must be >= 0.\n", optarg);
                    return 1;
                }
                config.restart_delay_seconds = val;
                break;
            }
            case 'l':
                config.log_filepath = optarg;
                break;
            case 'a':
                config.always_restart = 1;
                break;
            case 'p': {
                pid_t target = (pid_t)atoi(optarg);
                if (target <= 0) {
                    fprintf(stderr, "[ERROR] Invalid PID '%s': must be a positive integer.\n", optarg);
                    return 1;
                }
                config.inspect_pid = target;
                break;
            }
            case '?':
            default:
                fprintf(stderr, "Try '%s --help' for more information.\n", argv[0]);
                return 1;
        }
    }

    /* If inspect mode is requested, run inspection and exit */
    if (config.inspect_pid > 0) {
        print_banner();
        if (logger_init(config.log_filepath) != 0) {
            fprintf(stderr, "[WARN] Could not initialize file logging. Continuing with stdout.\n");
        }
        int res = watchdog_inspect_mode(config.inspect_pid);
        logger_close();
        return (res == 0) ? 0 : 1;
    }

    /* Otherwise, we need a command to supervise */
    if (optind >= argc) {
        print_banner();
        fprintf(stderr, "[ERROR] No command specified to monitor.\n");
        fprintf(stderr, "Usage: %s [OPTIONS] -- COMMAND [ARGS...]\n", argv[0]);
        fprintf(stderr, "Try '%s --help' for complete documentation and examples.\n\n", argv[0]);
        return 1;
    }

    /* Remaining arguments belong to the supervised command */
    config.cmd_argv = &argv[optind];

    print_banner();

    /* Initialize logger */
    if (logger_init(config.log_filepath) != 0) {
        fprintf(stderr, "[WARN] Could not initialize log file '%s'. Continuing to stdout.\n", config.log_filepath);
    } else {
        printf("[INFO] Logging to: %s\n", config.log_filepath);
    }

    /* Initialize signal handling */
    if (signal_handler_init() != 0) {
        logger_log(LOG_LEVEL_ERROR, "Failed to initialize signal handlers: %s", strerror(errno));
        logger_close();
        return 1;
    }

    /* Run watchdog loop */
    int result = watchdog_run(&config);

    /* Clean up and close log */
    logger_close();

    return result;
}

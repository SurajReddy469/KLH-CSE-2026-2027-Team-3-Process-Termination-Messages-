#include "logger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <errno.h>

/* ANSI terminal color codes for clear terminal UX */
#define COLOR_RESET   "\033[0m"
#define COLOR_RED     "\033[1;31m"
#define COLOR_GREEN   "\033[1;32m"
#define COLOR_YELLOW  "\033[1;33m"
#define COLOR_BLUE    "\033[1;34m"
#define COLOR_MAGENTA "\033[1;35m"
#define COLOR_CYAN    "\033[1;36m"
#define COLOR_GRAY    "\033[0;90m"

static FILE *s_log_file = NULL;
static char s_log_path[512] = {0};

/* Helper to ensure parent directory of log file exists */
static void ensure_parent_dir_exists(const char *path) {
    char temp[512];
    strncpy(temp, path, sizeof(temp) - 1);
    temp[sizeof(temp) - 1] = '\0';

    char *last_slash = strrchr(temp, '/');
    if (last_slash != NULL) {
        *last_slash = '\0';
        /* Recursively create directories or simple mkdir */
        char sub[512] = {0};
        char *token = strtok(temp, "/");
        if (temp[0] == '/') {
            strcat(sub, "/");
        }
        while (token != NULL) {
            strcat(sub, token);
            mkdir(sub, 0755);
            strcat(sub, "/");
            token = strtok(NULL, "/");
        }
    }
}

int logger_init(const char *log_file) {
    if (s_log_file != NULL) {
        fclose(s_log_file);
        s_log_file = NULL;
    }

    if (log_file == NULL || strlen(log_file) == 0) {
        return 0; /* Log to stdout/stderr only */
    }

    strncpy(s_log_path, log_file, sizeof(s_log_path) - 1);
    s_log_path[sizeof(s_log_path) - 1] = '\0';

    ensure_parent_dir_exists(s_log_path);

    s_log_file = fopen(s_log_path, "a");
    if (s_log_file == NULL) {
        fprintf(stderr, "[ERROR] Failed to open log file '%s': %s\n", s_log_path, strerror(errno));
        return -1;
    }

    return 0;
}

void logger_close(void) {
    if (s_log_file != NULL) {
        fflush(s_log_file);
        fclose(s_log_file);
        s_log_file = NULL;
    }
}

void logger_get_timestamp(char *buffer, size_t size) {
    if (buffer == NULL || size == 0) return;

    time_t now = time(NULL);
    struct tm tm_info;
    localtime_r(&now, &tm_info);

    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", &tm_info);
}

void logger_log(log_level_t level, const char *format, ...) {
    char timestamp[32];
    logger_get_timestamp(timestamp, sizeof(timestamp));

    const char *level_tag = "INFO";
    const char *color_code = COLOR_CYAN;
    FILE *stream = stdout;

    switch (level) {
        case LOG_LEVEL_SUCCESS:
            level_tag = "SUCCESS";
            color_code = COLOR_GREEN;
            stream = stdout;
            break;
        case LOG_LEVEL_WARN:
            level_tag = "WARN";
            color_code = COLOR_YELLOW;
            stream = stdout;
            break;
        case LOG_LEVEL_ERROR:
            level_tag = "ERROR";
            color_code = COLOR_RED;
            stream = stderr;
            break;
        case LOG_LEVEL_DEBUG:
            level_tag = "DEBUG";
            color_code = COLOR_GRAY;
            stream = stdout;
            break;
        case LOG_LEVEL_INFO:
        default:
            level_tag = "INFO";
            color_code = COLOR_BLUE;
            stream = stdout;
            break;
    }

    /* Format message content */
    char message[1024];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    /* Output to Terminal (with ANSI colors if tty) */
    int is_tty = isatty(fileno(stream));
    if (is_tty) {
        fprintf(stream, "%s[%s]%s %s[%s]%s %s\n",
                COLOR_GRAY, timestamp, COLOR_RESET,
                color_code, level_tag, COLOR_RESET,
                message);
    } else {
        fprintf(stream, "[%s] [%s] %s\n", timestamp, level_tag, message);
    }
    fflush(stream);

    /* Output to Log File (uncolored, clean plaintext) */
    if (s_log_file != NULL) {
        fprintf(s_log_file, "[%s] [%s] %s\n", timestamp, level_tag, message);
        fflush(s_log_file);
    }
}

#ifndef LOGGER_H
#define LOGGER_H

#include <stdio.h>
#include <stdarg.h>

/**
 * Log levels for watchdog output.
 */
typedef enum {
    LOG_LEVEL_INFO,
    LOG_LEVEL_SUCCESS,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR,
    LOG_LEVEL_DEBUG
} log_level_t;

/**
 * Initialize the logger.
 * @param log_file Path to the plain-text log file. If NULL, logging to file is disabled.
 * @return 0 on success, -1 on failure.
 */
int logger_init(const char *log_file);

/**
 * Close the logger and release file handles.
 */
void logger_close(void);

/**
 * Log a formatted message to standard output and the log file.
 * @param level The log severity level.
 * @param format Printf-style format string.
 */
void logger_log(log_level_t level, const char *format, ...);

/**
 * Format a human-readable timestamp into the provided buffer.
 * @param buffer Output buffer.
 * @param size Buffer capacity.
 */
void logger_get_timestamp(char *buffer, size_t size);

#endif /* LOGGER_H */

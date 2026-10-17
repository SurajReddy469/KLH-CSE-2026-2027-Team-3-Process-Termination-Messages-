# ==============================================================================
# Makefile: Linux Process Watchdog and Auto-Restart System
# Batch 3 — Operating Systems and System Programming (OSSP)
# ==============================================================================

CC ?= gcc
CFLAGS ?= -Wall -Wextra -Wpedantic -O2 -std=c99 -D_POSIX_C_SOURCE=200809L -D_DEFAULT_SOURCE
CPPFLAGS ?= -Isrc

SRC_DIR = src
TESTS_DIR = tests
BIN_DIR = bin
LOGS_DIR = logs

# Watchdog source and object files
WATCHDOG_SRCS = $(SRC_DIR)/main.c \
                $(SRC_DIR)/watchdog.c \
                $(SRC_DIR)/process_manager.c \
                $(SRC_DIR)/logger.c \
                $(SRC_DIR)/signal_handler.c

WATCHDOG_OBJS = $(patsubst $(SRC_DIR)/%.c, $(BIN_DIR)/%.o, $(WATCHDOG_SRCS))
WATCHDOG_BIN  = $(BIN_DIR)/watchdog

# Test worker binaries
WORKER_BINS = $(BIN_DIR)/stable_worker \
              $(BIN_DIR)/crash_worker \
              $(BIN_DIR)/normal_worker

.PHONY: all tests test clean help setup

# Default target builds everything
all: setup $(WATCHDOG_BIN) tests

setup:
	@mkdir -p $(BIN_DIR) $(LOGS_DIR)

# Link watchdog executable
$(WATCHDOG_BIN): $(WATCHDOG_OBJS)
	$(CC) $(CFLAGS) -o $@ $^
	@echo "[BUILD SUCCESS] Watchdog built at: $@"

# Compile watchdog object files
$(BIN_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) $(CPPFLAGS) -c $< -o $@

# Build test programs
tests: setup $(WORKER_BINS)

$(BIN_DIR)/stable_worker: $(TESTS_DIR)/stable_worker.c
	$(CC) $(CFLAGS) -o $@ $<
	@echo "[BUILD SUCCESS] Test worker built: $@"

$(BIN_DIR)/crash_worker: $(TESTS_DIR)/crash_worker.c
	$(CC) $(CFLAGS) -o $@ $<
	@echo "[BUILD SUCCESS] Test worker built: $@"

$(BIN_DIR)/normal_worker: $(TESTS_DIR)/normal_worker.c
	$(CC) $(CFLAGS) -o $@ $<
	@echo "[BUILD SUCCESS] Test worker built: $@"

# Run automated test suite
test: all
	@chmod +x $(TESTS_DIR)/test_watchdog.sh
	@./$(TESTS_DIR)/test_watchdog.sh

# Clean all generated binaries, objects, and logs
clean:
	rm -rf $(BIN_DIR)/*.o $(WATCHDOG_BIN) $(WORKER_BINS)
	rm -f $(LOGS_DIR)/*.log
	@echo "[CLEAN] Build artifacts and logs removed."

# Help documentation
help:
	@echo "Linux Process Watchdog - Available Make Targets:"
	@echo "  make         - Compile the watchdog application and all test workers"
	@echo "  make tests   - Compile only the test demonstration workers"
	@echo "  make test    - Run the automated test script (test_watchdog.sh)"
	@echo "  make clean   - Remove all compiled objects, binaries, and log files"
	@echo "  make help    - Show this help message"

#!/usr/bin/env bash
# ==============================================================================
# Automated Test Suite: Linux Process Watchdog and Auto-Restart System
# Batch 3 — Operating Systems and System Programming (OSSP)
# ==============================================================================

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$ROOT_DIR/bin"
LOGS_DIR="$ROOT_DIR/logs"

WATCHDOG="$BIN_DIR/watchdog"
STABLE_WORKER="$BIN_DIR/stable_worker"
CRASH_WORKER="$BIN_DIR/crash_worker"
NORMAL_WORKER="$BIN_DIR/normal_worker"

# Colors for terminal reporting
CLR_RESET="\033[0m"
CLR_RED="\033[1;31m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_BLUE="\033[1;34m"
CLR_CYAN="\033[1;36m"

TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=8

echo -e "\n${CLR_BLUE}==============================================================================${CLR_RESET}"
echo -e "${CLR_CYAN}  OSSP BATCH 3 — PROCESS WATCHDOG AUTOMATED VALIDATION SUITE                ${CLR_RESET}"
echo -e "${CLR_BLUE}==============================================================================${CLR_RESET}\n"

# Verify required binaries exist
for bin in "$WATCHDOG" "$STABLE_WORKER" "$CRASH_WORKER" "$NORMAL_WORKER"; do
    if [ ! -x "$bin" ]; then
        echo -e "${CLR_RED}[SETUP ERROR] Required binary not found: $bin${CLR_RESET}"
        echo "Run 'make' before running this test script."
        exit 1
    fi
done

mkdir -p "$LOGS_DIR"

log_test() {
    local status="$1"
    local id="$2"
    local name="$3"
    if [ "$status" -eq 0 ]; then
        echo -e "  [${CLR_GREEN}PASS${CLR_RESET}] Test $id: $name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  [${CLR_RED}FAIL${CLR_RESET}] Test $id: $name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ------------------------------------------------------------------------------
# Test 1: Normal Exit (Process exits with status 0, Watchdog must NOT restart)
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 1: Normal Process Exit (No Unnecessary Restart)...${CLR_RESET}"
LOG_T1="$LOGS_DIR/test1_normal.log"
rm -f "$LOG_T1"

timeout 10s "$WATCHDOG" --interval 1 --max-restarts 3 --log "$LOG_T1" -- "$NORMAL_WORKER" --duration 2 > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ] && grep -q "exited normally with status 0" "$LOG_T1" 2>/dev/null && grep -q "No restart required" "$LOG_T1" 2>/dev/null; then
    log_test 0 "1" "Normal worker exit handled cleanly without unintended restart"
else
    log_test 1 "1" "Normal worker exit failed (Exit: $EXIT_CODE)"
fi

# ------------------------------------------------------------------------------
# Test 2: Crash Detection and Single Restart Recovery
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 2: Crash Detection & Automatic Recovery...${CLR_RESET}"
LOG_T2="$LOGS_DIR/test2_crash.log"
rm -f "$LOG_T2"

# Worker crashes after 1 second. Max restarts = 1. Restart delay = 1.
# It will crash, restart once, then reach limit or complete.
timeout 15s "$WATCHDOG" --interval 1 --max-restarts 1 --restart-delay 1 --log "$LOG_T2" -- "$CRASH_WORKER" --delay 1 --type segfault > /dev/null 2>&1
EXIT_CODE=$?

if grep -q "terminated unexpectedly by signal SIGSEGV" "$LOG_T2" 2>/dev/null && grep -q "Auto-restart triggered" "$LOG_T2" 2>/dev/null && grep -q "Process restarted successfully" "$LOG_T2" 2>/dev/null; then
    log_test 0 "2" "SIGSEGV crash detected and process successfully restarted"
else
    log_test 1 "2" "Crash detection or restart failed"
fi

# ------------------------------------------------------------------------------
# Test 3: Maximum Restart Limit Enforcement (Infinite Loop Prevention)
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 3: Maximum Restart Limit Enforcement...${CLR_RESET}"
LOG_T3="$LOGS_DIR/test3_limit.log"
rm -f "$LOG_T3"

# Worker exits with error code 42 immediately. Max restarts = 3.
timeout 15s "$WATCHDOG" --interval 1 --max-restarts 3 --restart-delay 0 --log "$LOG_T3" -- "$CRASH_WORKER" --delay 0 --type exit1 > /dev/null 2>&1
EXIT_CODE=$?

if grep -q "Restart limit reached (3/3 attempts)" "$LOG_T3" 2>/dev/null && grep -q "Halting auto-restart" "$LOG_T3" 2>/dev/null; then
    log_test 0 "3" "Enforced maximum restart threshold (stopped after 3 failures)"
else
    log_test 1 "3" "Restart limit not enforced properly (Exit: $EXIT_CODE)"
fi

# ------------------------------------------------------------------------------
# Test 4: Signal Handling (SIGINT/SIGTERM) and Safe Shutdown (No Zombies)
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 4: Safe Shutdown via Signal and Zombie Prevention...${CLR_RESET}"
LOG_T4="$LOGS_DIR/test4_signal.log"
rm -f "$LOG_T4"

# Launch watchdog with stable worker in background
"$WATCHDOG" --interval 1 --max-restarts 5 --log "$LOG_T4" -- "$STABLE_WORKER" > /dev/null 2>&1 &
WD_PID=$!

sleep 2 # Let it start and begin monitoring

# Send SIGINT (simulate Ctrl+C)
kill -INT "$WD_PID" 2>/dev/null

# Wait for watchdog to shutdown
wait "$WD_PID" 2>/dev/null
WD_EXIT=$?

# Verify child was cleanly reaped and no zombie exists
ZOMBIES=$(ps -ef | grep defunct | grep -v grep | wc -l)

if grep -q "Watchdog received termination signal" "$LOG_T4" 2>/dev/null && grep -q "Child process .* terminated and reaped" "$LOG_T4" 2>/dev/null && [ "$ZOMBIES" -eq 0 ]; then
    log_test 0 "4" "Watchdog caught SIGINT, safely reaped child, 0 zombies left"
else
    log_test 1 "4" "Safe shutdown failed or zombie detected"
fi

# ------------------------------------------------------------------------------
# Test 5: Handling Invalid Command / Binary Not Found
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 5: Invalid Binary Execution Handling...${CLR_RESET}"
LOG_T5="$LOGS_DIR/test5_invalid_bin.log"
rm -f "$LOG_T5"

timeout 10s "$WATCHDOG" --interval 1 --max-restarts 2 --restart-delay 0 --log "$LOG_T5" -- /bin/non_existent_binary_xyz123 > /dev/null 2>&1
EXIT_CODE=$?

if grep -q "exit code 127" "$LOG_T5" 2>/dev/null; then
    log_test 0 "5" "Correctly caught execvp failure (POSIX code 127)"
else
    log_test 1 "5" "Invalid binary handling failed"
fi

# ------------------------------------------------------------------------------
# Test 6: CLI Argument Validation (Errors on Bad Inputs)
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 6: CLI Argument Validation...${CLR_RESET}"
# Negative interval test
"$WATCHDOG" --interval -5 -- "$NORMAL_WORKER" > /dev/null 2>&1
C1=$?
# Missing command test
"$WATCHDOG" > /dev/null 2>&1
C2=$?
# Help flag test
"$WATCHDOG" --help > /dev/null 2>&1
C3=$?

if [ $C1 -ne 0 ] && [ $C2 -ne 0 ] && [ $C3 -eq 0 ]; then
    log_test 0 "6" "CLI correctly validates input parameters and provides help"
else
    log_test 1 "6" "CLI parameter validation failed (C1=$C1, C2=$C2, C3=$C3)"
fi

# ------------------------------------------------------------------------------
# Test 7: Linux /proc Inspection Mode
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 7: Linux /proc Inspection Mode...${CLR_RESET}"
LOG_T7="$LOGS_DIR/test7_proc.log"
rm -f "$LOG_T7"

# Inspect our own bash process PID ($$)
"$WATCHDOG" --inspect-pid $$ --log "$LOG_T7" > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ] && grep -q "Process information retrieved from /proc/$$" "$LOG_T7" 2>/dev/null; then
    log_test 0 "7" "Successfully inspected target PID via Linux /proc filesystem"
else
    log_test 1 "7" "Proc inspection mode failed"
fi

# ------------------------------------------------------------------------------
# Test 8: Comprehensive Log File Integrity
# ------------------------------------------------------------------------------
echo -e "${CLR_YELLOW}Running Test 8: Log File Integrity & Timestamps...${CLR_RESET}"
if [ -f "$LOG_T2" ] && grep -E -q "^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]" "$LOG_T2"; then
    log_test 0 "8" "Log file contains structured ISO-like timestamps and entries"
else
    log_test 1 "8" "Log file format verification failed"
fi

# ------------------------------------------------------------------------------
# Summary Report
# ------------------------------------------------------------------------------
echo -e "\n${CLR_BLUE}==============================================================================${CLR_RESET}"
echo -e "  TOTAL TESTS: $TOTAL_TESTS | PASSED: ${CLR_GREEN}$TESTS_PASSED${CLR_RESET} | FAILED: ${CLR_RED}$TESTS_FAILED${CLR_RESET}"
echo -e "${CLR_BLUE}==============================================================================${CLR_RESET}\n"

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${CLR_GREEN}ALL TESTS PASSED SUCCESSFULLY! The Process Watchdog is rock solid.${CLR_RESET}\n"
    exit 0
else
    echo -e "${CLR_RED}SOME TESTS FAILED. Check logs in $LOGS_DIR for diagnostics.${CLR_RESET}\n"
    exit 1
fi

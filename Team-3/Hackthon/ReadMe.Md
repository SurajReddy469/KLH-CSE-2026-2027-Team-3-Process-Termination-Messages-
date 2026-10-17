
# Linux Process Watchdog and Auto-Restart System

## 📌 Project Overview

The **Linux Process Watchdog and Auto-Restart System** is a C-based application that continuously monitors selected processes in Ubuntu Linux and automatically restarts them when they terminate unexpectedly.

## 🎯 Problem Statement

Develop a system that monitors Linux processes and automatically restarts failed processes.

## 👥 Team Members

1. **Suraj** — 2520030355
2. **Kevin** — 250030213
3. **Vijay** — 2520030387

## 🛠️ Technologies Used

- C Programming
- Ubuntu Linux
- GCC Compiler
- Linux System Calls
- Bash Shell Scripting
- Makefile

## ✨ Key Features

- Continuous process monitoring
- Automatic process restart
- Process ID (PID) tracking
- Configurable restart limits
- Restart delay configuration
- Event logging
- Signal handling and safe shutdown
- Error handling

## ⚙️ System Calls Used

| System Call / Function | Purpose |
|---|---|
| `fork()` | Creates a child process |
| `execvp()` | Executes a program |
| `waitpid()` | Detects child termination |
| `getpid()` | Retrieves the process ID |
| `kill()` | Sends signals to a process |
| `sigaction()` | Configures signal handling |
| `nanosleep()` | Provides restart delays |

## 📂 Project Structure

```text
linux-process-watchdog/
├── src/
│   ├── main.c
│   ├── watchdog.c
│   ├── watchdog.h
│   ├── process_manager.c
│   ├── process_manager.h
│   ├── logger.c
│   ├── logger.h
│   ├── signal_handler.c
│   └── signal_handler.h
├── tests/
│   ├── stable_worker.c
│   ├── crash_worker.c
│   ├── normal_worker.c
│   └── test_watchdog.sh
├── logs/
├── docs/
├── Makefile
└── README.md
```

*The directory structure above describes the intended layout; adjust it to match the files actually generated in your project.*

## 🚀 Installation and Execution

### 1. Install Required Tools

Open the Ubuntu terminal and run:

```bash
sudo apt update
sudo apt install build-essential
```

### 2. Navigate to the Project

```bash
cd linux-process-watchdog
```

### 3. Compile the Project

```bash
make
```

### 4. Build Test Programs

```bash
make tests
```

### 5. Run the Application

Use the command supported by your implementation. For example:

```bash
./watchdog --max-restarts 5 --restart-delay 2 -- sleep 30
```

**Note:** The exact executable name and command-line options depend on the implementation generated for this project. Check `./watchdog --help` or the Makefile if the command differs.

## 🧪 Testing

The system should be tested for:

1. Normal process execution.
2. Unexpected process termination.
3. Automatic process restart.
4. Maximum restart limit enforcement.
5. Invalid executable handling.
6. Safe shutdown using `Ctrl+C`.
7. Log file generation.

Record test results only after executing the tests.

## 📈 Expected Outcome

The system detects unexpected process termination, automatically restarts the monitored process according to the configured policy, and records important events in log files.

## 🔮 Future Enhancements

- Monitoring multiple processes
- Desktop and email notifications
- Advanced process statistics
- Persistent restart history
- Integration with Linux service-management tools

## 🎓 Learning Outcomes

This project demonstrates practical knowledge of Linux process management, process creation, synchronization, signal handling, system calls, and error handling using C.

## 📚 References

- Linux Manual Pages: https://man7.org/linux/man-pages/
- GCC Documentation: https://gcc.gnu.org/
- Ubuntu Documentation: https://help.ubuntu.com/

## 📄 License

This project is developed for educational purposes as part of an Operating Systems and System Programming (OSSP) project.

---

**Project:** Linux Process Watchdog and Auto-Restart System  
**Subject:** Operating Systems and System Programming (OSSP)  
**Batch:** 3

# Process Termination Messages

## 📌 Project Overview

**Process Termination Messages** is a Linux-based Operating Systems and Systems Programming project that demonstrates how a parent process creates, executes, monitors, and identifies the termination of a child process.

The project uses **C programming** and Linux/POSIX process-management mechanisms such as:

* `fork()`
* `execvp()`
* `waitpid()`
* `getpid()`
* `WIFEXITED()`
* `WEXITSTATUS()`
* `WIFSIGNALED()`
* `WTERMSIG()`

The system identifies whether a child process terminates normally, terminates with a non-zero exit status, or is terminated by a signal.

---

## 👥 Team Members

| Roll Number | Name               |
| ----------- | ------------------ |
| 2520030355  | **Ch Suraj Reddy** |
| 2520030387  | **Vanka Vijay**    |
| 2520030213  | **Kevin Josh**     |

---

## 🎯 Objectives

1. Demonstrate child-process creation using `fork()`.
2. Execute Linux applications using `execvp()`.
3. Monitor child processes using `waitpid()`.
4. Detect normal process termination.
5. Detect non-zero exit statuses.
6. Detect signal-based process termination.
7. Display the child PID and termination information.
8. Provide a practical demonstration of Linux process management.

---

## 🛠️ Technologies and Tools

* **Operating System:** Linux / Ubuntu
* **Programming Language:** C
* **Compiler:** GCC
* **Build Tool:** Make / Makefile
* **Version Control:** Git / GitHub
* **Environment:** Linux Terminal / WSL

---

## 📂 Project Structure

```text
Process-Termination-Messages/
│
├── src/
│   ├── process_monitor.c
│   ├── termination_test.c
│   └── Makefile
│
├── README.md
│
└── test-cases/
    ├── linux_normal_termination.txt
    ├── linux_nonzero_exit.txt
    ├── linux_signal_termination.txt
    ├── chrome_normal_termination.txt
    └── chrome_abnormal_termination.txt
```

---

## ⚙️ How the Project Works

The project follows a parent-child process model.

```text
             User
               |
               v
       Process Monitor
               |
             fork()
               |
        +------+------+
        |             |
     Parent          Child
        |             |
    waitpid()       execvp()
        |             |
        |        Linux Application
        |             |
        +<------------+
               |
       Check Termination
               |
       +-------+-------+
       |               |
     Normal          Signal
       |               |
  Exit Status      Signal Number
       |               |
       +-------+-------+
               |
               v
      Termination Message
```

### Process Flow

1. The parent process calls `fork()`.
2. A child process is created.
3. The child executes the selected command/application.
4. The parent waits for the child using `waitpid()`.
5. The termination status is checked.
6. The program determines whether termination was:

   * Normal
   * Normal with a non-zero exit status
   * Signal-based
7. The corresponding termination information is displayed.

---

# 🧪 Test Cases

## 1. Linux Normal Termination

### Command

```bash
sleep 10
```

### Expected Result

The child process terminates normally after 10 seconds.

```text
Termination type: Normal
Exit status: 0
```

### Evidence

* Child PID
* Termination type
* Exit status
* Termination message
* Terminal screenshot

---

## 2. Linux Normal Termination With Non-Zero Exit Status

### Command

```bash
./termination_test error
```

### Expected Result

The child terminates normally but returns a non-zero exit status.

```text
Termination type: Normal
Exit status: 5
```

This demonstrates that **normal termination does not necessarily mean exit status 0**.

---

## 3. Linux Signal-Based Abnormal Termination

### Command

```bash
./termination_test signal
```

### Expected Result

The child process is terminated using `SIGTERM`.

```text
Termination type: Abnormal (Signal)
Signal number: 15
Signal: SIGTERM
```

This test demonstrates the use of:

```c
WIFSIGNALED()
WTERMSIG()
```

---

## 4. Chrome Normal Termination

The project can also demonstrate termination monitoring for Chrome running on Windows when the project is executed from WSL.

### Procedure

```bash
./process_monitor
```

Select:

```text
Option 2
```

Then close Chrome normally.

### Expected Result

```text
Termination type: Normal
Message: Chrome closed normally.
```

### Important Note

Windows Chrome is monitored externally from WSL. Therefore, a POSIX `waitpid()` exit status is not reported for this test.

---

## 5. Chrome Abnormal Termination

### Procedure

```bash
./process_monitor
```

Select:

```text
Option 3
```

The program uses:

```text
taskkill /F /IM chrome.exe
```

### Expected Result

Chrome is forcefully terminated.

```text
Termination type: Forced / Abnormal
```

### Important Note

The Chrome process is a Windows process being controlled externally from WSL. Therefore, the normal POSIX `waitpid()` exit-status mechanism is not used for this test.

---

# ▶️ Compilation

Navigate to the source directory:

```bash
cd src
```

Compile the program using GCC:

```bash
gcc process_monitor.c -o process_monitor
```

If `termination_test.c` is included:

```bash
gcc termination_test.c -o termination_test
```

---

# ▶️ Running the Project

Run the process monitor:

```bash
./process_monitor
```

For the termination tests:

```bash
./termination_test signal
```

or:

```bash
./termination_test error
```

---

# 📊 Expected Results Summary

| Test Case                 | Termination Type  | Status / Signal         |
| ------------------------- | ----------------- | ----------------------- |
| `sleep 10`                | Normal            | Exit status `0`         |
| `termination_test error`  | Normal            | Exit status `5`         |
| `termination_test signal` | Abnormal          | `SIGTERM` / Signal `15` |
| Chrome Normal             | Normal            | Externally monitored    |
| Chrome Abnormal           | Forced / Abnormal | `taskkill /F`           |

---

# 🔑 Important Linux APIs

### `fork()`

Creates a new child process from the parent process.

### `execvp()`

Replaces the child process with the selected application or command.

### `waitpid()`

Allows the parent process to wait for a specific child and obtain its termination status.

### `getpid()`

Returns the process ID of the current process.

### `WIFEXITED()`

Checks whether the child terminated normally.

### `WEXITSTATUS()`

Retrieves the exit status when the child terminates normally.

### `WIFSIGNALED()`

Checks whether the child terminated because of a signal.

### `WTERMSIG()`

Retrieves the signal number responsible for signal-based termination.

---

# 📸 Result Evidence

For the final project demonstration, capture screenshots showing:

1. Project compilation.
2. Process monitor menu.
3. Normal termination using `sleep 10`.
4. Non-zero exit status using `./termination_test error`.
5. Signal termination using `./termination_test signal`.
6. Chrome normal termination, if demonstrated.
7. Chrome abnormal termination, if demonstrated.
8. Final termination messages.

---

# 🎓 Learning Outcomes

Through this project, the team demonstrates practical understanding of:

* Linux process management
* Parent-child process relationships
* Process creation
* Process execution
* Process synchronization
* Process termination
* Exit statuses
* Linux signals
* POSIX system calls
* Command-line process monitoring

---

# ✅ Conclusion

The **Process Termination Messages** project provides a practical demonstration of Linux process management. It shows how a parent process can create and monitor a child process, wait for its completion, determine the reason for termination, and display meaningful termination information.

The different test cases demonstrate normal termination, non-zero exit status, and signal-based termination. The project also demonstrates external monitoring of Windows Chrome processes from a WSL environment.

---

## 👨‍💻 Team

**2520030355 — Ch Suraj Reddy**
**2520030387 — Vanka Vijay**
**2520030213 — Kevin Josh**

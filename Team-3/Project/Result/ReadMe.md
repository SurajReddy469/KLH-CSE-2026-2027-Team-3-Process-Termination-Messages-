# Result Folder — Process Termination Messages

## 📌 Purpose

The `Result` folder contains the output and evidence generated while demonstrating the **Process Termination Messages** interface.

The results document how the browser-based application responds to different process lifecycle and termination scenarios.

> **Note:** The project in this repository is a frontend simulation implemented using HTML, CSS, and JavaScript. The results represent simulated process behavior displayed by the interface.

---

## 📂 Result Folder Structure

```text
Result/
│
├── README.md
│
├── normal_termination/
├── error_termination/
├── user_termination/
├── signal_termination/
└── screenshots/
```

The subfolders can be used to organize screenshots or exported evidence for each demonstration scenario.

---

# 🧪 Demonstration Results

## 1. Normal Termination

### Scenario

A simulated process is created and executed normally.

### Expected Result

```text
Status: Completed
Exit Code: 0
Reason: Process completed successfully.
```

### Result

The interface changes the process status to **Completed** and displays the corresponding successful termination information.

---

# 2. Execution Error

### Scenario

A simulated process is terminated because of an execution error.

### Expected Result

```text
Status: Terminated
Exit Code: 1
Reason: Process terminated due to an execution error.
```

### Result

The interface identifies the process as terminated and displays the non-zero exit code.

---

# 3. User Termination

### Scenario

A running simulated process is interrupted by the user.

### Simulated Signal

```text
SIGINT
```

### Expected Result

```text
Status: Terminated
Signal: SIGINT
Exit Code: 130
```

### Result

The interface records the process as terminated by user action and displays the corresponding signal and exit code.

---

# 4. Signal Termination

### Scenario

A signal is sent to a selected simulated process using the Signal Handling section.

### Simulated Signal

```text
SIGTERM
```

### Expected Result

```text
Status: Terminated
Signal: SIGTERM
Exit Code: 143
```

### Result

The interface changes the process status to **Terminated** and displays the signal information in the termination status section.

---

# 5. SIGKILL Demonstration

The interface also provides a simulated `SIGKILL` option.

### Simulated Signal

```text
SIGKILL
```

### Expected Result

```text
Status: Terminated
Signal: SIGKILL
Exit Code: 137
```

This demonstrates how different signals can produce different termination information in the simulation.

---

# 📊 Result Summary

| Test Scenario      | Status     | Signal  | Exit Code |
| ------------------ | ---------- | ------- | --------: |
| Normal Termination | Completed  | —       |         0 |
| Execution Error    | Terminated | —       |         1 |
| User Termination   | Terminated | SIGINT  |       130 |
| Signal Termination | Terminated | SIGTERM |       143 |
| SIGKILL            | Terminated | SIGKILL |       137 |

---

# 🔍 Process Monitoring Result

The Process Monitoring section displays information about the simulated processes.

The result can include:

* Process ID (PID)
* Parent Process ID (PPID)
* Process Name
* Current Status
* Runtime
* Termination Reason

Example:

```text
PID: 1001
PPID: 1000
Name: DemoChild
Status: Completed
Runtime: 10 seconds
Reason: Process completed successfully.
```

---

# 📋 Termination Status Result

After a process terminates, the **Termination Status** section displays the latest termination information.

Example:

```text
PID: 1001
PPID: 1000
Status: Terminated
Exit Code: 143
Signal: SIGTERM
Reason: Process terminated by signal SIGTERM.
```

This section provides the main evidence for the termination behavior demonstrated by the project.

---

# 💬 Termination Messages

The application generates messages according to the simulated termination scenario.

Examples:

```text
Process completed successfully.
```

```text
Process terminated due to an execution error.
```

```text
Process terminated by user action (SIGINT).
```

```text
Process terminated by signal SIGTERM.
```

---

# 🧪 Testing Results

The project contains four primary testing scenarios:

```text
1. Test Normal Completion
2. Test Execution Error
3. Test User Termination
4. Test Signal Termination
```

Each test updates the interface and allows the resulting process state to be viewed through the monitoring and termination sections.

---

# 📸 Evidence

Screenshots placed in this folder should preferably show:

1. Process creation
2. Process execution
3. Process monitoring
4. Normal termination
5. Error termination
6. User termination
7. Signal termination
8. Termination status
9. Termination messages
10. Testing & Error Identification results

Recommended naming:

```text
01_process_creation.png
02_process_execution.png
03_process_monitoring.png
04_normal_termination.png
05_error_termination.png
06_user_termination.png
07_signal_termination.png
08_termination_status.png
09_termination_messages.png
10_testing_results.png
```

---

# ⚠️ Important Note

The results shown by this project are **simulated process-management results generated by JavaScript in the browser**.

The frontend does not directly execute Linux system calls such as:

```text
fork()
execvp()
waitpid()
kill()
exit()
```

Therefore, PID values, exit codes, signals, and termination states displayed by the interface are part of the project's simulation.

---

# 👥 Team Members

| Roll Number | Name               |
| ----------- | ------------------ |
| 2520030355  | **Ch Suraj Reddy** |
| 2520030387  | **Vanka Vijay**    |
| 2520030213  | **Kevin Josh**     |

---

# ✅ Final Result

The **Process Termination Messages** interface successfully demonstrates the complete simulated process lifecycle:

```text
Process Creation
       ↓
Process Execution
       ↓
Process Monitoring
       ↓
Process Termination
       ↓
Termination Status
       ↓
Termination Message
```

The different termination scenarios allow the user to observe how process status, exit codes, signals, and termination messages change according to the selected operation.

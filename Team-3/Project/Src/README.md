# Process Termination Messages

## 📌 Purpose

The source code of the **Process Termination Messages** project implements the complete browser-based process-management simulation.

The project uses:

* **HTML5** for the application structure
* **CSS3** for the user interface and responsive design
* **JavaScript** for process simulation, execution, monitoring, termination, signal handling, and testing

---

## 📂 Source Code Structure

```text
src/
│
├── index.html
│
├── js/
│   └── script.js
│
└── css/
    └── style.css
```

> In the current project ZIP, these source files are located at the project root and inside the `js/` and `css/` folders. The `src/` structure above can be used if you organize the project into a dedicated source directory.

---

# 1. `index.html`

## Purpose

`index.html` defines the main structure of the Process Termination Messages application.

It contains the interface sections required for demonstrating the simulated process lifecycle.

### Main Interface Sections

* Dashboard
* Process Creation
* Process Execution
* Process Monitoring
* Process Termination
* Signal Handling
* Termination Status
* Termination Messages
* Testing & Error Identification
* Event Log

### Main User Operations

The HTML interface allows the user to:

* Enter process information
* Create a simulated process
* Select a process for execution
* Start process execution
* Select termination methods
* Send simulated signals
* View process status
* View termination information
* Run predefined tests

---

# 2. `js/script.js`

## Purpose

`script.js` contains the main application logic.

It controls the simulated process lifecycle and dynamically updates the interface.

### Main Responsibilities

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
Termination Messages
```

### Process Management

The JavaScript maintains simulated process information including:

* PID
* PPID
* Process name
* Status
* Runtime
* Reason
* Signal
* Exit code
* Creation information

### Process Creation

A new simulated process receives a generated PID.

The application stores created processes in its internal process collection.

### Process Execution

When execution starts:

```text
Created
   ↓
Running
   ↓
Completed
```

The interface displays a progress indicator while the simulated process is running.

### Normal Termination

Normal completion is represented by:

```text
Exit Code: 0
Status: Completed
```

### Error Termination

An execution error is represented by:

```text
Exit Code: 1
Status: Terminated
```

### User Termination

User interruption is simulated using:

```text
SIGINT
Exit Code: 130
```

### Signal Termination

Signal-based termination is simulated using:

```text
SIGTERM
Exit Code: 143
```

### SIGKILL

The interface also supports simulated:

```text
SIGKILL
Exit Code: 137
```

---

# 3. `css/style.css`

## Purpose

`style.css` controls the visual design and layout of the application.

### Main Styling Components

* Navigation/sidebar
* Dashboard
* Cards
* Forms
* Buttons
* Process tables
* Progress bars
* Status indicators
* Termination panels
* Signal controls
* Test controls
* Event logs

### Process Status Styling

Different visual styles are used for process states such as:

```text
Running
Completed
Terminated
```

### Termination Styling

Termination scenarios are visually separated into:

```text
Normal
Error
User
Signal
```

---

# 🔄 Source Code Workflow

The application follows this general workflow:

```text
                User
                  |
                  v
          Process Creation
                  |
                  v
          Process Execution
                  |
                  v
         Process Monitoring
                  |
                  v
        Select Termination
                  |
        +---------+---------+
        |         |         |
        v         v         v
     Normal     Error     Signal
        |         |         |
        +---------+---------+
                  |
                  v
        Termination Status
                  |
                  v
        Termination Message
```

---

# 🧪 Testing Module

The JavaScript source includes predefined test scenarios for:

### Test 1 — Normal Completion

```text
Process completes successfully
Exit Code: 0
```

### Test 2 — Execution Error

```text
Process terminates with an error
Exit Code: 1
```

### Test 3 — User Termination

```text
Signal: SIGINT
Exit Code: 130
```

### Test 4 — Signal Termination

```text
Signal: SIGTERM
Exit Code: 143
```

These tests allow the behavior of the interface to be demonstrated without requiring actual operating-system process manipulation.

---

# 🖥️ Running the Source Code

The application can be opened directly in a browser.

### Option 1 — Open HTML

Open:

```text
index.html
```

in a web browser.

### Option 2 — VS Code

1. Open the project in VS Code.
2. Open `index.html`.
3. Use **Live Server** if available.
4. Open the generated local webpage.

---

# ⚠️ Implementation Note

This source code implements a **frontend simulation** of process management.

The JavaScript does not directly execute Linux system calls such as:

```text
fork()
execvp()
waitpid()
kill()
exit()
```

Instead, the browser application simulates process states, PIDs, signals, exit codes, and termination messages.

This makes the project suitable for visually demonstrating Operating Systems process-management concepts through an interactive interface.

---

# 🎯 Source Code Objectives

The source implementation is designed to demonstrate:

* Process lifecycle concepts
* Parent-child process concepts
* Process creation
* Process execution
* Process monitoring
* Process termination
* Exit status
* Signal handling
* Termination messages
* Interactive testing

---

# 👥 Team Members

| Roll Number | Name               |
| ----------- | ------------------ |
| 2520030355  | **Ch Suraj Reddy** |
| 2520030387  | **Vanka Vijay**    |
| 2520030213  | **Kevin Josh**     |

---

# ✅ Summary

The source code provides the functional foundation of the **Process Termination Messages** interface.

`index.html` provides the structure, `script.js` provides the process simulation and application logic, and `style.css` provides the visual presentation and responsive layout.

Together, these files create an interactive demonstration of process creation, execution, monitoring, termination, signal handling, and termination-status reporting.

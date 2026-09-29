# Source Code (src)

## 📌 About the Project

**Process Termination Messages** is a browser-based project that demonstrates the concepts of process creation, process execution, process monitoring, process termination, signal handling, and termination messages.

The project provides an interactive interface where users can create simulated processes, execute them, monitor their status, terminate them in different ways, and view the corresponding termination information.

The project is developed using **HTML, CSS, and JavaScript**.

> **Note:** This project is a frontend simulation. It demonstrates Operating Systems process-management concepts through JavaScript and does not directly execute Linux system calls.

---

## 📂 What the `src` Folder Contains

The `src` folder contains the main source code required to run the project.

```text
src/
│
├── index.html
│
├── css/
│   └── style.css
│
└── js/
    └── script.js
```

### `index.html`

Contains the main structure of the project interface.

It includes sections for:

* Process Creation
* Process Execution
* Process Monitoring
* Process Termination
* Signal Handling
* Termination Status
* Termination Messages
* Testing & Error Identification

### `css/style.css`

Contains the complete styling of the project.

It controls:

* Dashboard layout
* Sidebar
* Cards
* Buttons
* Forms
* Tables
* Process status indicators
* Progress bars
* Termination sections
* Responsive design

### `js/script.js`

Contains the functionality and logic of the project.

It handles:

* Creating simulated processes
* Generating process IDs
* Executing processes
* Monitoring process status
* Process termination
* Signal simulation
* Exit codes
* Termination messages
* Testing scenarios
* Updating the interface dynamically

---

## ⚙️ Technologies Used

* **HTML5**
* **CSS3**
* **JavaScript**
* **Web Browser**

No additional libraries or frameworks are required to run the project.

---

## ▶️ How to Run

### Method 1 — Directly in Browser

1. Open the project folder.
2. Open the `src` folder.
3. Double-click:

```text
index.html
```

4. The project will open in your default web browser.

---

### Method 2 — Using VS Code

1. Open the project folder in **Visual Studio Code**.
2. Open the `src` folder.
3. Open:

```text
index.html
```

4. Right-click `index.html`.
5. Select **Open with Live Server**.

The project will open in your browser.

---

## 🖥️ How to Use the Project

After opening the application:

### 1. Create a Process

Go to **Process Creation**.

Enter the required process details and create a simulated process.

### 2. Execute the Process

Go to **Process Execution** and start the selected process.

The interface displays the process execution progress.

### 3. Monitor the Process

Go to **Process Monitoring** to view:

* PID
* PPID
* Process name
* Status
* Runtime
* Process reason

### 4. Terminate the Process

Use **Process Termination** to demonstrate different termination scenarios:

* Normal termination
* Error termination
* User termination
* Signal termination

### 5. View Termination Information

Open **Termination Status** to view the final status, exit code, signal, and termination reason.

### 6. Run Tests

Use **Testing & Error Identification** to run the predefined process termination demonstrations.

---

## 🔄 Project Flow

```text
Create Process
      ↓
Execute Process
      ↓
Monitor Process
      ↓
Terminate Process
      ↓
Check Termination Status
      ↓
Display Termination Message
```

---

## ⚠️ Important Note

The project is a **frontend simulation** of Operating Systems process-management concepts.

The browser application does not directly execute:

```text
fork()
execvp()
waitpid()
kill()
exit()
```

Instead, JavaScript simulates process IDs, process states, termination types, signals, and exit codes so that the concepts can be demonstrated interactively.

---

## 👥 Team Members

| Roll Number | Name               |
| ----------- | ------------------ |
| 2520030355  | **Ch Suraj Reddy** |
| 2520030387  | **Vanka Vijay**    |
| 2520030213  | **Kevin Josh**     |

---

## ✅ Summary

The `src` folder contains the complete frontend source code of the **Process Termination Messages** project.

The three main files work together as follows:

```text
index.html
    ↓
Project Interface

style.css
    ↓
Project Design

script.js
    ↓
Project Functionality
```

Together, they provide an interactive demonstration of process creation, execution, monitoring, termination, signal handling, and termination messages.

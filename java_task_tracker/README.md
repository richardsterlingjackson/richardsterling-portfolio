# Java Task Tracker

My first Java command-line application for tracking personal goals and daily progress. Built with Java 21 and SQLite, this tool helps you log tasks and completions, view summaries of tasks, so you can stay focused on what matters.

👈 [Back to Portfolio Overview](../README.md)

---

## Features

- Add tasks with optional goals
- Log daily completions
- View task summaries with completion counts
- Clear all tasks and logs
- SQLite-backed persistence
- Clean, readable code with onboarding clarity

---

## How to Run

Prerequisites
- Java 21+
- Maven 3.8+
- Git (for cloning the repository)

Install dependencies
```bash
git clone https://github.com/richardsterlingjackson/richardsterling-portfolio.git
cd richardsterling-portfolio/java_task_tracker
```

Run the program:
```bash
mvn clean compile
mvn exec:java
```

Package as Runnable JAR:
```bash
mvn package
java -jar target/java_task_tracker-0.1.0.jar
```

---

## File Structure

```
java_task_tracker/
├── src/
│   └── main/
│       └── java/
│           └── java_task_tracker/
│               ├── Main.java         # CLI entry point
│               ├── Database.java     # SQLite operations and task logic
│               ├── Task.java         # Task data model
│               └── TaskLog.java      # Log entry model
├── target/                           # Maven build output
├── pom.xml                           # Maven project configuration
├── README.md                         # Project documentation
├── setup-jdk-21.sh                   # Optional script to configure JDK 21
```

---

## Usage

```
1. Add a new task
2. Log today's completion(s)
3. View task summary
4. Clear all tasks and logs
5. Exit
```

---

## Example Output

```
Task name: Read 10 pages daily
Goal: Finish book by Friday
Task added successfully.
```

---

## Why This Project?

This app shows how Java can be used to interact directly with a relational database without relying on heavy frameworks or complex memory management. It's simple, intuitive, with low resource cost.

---

👈 [Back to Portfolio Overview](../README.md)

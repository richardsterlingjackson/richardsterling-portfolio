package java_task_tracker;

/* Task model — represents a task with a name, goal, and creation date.
   Used for storing and retrieving task data from the database. */
public class Task {
    public int id;           // Unique task ID
    public String name;      // Task name
    public String goal;      // Optional goal description
    public String createdAt; // Date the task was created

    // Constructor to initialize a Task object
    public Task(int id, String name, String goal, String createdAt) {
        this.id = id;        // Unique task ID
        this.name = name;    // Task name
        this.goal = goal;    // Optional goal description
        this.createdAt = createdAt; // Date the task was created
    }
}


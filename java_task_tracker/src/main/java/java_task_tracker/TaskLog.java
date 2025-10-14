package java_task_tracker;

/* TaskLog model — represents a log entry for a completed task.
   Each log stores the task ID and the date it was completed. */
public class TaskLog {
    public int id;        // Unique log ID
    public int taskId;    // ID of the task being logged
    public String date;   // Date of completion

    // Constructor to initialize a TaskLog object
    public TaskLog(int id, int taskId, String date) { // id, taskId, date 
        this.id = id;       // Unique log ID
        this.taskId = taskId; // ID of the task being logged
        this.date = date;   // Date of completion
    }
}


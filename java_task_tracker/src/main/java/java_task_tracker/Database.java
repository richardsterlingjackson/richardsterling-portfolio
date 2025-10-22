package java_task_tracker;

import java.sql.*;
import java.time.LocalDate;
import java.util.Scanner;

public class Database { // Database connection 
    private final String url; // JDBC connection string

    // Constructor — sets up database path and initializes schema
    public Database(String dbFile) { // tasks.db
        this.url = "jdbc:sqlite:" + dbFile; // SQLite connection 
        createTablesIfNeeded(); // Ensure tables exist
    }

    // Creates the tasks and logs tables if they don't already exist.
    private void createTablesIfNeeded() { 
        // SQL query to create tables
        String createTasks = """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                goal TEXT,
                created_at TEXT
            );
            """;

        // SQL query to create logs table
        String createLogs = """
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                date TEXT,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            );
            """;

        try (Connection conn = DriverManager.getConnection(url); // Connect to DB
             Statement stmt = conn.createStatement()) { // Create statement
            stmt.execute(createTasks); // Execute table creation
            stmt.execute(createLogs); // Execute table creation
        } catch (SQLException e) { // Handle SQL errors
            System.out.println("Error creating tables: " + e.getMessage());
        }
    }

    /* Add new task to the database and prompt 
       for task name and optional goal. */
    public void addTask(Scanner scanner) { // Add a new task
        System.out.print("Task name: ");
        String name = scanner.nextLine().trim(); // Get task name from user

        System.out.print("\nGoal (optional): ");
        String goal = scanner.nextLine().trim(); // Get task goal from user

        String createdAt = LocalDate.now().toString(); // Today's date

        // SQL query to insert new task
        String sql = "INSERT INTO tasks (name, goal, created_at) VALUES (?, ?, ?)";

        // Execute insertion
        try (Connection conn = DriverManager.getConnection(url); // Connect to DB
             PreparedStatement stmt = conn.prepareStatement(sql)) { // Prepare SQL statement
            stmt.setString(1, name); // Set task name
            stmt.setString(2, goal); // Set task goal
            stmt.setString(3, createdAt); // Set creation date
            stmt.executeUpdate(); // Execute insertion
            System.out.println("Task added successfully.");
        } catch (SQLException e) { // Handle SQL errors
            System.out.println("Error adding task: " + e.getMessage());
        }
    }

    // Logs today's task completion and gets the task ID.
    public void logTask(Scanner scanner) { // Log task completion
        System.out.print("Enter task ID to log: "); 
        int taskId = Integer.parseInt(scanner.nextLine()); // Get task ID from user
        String date = LocalDate.now().toString(); // Today's date

        // SQL query to insert log entry
        String sql = "INSERT INTO logs (task_id, date) VALUES (?, ?)";

        // Execute insertion
        try (Connection conn = DriverManager.getConnection(url); // Get DB connection
             PreparedStatement stmt = conn.prepareStatement(sql)) { // Prepare SQL statement
            stmt.setInt(1, taskId); // Set task ID
            stmt.setString(2, date); // Set date
            stmt.executeUpdate(); // Execute insertion
            System.out.println("Task logged for today.");
        } catch (SQLException e) { // Handle SQL errors
            System.out.println("Error logging task: " + e.getMessage());
        }
    }

    /*Displays summary of task completions and show 
      task name and total number of logs. */
    public void showSummary() { // Show task summary
        // SQL query to get task summary with completion counts
        String sql = """ 
            SELECT tasks.id, tasks.name, COUNT(logs.id) AS completions
            FROM tasks
            LEFT JOIN logs ON tasks.id = logs.task_id
            GROUP BY tasks.id;
            """;
        // Execute query and display results
        try (Connection conn = DriverManager.getConnection(url); // Connect to DB
             Statement stmt = conn.createStatement(); // Create statement
             ResultSet rs = stmt.executeQuery(sql)) { // Execute query

            boolean hasTasks = false; // Track if any tasks exist
            System.out.println("\nTask Summary:");
            while (rs.next()) { // Iterate through results
                hasTasks = true; // At least one task exists
                int id = rs.getInt("id"); // Task ID
                String name = rs.getString("name"); // Task name
                int count = rs.getInt("completions"); // Completion count
                System.out.printf("[%d] %s - %d completion(s)\n", id, name, count);
            }

            // Check if tasks exist
            if (!hasTasks) {  // No tasks found 
                System.out.println("\nNo tasks to show. Add a task to get started.");
            }

        } catch (SQLException e) { // Handle SQL errors
            System.out.println("Error retrieving summary: " + e.getMessage());
        }
    }

    /* Deletes all tasks and logs from the database. */
    public void clearAll() { // Clear all tasks and logs
        String deleteLogs = "DELETE FROM logs";  // SQL query to delete all logs
        String deleteTasks = "DELETE FROM tasks"; // SQL query to delete all tasks

        try (Connection conn = DriverManager.getConnection(url); // Connect to DB
             Statement stmt = conn.createStatement()) { // Create statement
            stmt.executeUpdate(deleteLogs); // Delete all logs
            stmt.executeUpdate(deleteTasks); // Delete all tasks
            System.out.println("\nAll tasks and logs have been cleared.");
        } catch (SQLException e) { // Handle SQL errors
            System.out.println("Error clearing data: " + e.getMessage());
        }
    }
}

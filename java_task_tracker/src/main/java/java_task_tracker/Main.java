package java_task_tracker;
import java.util.Scanner;

/* Main class — entry point for the Task Tracker CLI.
   Presents a menu and delegates actions to the Database class. */
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in); // For user input
        Database db = new Database("tasks.db");   // SQLite database file

        // Main loop — keeps running until user chooses to exit
        while (true) {
            // Menu header
            System.out.println("""
                \n╔════════════════════════════════════════════════════╗
                ║                                                    ║
                ║             WELCOME TO MY TASK TRACKER             ║
                ║                                                    ║
                ║    Track goals, log progress, and stay focused.    ║
                ║    Every task logged is a step toward mastery.     ║
                ║                                                    ║
                ╚════════════════════════════════════════════════════╝
                """);

            // Menu options
            System.out.println("1. Add a new task");
            System.out.println("2. Log today's completion(s)");
            System.out.println("3. View task summary");
            System.out.println("4. Clear all tasks and logs");
            System.out.println("5. Exit\n");
            System.out.print("Choose one of the options: ");

            String input = scanner.nextLine(); // Read user choice

            // Handle each menu option
            switch (input) {
                case "1" -> db.addTask(scanner);       // Add a new task
                case "2" -> db.logTask(scanner);       // Log today's completion
                case "3" -> db.showSummary();          // Show task summary
                case "4" -> {                          // Clear all tasks and logs
                    System.out.print("\nAre you sure you want to delete all tasks and logs? (yes/no): ");
                    String confirm = scanner.nextLine().trim().toLowerCase();
                    if (confirm.equals("yes")) {
                        db.clearAll();                 // Perform deletion
                    } else {
                        System.out.println("Clear operation cancelled.");
                    }
                }
                case "5" -> {
                    System.out.println("Goodbye!");
                    return;                            // Exit the program
                }
                default -> System.out.println("Invalid option. Please try again.");
            }
        }
    }
}

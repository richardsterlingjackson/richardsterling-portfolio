#include "Database.h"  // Handles all database operations
#include "User.h"      // Defines the User class
#include <iostream>    // For input/output

int main() {
    // Create a Database object using the file "users.db"
    // This automatically initializes the schema (creates the table if needed)
    Database db("users.db");

    int choice;  // Stores the user's menu selection

    // Main loop — keeps running until the user chooses to exit
    while (true) {
        // Display the menu
        std::cout << "\n=============================================\n";
        std::cout << "Hi. Welcome to my C++ User Database CLI Demo!\n";
        std::cout << "=============================================\n";
        std::cout << "This portfolio project showcases how C++ can\n";
        std::cout << "interact directly with a SQLite database\n";
        std::cout << "using clean, simple code, and good logic.\n";
        std::cout << "---------------------------------------------\n";
        std::cout << "Choose an option below to explore the app:\n\n";
        std::cout << "1. Add User\n";
        std::cout << "2. Delete User\n";
        std::cout << "3. Update User\n";
        std::cout << "4. List Users\n";
        std::cout << "5. Exit\n\n";
        std::cout << "Your choice: \n";
        
        // Get user input
        std::cin >> choice;
        std::cin.ignore();  // Clear leftover newline from input buffer

        // Handle each menu option
        if (choice == 1) {
            // Gather user input for a new user
            std::string name, address, gender, movie, book;
            std::cout << "\nName: "; std::getline(std::cin, name);
            std::cout << "Address: "; std::getline(std::cin, address);
            std::cout << "Gender: "; std::getline(std::cin, gender);
            std::cout << "Favorite Movie: "; std::getline(std::cin, movie);
            std::cout << "Favorite Book: "; std::getline(std::cin, book);

            // Create a User object with the input
            User user(name, address, gender, movie, book);

            // Add the user to the database
            db.addUser(user);

        } else if (choice == 2) {
            // Delete a user by name
            std::string name;
            std::cout << "Enter name to delete: ";
            std::getline(std::cin, name);
            db.deleteUser(name);

        } else if (choice == 3) {
            // Update an existing user's details
            std::string name, address, gender, movie, book;
            std::cout << "Enter name to update: ";
            // Get updated details
            std::getline(std::cin, name);
            std::cout << "New Address: "; std::getline(std::cin, address);
            std::cout << "New Gender: "; std::getline(std::cin, gender);
            std::cout << "New Favorite Movie: "; std::getline(std::cin, movie);
            std::cout << "New Favorite Book: "; std::getline(std::cin, book);

            // Create a User object with updated info
            User updated(name, address, gender, movie, book);

            // Update the user in the database
            db.updateUser(updated);

        } else if (choice == 4) {
            // List all users in the database
            db.listUsers();

        } else if (choice == 5) {
            // Exit the program
            std::cout << "Goodbye!\n";
            break;

        } else {
            // Handle invalid input
            std::cout << "Invalid choice. Please try again.\n";
        }
    }

    return 0;  // End of program
}

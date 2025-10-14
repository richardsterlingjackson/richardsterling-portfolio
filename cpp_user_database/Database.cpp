#include "Database.h"
#include <sqlite3.h>
#include <iostream>

// Constructor: initializes the Database with the given filename.
Database::Database(const std::string& filename) : filename(filename) {
    initialize();  // Create the users table if it doesn't exist.
}

// Create users table if it doesn't already exist.
// Ensure users table exists by calling initialize().
void Database::initialize() const {
    sqlite3* db;
    // Open the database file.
    if (sqlite3_open(filename.c_str(), &db) == SQLITE_OK) {
        // Create the users table if it doesn't exist.
        const char* sql = "CREATE TABLE IF NOT EXISTS users ("
                          "name TEXT PRIMARY KEY, "
                          "address TEXT, "
                          "gender TEXT, "
                          "movie TEXT, "
                          "book TEXT);";
        char* errMsg = nullptr;
        // Execute the SQL statement to create the table.
        if (sqlite3_exec(db, sql, nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "Error creating table: " << errMsg << "\n";
            sqlite3_free(errMsg);  // Free error message memory.
        }
        sqlite3_close(db);  // Close the database connection.
    } else {
        // Failed to open the database.
        std::cerr << "Failed to open database.\n";
    }
}

// Adds a new user to the database using a parameterized INSERT statement.
void Database::addUser(const User& user) {
    sqlite3* db;
    if (sqlite3_open(filename.c_str(), &db) == SQLITE_OK) {
        const char* sql = "INSERT INTO users (name, address, gender, movie, book) VALUES (?, ?, ?, ?, ?);";
        sqlite3_stmt* stmt;
        // Prepare the SQL statement.
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            // Bind user data to the statement parameters.
            sqlite3_bind_text(stmt, 1, user.getName().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 2, user.getAddress().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 3, user.getGender().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 4, user.getMovie().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 5, user.getBook().c_str(), -1, SQLITE_TRANSIENT);

            // Execute the statement.
            if (sqlite3_step(stmt) == SQLITE_DONE) {
                // Insertion succeeded.
                std::cout << "User added. Redirecting to main menu...\n";
            } else {
                // Insertion failed (e.g., duplicate name).
                std::cerr << "Failed to add user.\n";
            }
            sqlite3_finalize(stmt);  // Clean up the statement.
        }
        sqlite3_close(db);  // Close the database.
    }
}

// Deletes a user by name using a parameterized DELETE statement.
void Database::deleteUser(const std::string& name) {
    sqlite3* db;
    if (sqlite3_open(filename.c_str(), &db) == SQLITE_OK) {
        const char* sql = "DELETE FROM users WHERE name = ?;";
        sqlite3_stmt* stmt;
        // Prepare the SQL statement.
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, name.c_str(), -1, SQLITE_TRANSIENT);
            if (sqlite3_step(stmt) == SQLITE_DONE) {
                // Deletion succeeded.
                std::cout << "User deleted. Redirecting to main menu...\n";
            } else {
                // Deletion failed (e.g., user not found).
                std::cerr << "Failed to delete user.\n";
            }
            sqlite3_finalize(stmt);
        }
        sqlite3_close(db);
    }
}

// Updates an existing user's details using a parameterized UPDATE statement.
void Database::updateUser(const User& user) {
    sqlite3* db;
    if (sqlite3_open(filename.c_str(), &db) == SQLITE_OK) {
        const char* sql = "UPDATE users SET address = ?, gender = ?, movie = ?, book = ? WHERE name = ?;";
        sqlite3_stmt* stmt;
        // Prepare the SQL statement.
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, user.getAddress().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 2, user.getGender().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 3, user.getMovie().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 4, user.getBook().c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 5, user.getName().c_str(), -1, SQLITE_TRANSIENT);

            if (sqlite3_step(stmt) == SQLITE_DONE) {
                std::cout << "User updated. Redirecting to main menu...\n";
            } else {
                std::cerr << "Failed to update user.\n";
            }
            sqlite3_finalize(stmt);
        }
        sqlite3_close(db);
    }
}

// Lists all users in the database by querying and printing each row.
void Database::listUsers() const {
    sqlite3* db;
    if (sqlite3_open(filename.c_str(), &db) == SQLITE_OK) {
        const char* sql = "SELECT name, address, gender, movie, book FROM users;";
        sqlite3_stmt* stmt;
        // Prepare the SQL statement.
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) == SQLITE_OK) {
            // Iterate over each row returned by the query.
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                std::cout << "\nName: " << sqlite3_column_text(stmt, 0) << "\n"
                          << "Address: " << sqlite3_column_text(stmt, 1) << "\n"
                          << "Gender: " << sqlite3_column_text(stmt, 2) << "\n"
                          << "Favorite Movie: " << sqlite3_column_text(stmt, 3) << "\n"
                          << "Favorite Book: " << sqlite3_column_text(stmt, 4) << "\n"
                          << "------------------------\n";
            }
            sqlite3_finalize(stmt);
        }
        sqlite3_close(db);
    } else {
        std::cerr << "Failed to get list of users.\n";
    }
}

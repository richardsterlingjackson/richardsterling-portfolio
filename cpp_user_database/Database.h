#pragma once
#include "User.h"
#include <string>

// The Database class manages all interactions with the SQLite database.
// It provides methods to add, delete, update, and list users.
// Each method ensures proper resource management and error handling.
class Database {
public:
    // Constructor: stores the filename and initializes the schema.
    Database(const std::string& filename);

    // Adds a new user to the database.
    void addUser(const User& user);

    // Deletes a user by name.
    void deleteUser(const std::string& name);

    // Updates an existing user's details.
    void updateUser(const User& user);

    // Lists all users currently stored in the database.
    void listUsers() const;

private:
    // Path to the SQLite database file.
    std::string filename;

    // Ensures the users table exists — creates it if missing.
    void initialize() const;
};

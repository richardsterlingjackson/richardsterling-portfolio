#pragma once
#include <string>

// The User class represents a single person in our database.
// It encapsulates personal details and preferences, mapping directly to the SQLite table.
class User {
public:
    // Constructor: initializes all fields of the user.
    User(const std::string& name,
         const std::string& address,
         const std::string& gender,
         const std::string& movie,
         const std::string& book);

    // Accessor methods — these allow read-only access to user fields.
    std::string getName() const;
    std::string getAddress() const;
    std::string getGender() const;
    std::string getMovie() const;
    std::string getBook() const;

private:
    // Internal data members — these hold the actual user information.
    std::string name;
    std::string address;
    std::string gender;
    std::string movie;
    std::string book;
};

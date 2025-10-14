#include "User.h"

// Constructor: Initializes a User object with all personal attributes.
// Each parameter is passed by reference to avoid unnecessary copying.
// This constructor is used whenever we create or update a user in the database.
User::User(const std::string& name,
           const std::string& address,
           const std::string& gender,
           const std::string& movie,
           const std::string& book)
    : name(name), address(address), gender(gender), movie(movie), book(book) {
    // Initialization list ensures efficient assignment and clarity.
    // This approach also guarantees that all fields are set before any logic runs.
}

// Getter for the user's name.
// Used as a unique identifier (primary key) in the database.
std::string User::getName() const {
    return name;
}

// Getter for the user's address.
// This could be a physical location or any descriptive label.
std::string User::getAddress() const {
    return address;
}

// Getter for the user's gender.
// Stored as a string to allow flexibility in representation.
std::string User::getGender() const {
    return gender;
}

// Getter for the user's favorite movie.
// This adds a personal touch to the data model.
std::string User::getMovie() const {
    return movie;
}

// Getter for the user's favorite book.
// Like the movie field, this enriches the emotional depth of the user profile.
std::string User::getBook() const {
    return book;
}

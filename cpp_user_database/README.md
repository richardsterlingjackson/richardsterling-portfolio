# C++ User Database CLI

My first C++ command-line application that stores user profiles in a SQLite database. I built this C++ project to demonstrate good architecture with clean code and direct database interaction.

👈 [Back to Portfolio Overview](../README.md)

---

## Features

- **SQLite-backed persistence** — all user data is stored in a local `users.db` file.
- **Pointer-free design** — no raw memory management; scoped logic for clarity and safety.
- **CRUD operations** — add, update, delete, and list users from the database.
- **Interactive CLI** — intuitive prompts for entering and managing user data.
- **Portfolio-grade documentation** — designed for onboarding, learning, and emotional readability.

---

## Data Model

- `name` (primary key)
- `address`
- `gender`
- `favorite movie`
- `favorite book`

---

## How to Run

Prerequisites
- MSYS2 with MINGW64 shell
- SQLite3 development libraries

Install dependencies
```bash
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-sqlite3
```

Run the program:
```bash
g++ -o app main.cpp Database.cpp User.cpp -lsqlite3
./app
```

---

## File Structure

```
├── main.cpp           # CLI interface
├── Database.h/.cpp    # SQLite logic (add, update, delete, list)
├── User.h/.cpp        # Data model
├── users.db           # Auto-created SQLite database
└── README.md          # You're reading it!
```

---

## Why This Project?

This app shows how C++ can be used to interact directly with a relational database without relying on heavy frameworks or memory management.

---

👈 [Back to Portfolio Overview](../README.md)

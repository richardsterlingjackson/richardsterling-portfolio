Upgrade to Java 21

This small project was configured to compile and run on Java 21.

What I changed:

- Added a `pom.xml` configured with `<release>21</release>` and compiler properties.
- Restored a runnable `Main.java` that prints the Java runtime version.
- Added `setup-jdk-21.sh` — a helper script to download and install Temurin JDK 21 on Windows (requires Git Bash/WSL and admin rights).

How to build and run (Windows, bash):

```bash
# Build (requires Maven on PATH and JDK 21 installed)
mvn -f java_task_tracker package

# Run
java -jar java_task_tracker/target/java_task_tracker-0.1.0.jar
```

To install Temurin JDK 21 using the helper script (run in Git Bash / WSL):

```bash
cd java_task_tracker
bash setup-jdk-21.sh
# Then in the same session:
export JAVA_HOME=/c/jdk-21
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

Notes:
- I attempted to use the automated "GitHub Copilot app modernization" upgrade tool but it wasn't available in this environment; instead I configured the project manually for Java 21.
- If you want me to try upgrading other files or integrate Gradle instead, tell me which you prefer.

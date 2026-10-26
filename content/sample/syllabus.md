# CBSE Class 12 Computer Science (083) — Sample Syllabus Extract
## Unit 1: Computational Thinking and Programming – 2
Weightage: 40 marks. Suggested periods: 70.

### 1.1 Revision of Python basics
Recall variables, operators, data types, lists, tuples, dictionaries and standard input/output. Students should be able to trace short programs and predict output.

### 1.2 Functions
Need for functions. User-defined functions, arguments and parameters, default parameters, positional and keyword arguments. Returning values. Scope of variables: local and global. Use of `global` keyword. Python standard library modules: `math`, `random`, `statistics`. Recursion: simple recursive functions such as factorial, Fibonacci and sum of digits. Advantages and limitations of recursion compared with iteration.

### 1.3 Exception handling
Syntax errors versus exceptions. Built-in exceptions: `ValueError`, `TypeError`, `ZeroDivisionError`, `IndexError`, `KeyError`, `IOError`/`FileNotFoundError`. `try`, `except`, `else`, `finally`. Raising exceptions with `raise`. Why exception handling is preferred over letting a program crash during file or user-input operations.

### 1.4 File handling
Text files and binary files. Opening modes: `r`, `w`, `a`, `r+`. Reading with `read()`, `readline()`, `readlines()`. Writing with `write()` and `writelines()`. File pointer and `seek()`. CSV files using the `csv` module. Binary files using `pickle` dump and load. Practical tasks: create a student record file, search a record, append a record, and produce a simple report.

## Unit 2: Computer Networks
Weightage: 10 marks. Suggested periods: 15.

### 2.1 Evolution of networking
ARPANET, NSFNET, Internet. Distinction between Internet and WWW.

### 2.2 Data communication
Components: sender, receiver, message, transmission media, protocols. Measuring network performance: bandwidth, data transfer rate, latency.

### 2.3 Transmission media
Twisted pair, coaxial cable, optical fibre, infrared, radio wave, microwave, satellite. Guided versus unguided media. When fibre is preferred over copper.

### 2.4 Network devices
Modem, Ethernet card, RJ45, repeater, hub, switch, bridge, router, gateway. Collision domain ideas at a school level: why a switch is preferred over a hub.

### 2.5 Network types and topologies
PAN, LAN, MAN, WAN. Bus, star, tree, mesh. Advantages of star topology in school labs.

### 2.6 Network protocols
HTTP, FTP, PPP, SMTP, TCP/IP, POP3, IMAP, HTTPS, TELNET, VoIP. Difference between TCP and UDP. Role of IP addressing. Domain Name System.

## Unit 3: Database Management
Weightage: 20 marks. Suggested periods: 30.

### 3.1 Relational data model
Need for a database over files. Relation, tuple, attribute, domain, degree, cardinality. Keys: candidate, primary, alternate, foreign. Referential integrity.

### 3.2 Structured Query Language
Data types in MySQL: CHAR, VARCHAR, INT, FLOAT, DATE. Constraints: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, DEFAULT. DDL: CREATE DATABASE, CREATE TABLE, ALTER TABLE, DROP TABLE. DML: INSERT, UPDATE, DELETE, SELECT. Clauses: WHERE, ORDER BY, GROUP BY, HAVING. Aggregate functions: COUNT, MAX, MIN, AVG, SUM. Joins: equi-join and natural join. Distinction between WHERE and HAVING.

### 3.3 Interface of Python with SQL
Connecting Python with a SQL database using a connector module. Creating a cursor, executing queries, fetching rows, inserting records from a Python program.

## Internal assessment
Practical file, project, and viva. Project must use Python file handling or a database backend and solve a small real problem such as a library issue register or a quiz score manager.

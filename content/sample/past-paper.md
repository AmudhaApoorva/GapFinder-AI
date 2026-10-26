# Sample past paper items (adapted for practice)
Paper: Computer Science (083), Class XII. Time 3 hours. Maximum marks 70.

## Section A — 1 mark each
1. Which keyword is used in Python to define a function? (def)
2. What is the default return value of a Python function that has no return statement? (None)
3. Name the exception raised when a number is divided by zero. (ZeroDivisionError)
4. Which file mode is used to open a binary file for reading? (rb)
5. Expand SMTP. (Simple Mail Transfer Protocol)
6. Which device is used to connect two dissimilar networks? (Gateway)
7. What is the degree of a table with 5 columns and 20 rows? (5)
8. Which SQL clause is used to filter groups? (HAVING)

## Section B — 2 marks
9. Differentiate between local and global variables with a two-line Python example.
10. Rewrite a loop that computes factorial of n as a recursive function. State one limitation of recursion.
11. Give two differences between a hub and a switch.
12. Write an SQL command to display the names of students whose marks are greater than 80, sorted by name.
13. What is referential integrity? Give one example using STUDENT and SPORTS tables.

## Section C — 3 marks
14. Write a Python function `count_words(filename)` that reads a text file and returns the number of words. Mention one exception you would handle.
15. Write SQL to create a table EMPLOYEE with EmpId as primary key, Name not null, Dept, and Salary. Then write a query to display the average salary of each department having average salary above 40000.
16. Explain TCP versus UDP with one application of each.

## Section D — 4 marks
17. A binary file `student.dat` stores dictionaries with keys roll, name, percent. Write Python code to:
   (a) append one new record
   (b) display all records where percent is below 40
   Handle FileNotFoundError.
18. Consider tables ORDERS(OrderId, CustId, Amount) and CUSTOMER(CustId, CName, City). Write a join query to list customer name and amount for orders above 5000. Also write a query using GROUP BY to show total amount per city.

## Examiner notes (for diagnosis, not printed on the student paper)
Students commonly lose marks on: HAVING versus WHERE; pickle modes; default arguments placed before non-default; star versus bus topology when a lab is described; confusing router with switch; forgetting PRIMARY KEY cannot be NULL; using `split(',')` on CSV.

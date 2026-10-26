# Notes — File Handling and SQL
Source: textbook chapter summaries + class notes.

## Text files
Open a file with `open(filename, mode)`. Modes: `r` read (file must exist), `w` write (creates or overwrites), `a` append, `r+` read and write. Always close the file, or use a `with` block so it closes automatically.

```
with open("data.txt", "w") as f:
    f.write("hello\n")
```

`read()` returns the whole file as one string. `readline()` returns one line including the newline. `readlines()` returns a list of lines. `write()` writes a string. `writelines()` writes a list of strings but does not add newlines for you.

The file pointer marks the current position. `f.seek(0)` moves to the start. After reading to the end, a further `read()` returns an empty string until you seek back.

## CSV files
CSV means comma-separated values. Use the `csv` module.

```
import csv
with open("marks.csv", newline="") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
```

`csv.writer` with `writerow` writes one record. Do not parse CSV by blindly splitting on commas if fields may contain commas; that is why the module exists.

## Binary files and pickle
Python objects can be stored with `pickle.dump(object, file)` and read with `pickle.load(file)`. Open pickle files in `wb` and `rb` modes. Pickle is useful for a list of dictionaries representing student records. Searching still requires loading records and looping; pickle is not a database.

## Exceptions around files
`FileNotFoundError` occurs when opening for read if the path is wrong. `PermissionError` can occur on write. Wrap file programs in `try`/`except` and give a clear message. `finally` (or `with`) is the right place to close a file if you opened it without `with`.

## Relational model
A relation is a table. A tuple is a row. An attribute is a column. Degree is the number of attributes. Cardinality is the number of tuples. A primary key uniquely identifies a tuple and cannot be NULL. A foreign key in one table refers to the primary key of another table and enforces referential integrity: you cannot insert an order for a customer id that does not exist.

## SQL patterns that appear in board papers
Create:
```
CREATE TABLE STUDENT (
  Roll INT PRIMARY KEY,
  Name VARCHAR(30) NOT NULL,
  Stream VARCHAR(10),
  Marks FLOAT
);
```

Insert: `INSERT INTO STUDENT VALUES (1, 'Asha', 'Science', 88);`

Select with filter: `SELECT Name, Marks FROM STUDENT WHERE Stream = 'Science' ORDER BY Marks DESC;`

Aggregate: `SELECT Stream, AVG(Marks) FROM STUDENT GROUP BY Stream HAVING AVG(Marks) > 70;`

WHERE filters rows before grouping. HAVING filters groups after aggregation. This distinction is frequently tested.

Update: `UPDATE STUDENT SET Marks = Marks + 2 WHERE Stream = 'Commerce';`
Delete: `DELETE FROM STUDENT WHERE Marks < 33;`

Join (two tables STUDENT and SPORTS):
```
SELECT STUDENT.Name, SPORTS.Game
FROM STUDENT, SPORTS
WHERE STUDENT.Roll = SPORTS.Roll;
```

## Python with SQL
Typical flow: import connector, `connect` with host, user, password, database, create `cursor`, `execute` a SQL string, `commit` for INSERT/UPDATE/DELETE, `fetchall` or `fetchone` for SELECT, then close cursor and connection.

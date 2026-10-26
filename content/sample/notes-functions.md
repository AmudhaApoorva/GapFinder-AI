# Notes — Python Functions, Scope and Recursion
Source: student notebook, Class 12 CS, Chapter: Functions.

## Why functions exist
A function is a named block of statements that performs a specific task. Functions reduce repetition, make testing easier, and let us hide detail. In Python a function is created with `def`.

```
def area_rectangle(length, breadth):
    return length * breadth
```

`length` and `breadth` are parameters. When we call `area_rectangle(10, 4)`, the values 10 and 4 are arguments. The function returns 40.

## Parameter styles
Positional arguments are matched by order. Keyword arguments are matched by name: `area_rectangle(breadth=4, length=10)`. Default parameters must come after non-default parameters:

```
def greet(name, title="student"):
    return title + " " + name
```

If a function has no `return`, it returns `None`.

## Scope
A variable created inside a function is local. It is not visible outside. A variable created at the top of the file is global. To modify a global variable from inside a function we write `global count` before assigning. Reading a global variable does not need the `global` keyword.

Common exam trap: if a function assigns to a name, Python treats that name as local for the whole function. The line `x = x + 1` will raise `UnboundLocalError` if `x` was only defined globally and `global x` was not used.

## Standard library modules used in the syllabus
`math` provides `sqrt`, `ceil`, `floor`, `pow`, `pi`. `random` provides `random()`, `randint(a, b)`, `choice(seq)`. `statistics` provides `mean`, `median`, `mode`. Import examples:

```
import math
from random import randint
```

## Recursion
A recursive function calls itself on a smaller input and has a base case that stops the calls.

Factorial:
```
def fact(n):
    if n == 0 or n == 1:
        return 1
    return n * fact(n - 1)
```

Fibonacci:
```
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
```

Advantages: some problems such as tree traversal or factorial map naturally to recursion. Limitations: each call uses stack memory; Python has a recursion depth limit (often 1000); naive Fibonacci recursion repeats work and is slower than a loop. For Class 12, prefer a loop when the number of calls would grow quickly.

## Tracing a call
For `fact(3)`: `fact(3)` waits for `fact(2)`, which waits for `fact(1)`. `fact(1)` returns 1, then 2*1=2, then 3*2=6. Draw the call stack in exams when asked to dry-run.

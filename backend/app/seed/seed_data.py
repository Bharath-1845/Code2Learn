import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.curriculum import Mode, World, Topic, Lesson, MiniPractice
from app.models.challenge import Game, CodingChallenge, TestCase, BossBattle
from app.models.assessment import Assessment, Question
from app.models.progress import Achievement

ACHIEVEMENTS_DATA = [
    {
        "id": "ach-first-step",
        "code": "first_step",
        "title": "First Step",
        "description": "Completed your first lesson in Python!",
        "icon": "🌱",
        "category": "learning",
        "xp_bonus": 50
    },
    {
        "id": "ach-syntax-starter",
        "code": "syntax_starter",
        "title": "Syntax Starter",
        "description": "Mastered Python Foundations world.",
        "icon": "🐍",
        "category": "mastery",
        "xp_bonus": 100
    },
    {
        "id": "ach-streak-master",
        "code": "streak_master",
        "title": "On Fire",
        "description": "Maintained a 3-day learning streak.",
        "icon": "🔥",
        "category": "consistency",
        "xp_bonus": 100
    },
    {
        "id": "ach-loop-legend",
        "code": "loop_legend",
        "title": "Loop Legend",
        "description": "Conquered Loop Mountains without breaking a sweat.",
        "icon": "🔁",
        "category": "challenges",
        "xp_bonus": 150
    },
    {
        "id": "ach-warrior-rank",
        "code": "warrior_rank",
        "title": "Python Warrior",
        "description": "Reached Level 7: Python Warrior.",
        "icon": "⚔️",
        "category": "levels",
        "xp_bonus": 200
    },
    {
        "id": "ach-beginner-champ",
        "code": "beginner_champ",
        "title": "Beginner Champion",
        "description": "Defeated the Beginner Python Boss and completed all 7 Worlds!",
        "icon": "🏆",
        "category": "boss",
        "xp_bonus": 300
    }
]

WORLDS_DATA = [
    {
        "id": "world-1-foundations",
        "world_number": 1,
        "name": "Python Foundations",
        "slug": "foundations",
        "description": "Discover Python syntax, the magic of print(), comments, and running your first programs.",
        "icon": "🌱",
        "theme_color": "#10B981",
        "order_index": 1,
        "topic": {
            "id": "topic-intro-python",
            "title": "Introduction & Syntax",
            "slug": "intro-syntax",
            "description": "Learn basic syntax, print statements, and how Python executes instructions.",
            "order_index": 1,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-foundations",
                "title": "Welcome to Python",
                "content_markdown": """# Welcome to Python! 🚀

Python is an elegant, human-readable programming language used for web apps, artificial intelligence, data science, and automation.

### 1. The `print()` Function
To display text or values to the screen, we use the built-in `print()` function:

```python
print("Hello, World!")
print(42)
```

### 2. Comments
Comments start with a `#` symbol and are ignored by Python. They explain what code does:

```python
# This is a comment
print("Code runs here!")
```

### 3. Syntax Rules
- Python commands run from **top to bottom**.
- Strings are enclosed in single quotes `'...'` or double quotes `"..."`.
- Python is case-sensitive: `print()` works, but `Print()` will trigger an error!
"""
            },
            "practice": [
                {
                    "question_type": "mcq",
                    "prompt": "Which function outputs text to the console in Python?",
                    "options": ["output()", "console.log()", "print()", "echo()"],
                    "correct": "print()",
                    "explanation": "`print()` is Python's standard output function."
                },
                {
                    "question_type": "predict_output",
                    "prompt": "What does this code output?",
                    "code_snippet": "print(10 + 5)",
                    "options": ["10 + 5", "15", "105", "Error"],
                    "correct": "15",
                    "explanation": "Python evaluates the arithmetic expression 10 + 5 before printing."
                }
            ],
            "game": {
                "game_type": "quiz",
                "title": "Python Explorer: The Beacon",
                "description": "Power up the ancient coding beacon by selecting valid Python statements!",
                "instructions": "Answer the questions correctly to activate energy crystals.",
                "xp_reward": 50,
                "config": {
                    "theme": "space_explorer",
                    "rounds": [
                        {"prompt": "Which symbol begins a single-line comment in Python?", "options": ["//", "#", "/*", "--"], "correct": "#"},
                        {"prompt": "Is Python case-sensitive?", "options": ["Yes", "No"], "correct": "Yes"},
                        {"prompt": "How do you print 'Code2Learn'?", "options": ["print('Code2Learn')", "echo 'Code2Learn'", "System.out.println('Code2Learn')"], "correct": "print('Code2Learn')"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-hello-world",
                "title": "Mission 1: The Galactic Greeting",
                "slug": "galactic-greeting",
                "description": "Write a Python script that greets the galaxy with the exact required message.",
                "instructions": "Print exactly 'Hello, Code2Learn!' to standard output.",
                "starter_code": "# Write your print statement below\n",
                "difficulty": "easy",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "Hello, Code2Learn!", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "Why do we place quotes around 'Hello, Code2Learn!'?",
                    "options": ["Because it is a string literal", "To make it an integer", "To speed up execution", "It is optional"],
                    "correct_answer": "Because it is a string literal"
                }
            },
            "assessment": {
                "title": "Python Foundations Assessment",
                "description": "Prove your understanding of basic syntax and output.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "mcq",
                        "prompt": "Which line is a valid comment in Python?",
                        "options": ["# This is a comment", "// This is a comment", "/* This is a comment */", "<!-- Comment -->"],
                        "correct": "# This is a comment",
                        "difficulty": "easy",
                        "explanation": "# creates a comment in Python."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What will be printed?",
                        "code_snippet": "print('Python' + ' ' + 'Rocks')",
                        "options": ["Python Rocks", "Python+ +Rocks", "PythonRocks", "Error"],
                        "correct": "Python Rocks",
                        "difficulty": "easy",
                        "explanation": "+ concatenates strings together."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "What happens if you write `PRINT('Hi')`?",
                        "options": ["NameError because Python is case-sensitive", "It prints Hi", "SyntaxError", "Warning only"],
                        "correct": "NameError because Python is case-sensitive",
                        "difficulty": "medium",
                        "explanation": "Built-in function is lowercase `print`."
                    }
                ]
            }
        }
    },
    {
        "id": "world-2-variables",
        "world_number": 2,
        "name": "Variables & Data",
        "slug": "variables-data",
        "description": "Store and transform information using numbers, strings, booleans, and type conversion.",
        "icon": "📦",
        "theme_color": "#3B82F6",
        "order_index": 2,
        "topic": {
            "id": "topic-variables-types",
            "title": "Variables & Data Types",
            "slug": "variables-types",
            "description": "Understand containers for data: int, float, str, bool, and dynamic typing.",
            "order_index": 2,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-variables",
                "title": "Storing Data in Variables",
                "content_markdown": """# Variables & Data Types 📦

A **variable** is a labeled box that holds a value in memory.

### 1. Creating Variables
In Python, you create a variable simply by assigning a value using `=`:

```python
player_name = "Alex"
score = 150
speed = 9.8
is_alive = True
```

### 2. Core Data Types
- `str` (String): Text enclosed in quotes (`"hello"`)
- `int` (Integer): Whole numbers (`42`, `-5`)
- `float` (Float): Decimal numbers (`3.14`, `0.5`)
- `bool` (Boolean): Truth values (`True` or `False`)

### 3. Type Conversion
You can convert between types using `int()`, `str()`, and `float()`:

```python
age_str = "25"
age_num = int(age_str)  # Converts to integer 25
```
"""
            },
            "practice": [
                {
                    "question_type": "mcq",
                    "prompt": "Which of the following is a valid Python float?",
                    "options": ["10", "'10.5'", "10.5", "True"],
                    "correct": "10.5",
                    "explanation": "10.5 is a decimal number (float)."
                },
                {
                    "question_type": "predict_output",
                    "prompt": "What is the type of `x = 5 > 2`?",
                    "code_snippet": "x = 5 > 2\nprint(type(x))",
                    "options": ["<class 'int'>", "<class 'bool'>", "<class 'str'>", "<class 'float'>"],
                    "correct": "<class 'bool'>",
                    "explanation": "The comparison evaluates to True, which is a bool."
                }
            ],
            "game": {
                "game_type": "data_collector",
                "title": "Data Collector Arcade",
                "description": "Sort falling data items into the correct type containers: int, float, str, or bool!",
                "instructions": "Match each piece of data to its Python type.",
                "xp_reward": 50,
                "config": {
                    "items": [
                        {"value": "100", "type": "int"},
                        {"value": "3.1415", "type": "float"},
                        {"value": "'Phoenix'", "type": "str"},
                        {"value": "False", "type": "bool"},
                        {"value": "'42'", "type": "str"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-variable-swap",
                "title": "Mission 2: Character Profile Generator",
                "slug": "character-profile",
                "description": "Create three variables: name='Hero', level=5, hp=98.5. Print them formatted as 'Hero Level: 5 HP: 98.5'.",
                "instructions": "Assign the variables and print the single formatted line.",
                "starter_code": "# Define name, level, and hp\nname = 'Hero'\nlevel = 5\nhp = 98.5\n\n# Print the line\n",
                "difficulty": "easy",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "Hero Level: 5 HP: 98.5", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "What happens if you reassign `name = 10` later in Python?",
                    "options": ["Python allows it because it is dynamically typed", "Syntax error", "Type error", "Program crashes"],
                    "correct_answer": "Python allows it because it is dynamically typed"
                }
            },
            "assessment": {
                "title": "Variables & Data Types Assessment",
                "description": "Verify your understanding of type conversion and variable naming rules.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "mcq",
                        "prompt": "Which variable name is invalid in Python?",
                        "options": ["user_score", "2nd_place", "_total", "highScore"],
                        "correct": "2nd_place",
                        "difficulty": "easy",
                        "explanation": "Variable names cannot begin with a number."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What will `print(type('123'))` display?",
                        "code_snippet": "print(type('123'))",
                        "options": ["<class 'str'>", "<class 'int'>", "<class 'number'>", "<class 'text'>"],
                        "correct": "<class 'str'>",
                        "difficulty": "easy",
                        "explanation": "Anything in quotation marks is a string."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "What does `int(9.8)` return?",
                        "options": ["9", "10", "9.8", "Error"],
                        "correct": "9",
                        "difficulty": "medium",
                        "explanation": "int() truncates decimal places towards zero."
                    }
                ]
            }
        }
    },
    {
        "id": "world-3-operators",
        "world_number": 3,
        "name": "Operator Arena",
        "slug": "operators",
        "description": "Master arithmetic, comparison, logical, and membership operators to evaluate expressions.",
        "icon": "⚡",
        "theme_color": "#F59E0B",
        "order_index": 3,
        "topic": {
            "id": "topic-operators",
            "title": "Python Operators",
            "slug": "operators-arena",
            "description": "Compute and compare values using +, -, *, /, //, %, ==, !=, and, or, not, and in.",
            "order_index": 3,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-operators",
                "title": "Unleashing Operators",
                "content_markdown": """# Python Operators ⚡

Operators are special symbols that carry out computation.

### 1. Arithmetic Operators
- `+` (Addition), `-` (Subtraction), `*` (Multiplication)
- `/` (Division - returns float: `7 / 2 = 3.5`)
- `//` (Floor Division: `7 // 2 = 3`)
- `%` (Modulus / Remainder: `7 % 2 = 1`)
- `**` (Exponentiation: `2 ** 3 = 8`)

### 2. Comparison Operators
Compare values and return `True` or `False`:
- `==` (equal), `!=` (not equal)
- `<`, `>`, `<=`, `>=`

### 3. Logical Operators
- `and`: True if both operands are true
- `or`: True if at least one operand is true
- `not`: Inverts boolean value
"""
            },
            "practice": [
                {
                    "question_type": "predict_output",
                    "prompt": "What is the result of `17 % 5`?",
                    "options": ["3", "2", "3.4", "1"],
                    "correct": "2",
                    "explanation": "17 divided by 5 is 3 with remainder 2."
                },
                {
                    "question_type": "mcq",
                    "prompt": "Which operator performs floor division in Python?",
                    "options": ["/", "//", "%", "div"],
                    "correct": "//",
                    "explanation": "// returns the integer floor quotient."
                }
            ],
            "game": {
                "game_type": "operator_arena",
                "title": "Operator Arena Duels",
                "description": "Defeat rival gladiators by selecting the operator that makes equations true!",
                "instructions": "Choose the right operator before time runs out.",
                "xp_reward": 50,
                "config": {
                    "battles": [
                        {"left": "25", "right": "5", "target": "5.0", "options": ["/", "//", "%"], "correct": "/"},
                        {"left": "10", "right": "3", "target": "1", "options": ["%", "//", "-"], "correct": "%"},
                        {"left": "2", "right": "4", "target": "16", "options": ["**", "*", "+"], "correct": "**"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-calc-discount",
                "title": "Mission 3: Price Calculator",
                "slug": "price-calculator",
                "description": "A game item costs $80. A discount of 15% is applied. Write code to calculate and print the final price.",
                "instructions": "Print the final discounted price.",
                "starter_code": "price = 80\ndiscount = 0.15\n# Calculate final_price and print it\n",
                "difficulty": "easy",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "68.0", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "What is the difference between `=` and `==`?",
                    "options": ["`=` assigns a value, `==` compares equality", "`=` compares equality, `==` assigns", "They are identical", "None"],
                    "correct_answer": "`=` assigns a value, `==` compares equality"
                }
            },
            "assessment": {
                "title": "Operator Arena Assessment",
                "description": "Test your mastery of precedence, logical operations, and comparisons.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "output_prediction",
                        "prompt": "What does `print(10 > 5 and 3 < 1)` output?",
                        "code_snippet": "print(10 > 5 and 3 < 1)",
                        "options": ["True", "False", "None", "Error"],
                        "correct": "False",
                        "difficulty": "easy",
                        "explanation": "True and False evaluates to False."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "What is the result of `2 + 3 * 4` in Python?",
                        "options": ["20", "14", "24", "Error"],
                        "correct": "14",
                        "difficulty": "easy",
                        "explanation": "Multiplication has higher precedence than addition."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What does `print('py' in 'python')` evaluate to?",
                        "options": ["True", "False", "1", "Error"],
                        "correct": "True",
                        "difficulty": "medium",
                        "explanation": "'in' is a membership operator checking substrings."
                    }
                ]
            }
        }
    },
    {
        "id": "world-4-decisions",
        "world_number": 4,
        "name": "Decision Dungeon",
        "slug": "decision-making",
        "description": "Navigate dungeon paths using conditional logic: if, elif, else, and nested conditions.",
        "icon": "🏰",
        "theme_color": "#8B5CF6",
        "order_index": 4,
        "topic": {
            "id": "topic-conditions",
            "title": "Conditions & Branching",
            "slug": "conditions-branching",
            "description": "Control execution flow using if statements, elif branches, and else fallbacks.",
            "order_index": 4,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-conditions",
                "title": "Decision Making in Python",
                "content_markdown": """# Decision Making 🏰

Programs make choices using **conditional statements**.

### 1. The `if` Statement
Runs code only when a condition is `True`:

```python
score = 85
if score >= 50:
    print("You passed!")
```

### 2. `if-else`
Provides an alternative branch when condition is `False`:

```python
health = 0
if health > 0:
    print("Alive")
else:
    print("Game Over")
```

### 3. `elif` (Else If)
Checks multiple conditions in sequence:

```python
grade = 88
if grade >= 90:
    print("A")
elif grade >= 80:
    print("B")
else:
    print("C")
```

### 4. Indentation Matters!
Python uses 4 spaces (indentation) to define code blocks. Incorrect indentation causes an `IndentationError`.
"""
            },
            "practice": [
                {
                    "question_type": "predict_output",
                    "prompt": "What will this code print?",
                    "code_snippet": "x = 10\nif x > 15:\n    print('High')\nelif x == 10:\n    print('Exact')\nelse:\n    print('Low')",
                    "options": ["High", "Exact", "Low", "Nothing"],
                    "correct": "Exact",
                    "explanation": "x == 10 evaluates to True."
                },
                {
                    "question_type": "mcq",
                    "prompt": "Which keyword is used in Python for 'else if'?",
                    "options": ["elseif", "else if", "elif", "case"],
                    "correct": "elif",
                    "explanation": "Python contracts 'else if' into `elif`."
                }
            ],
            "game": {
                "game_type": "mission",
                "title": "Decision Dungeon: The Gatekeeper",
                "description": "Choose the right logical conditions to disarm traps and unlock castle doors!",
                "instructions": "Determine what the dungeon keeper decides based on player stats.",
                "xp_reward": 50,
                "config": {
                    "scenarios": [
                        {"stat": "keys=2, gold=50", "condition": "keys >= 1 and gold >= 30", "outcome": "Door Opens"},
                        {"stat": "mana=10, hp=5", "condition": "mana > 20 or hp > 20", "outcome": "Blocked"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-age-gate",
                "title": "Mission 4: Dungeon Gatekeeper",
                "slug": "gatekeeper-check",
                "description": "Given `level = 7`, print 'Master' if level >= 10, 'Knight' if level >= 5, and 'Apprentice' otherwise.",
                "instructions": "Write an if-elif-else block to evaluate `level = 7` and print the outcome.",
                "starter_code": "level = 7\n# Write your if-elif-else logic here\n",
                "difficulty": "medium",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "Knight", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "What happens if both `if` and `elif` conditions could be True?",
                    "options": ["Only the first matching branch executes", "Both execute", "The last one executes", "An error occurs"],
                    "correct_answer": "Only the first matching branch executes"
                }
            },
            "assessment": {
                "title": "Decision Making Assessment",
                "description": "Assess your skills with boolean branching and nested conditions.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "output_prediction",
                        "prompt": "What is the output?",
                        "code_snippet": "val = False\nif val:\n    print('Yes')\nelse:\n    print('No')",
                        "options": ["Yes", "No", "False", "None"],
                        "correct": "No",
                        "difficulty": "easy",
                        "explanation": "Since val is False, the else block runs."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "How does Python define the body of an if statement?",
                        "options": ["Indentation", "Curly braces {}", "Parentheses ()", "begin/end keywords"],
                        "correct": "Indentation",
                        "difficulty": "easy",
                        "explanation": "Python syntax relies strictly on consistent indentation."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What is printed?",
                        "code_snippet": "n = 12\nif n % 2 == 0 and n % 3 == 0:\n    print('Divisible by 6')\nelse:\n    print('Not divisible')",
                        "options": ["Divisible by 6", "Not divisible", "Error", "12"],
                        "correct": "Divisible by 6",
                        "difficulty": "medium",
                        "explanation": "12 is divisible by both 2 and 3."
                    }
                ]
            }
        }
    },
    {
        "id": "world-5-loops",
        "world_number": 5,
        "name": "Loop Mountains",
        "slug": "loops",
        "description": "Climb through repeating challenges using for loops, while loops, range(), break, and continue.",
        "icon": "🏔️",
        "theme_color": "#EC4899",
        "order_index": 5,
        "topic": {
            "id": "topic-loops",
            "title": "Loops & Iteration",
            "slug": "loops-iteration",
            "description": "Repeat operations efficiently using for and while loops without duplicate code.",
            "order_index": 5,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-loops",
                "title": "Mastering Loops",
                "content_markdown": """# Loop Mountains 🏔️

Loops allow you to repeat a block of code multiple times.

### 1. The `for` Loop with `range()`
Use `for` when you know how many times to repeat:

```python
for i in range(5):
    print(i)  # Prints 0, 1, 2, 3, 4
```

`range(start, stop, step)`:
- `range(1, 6)` -> `1, 2, 3, 4, 5`
- `range(0, 10, 2)` -> `0, 2, 4, 6, 8`

### 2. The `while` Loop
Repeats as long as a condition stays `True`:

```python
count = 3
while count > 0:
    print(count)
    count -= 1
print("Blast off!")
```

### 3. Loop Controls
- `break`: Exits the loop immediately
- `continue`: Skips the rest of the current iteration and jumps to the next
"""
            },
            "practice": [
                {
                    "question_type": "predict_output",
                    "prompt": "How many times does this loop run?",
                    "code_snippet": "for i in range(3):\n    print('Step')",
                    "options": ["2 times", "3 times", "4 times", "Infinite"],
                    "correct": "3 times",
                    "explanation": "range(3) produces 0, 1, and 2 (exactly 3 iterations)."
                },
                {
                    "question_type": "mcq",
                    "prompt": "Which keyword immediately terminates a loop?",
                    "options": ["stop", "exit", "break", "return"],
                    "correct": "break",
                    "explanation": "break ends loop execution immediately."
                }
            ],
            "game": {
                "game_type": "mission",
                "title": "Loop Mountains: The Gear Tower",
                "description": "Turn the gears by specifying the correct loop range to power the summit lift!",
                "instructions": "Predict how many rotations each gear executes.",
                "xp_reward": 50,
                "config": {
                    "gears": [
                        {"range": "range(1, 5)", "rotations": 4},
                        {"range": "range(0, 10, 2)", "rotations": 5},
                        {"range": "range(5)", "rotations": 5}
                    ]
                }
            },
            "challenge": {
                "id": "chal-loop-sum",
                "title": "Mission 5: Mountain Ascent Counter",
                "slug": "sum-first-numbers",
                "description": "Calculate and print the sum of numbers from 1 to 5 inclusive using a for loop.",
                "instructions": "Initialize `total = 0`, iterate with `for num in range(1, 6):`, and print `total`.",
                "starter_code": "total = 0\n# Use a for loop to calculate the sum of 1 through 5\n\nprint(total)\n",
                "difficulty": "medium",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "15", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "Why is the stop parameter in `range(1, 6)` equal to 6?",
                    "options": ["Because range() excludes the stop value", "To make it faster", "It includes 6", "It is an error"],
                    "correct_answer": "Because range() excludes the stop value"
                }
            },
            "assessment": {
                "title": "Loop Mountains Assessment",
                "description": "Evaluate your understanding of loops, ranges, and loop termination.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "output_prediction",
                        "prompt": "What does this code print?",
                        "code_snippet": "for i in range(1, 4):\n    print(i, end=' ')",
                        "options": ["1 2 3 ", "1 2 3 4 ", "0 1 2 3 ", "4 "],
                        "correct": "1 2 3 ",
                        "difficulty": "medium",
                        "explanation": "range(1, 4) produces 1, 2, 3."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "What happens if a while loop condition never becomes False?",
                        "options": ["Infinite loop", "It stops after 100 iterations", "SyntaxError", "It restarts automatically"],
                        "correct": "Infinite loop",
                        "difficulty": "easy",
                        "explanation": "A while loop continues indefinitely until its condition evaluates to False or break is called."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What is the output of this loop?",
                        "code_snippet": "for x in [10, 20, 30]:\n    if x == 20:\n        break\n    print(x)",
                        "options": ["10", "10 20", "20", "30"],
                        "correct": "10",
                        "difficulty": "medium",
                        "explanation": "The loop terminates when x reaches 20, printing only 10."
                    }
                ]
            }
        }
    },
    {
        "id": "world-6-collections",
        "world_number": 6,
        "name": "Collection City",
        "slug": "collections",
        "description": "Manage inventories and structured data using lists, tuples, sets, and dictionaries.",
        "icon": "🏙️",
        "theme_color": "#06B6D4",
        "order_index": 6,
        "topic": {
            "id": "topic-collections",
            "title": "Lists & Dictionaries",
            "slug": "lists-dictionaries",
            "description": "Store ordered sequences in lists and key-value pairs in dictionaries.",
            "order_index": 6,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-collections",
                "title": "Mastering Python Collections",
                "content_markdown": """# Collection City 🏙️

Organize groups of items using Python's built-in data structures.

### 1. Lists `[]`
Ordered, mutable (changeable) sequences:

```python
inventory = ["sword", "shield", "potion"]
inventory.append("bow")
print(inventory[0])  # 'sword' (0-indexed)
print(len(inventory))  # 4
```

### 2. Dictionaries `{}`
Key-value pairs for structured attributes:

```python
hero = {
    "name": "Luna",
    "level": 12,
    "class": "Mage"
}
print(hero["name"])  # Luna
hero["hp"] = 100     # Add new key
```

### 3. Tuples `()` and Sets `{}`
- **Tuple**: Ordered, immutable: `coords = (10, 20)`
- **Set**: Unordered, unique elements: `unique_ids = {1, 2, 2, 3}  # {1, 2, 3}`
"""
            },
            "practice": [
                {
                    "question_type": "predict_output",
                    "prompt": "What is the output of `nums = [10, 20, 30]; print(nums[1])`?",
                    "options": ["10", "20", "30", "IndexError"],
                    "correct": "20",
                    "explanation": "Python indexing begins at index 0, so index 1 is 20."
                },
                {
                    "question_type": "mcq",
                    "prompt": "Which method adds an item to the end of a list?",
                    "options": ["add()", "push()", "append()", "insert()"],
                    "correct": "append()",
                    "explanation": "list.append(x) adds x to the end of the list."
                }
            ],
            "game": {
                "game_type": "mission",
                "title": "Collection City: Inventory Vault",
                "description": "Manage backpack items and hero stats using list slicing and dictionary keys!",
                "instructions": "Predict the state of the hero's inventory after operations.",
                "xp_reward": 50,
                "config": {
                    "puzzles": [
                        {"operation": "items = ['apple', 'gem']; items.append('key')", "target": "len(items)", "answer": "3"},
                        {"operation": "data = {'gold': 50}; data['gold'] += 25", "target": "data['gold']", "answer": "75"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-inventory-filter",
                "title": "Mission 6: Inventory Counter",
                "slug": "inventory-counter",
                "description": "Given `scores = [12, 45, 78, 23, 90]`, print the maximum score in the list.",
                "instructions": "Find and print the highest number from the list `scores` using Python's `max()` function.",
                "starter_code": "scores = [12, 45, 78, 23, 90]\n# Find and print the max score\n",
                "difficulty": "medium",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "90", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "Can a Python dictionary have duplicate keys?",
                    "options": ["No, duplicate keys overwrite previous values", "Yes", "Only if values are different", "Syntax error"],
                    "correct_answer": "No, duplicate keys overwrite previous values"
                }
            },
            "assessment": {
                "title": "Collections Assessment",
                "description": "Demonstrate knowledge of lists, dictionaries, indexing, and mutability.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "output_prediction",
                        "prompt": "What does `len(['a', 'b', 'c'])` return?",
                        "options": ["3", "2", "4", "'3'"],
                        "correct": "3",
                        "difficulty": "easy",
                        "explanation": "len() returns the number of items in a collection."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "Which data structure is immutable in Python?",
                        "options": ["List", "Dictionary", "Tuple", "Set"],
                        "correct": "Tuple",
                        "difficulty": "medium",
                        "explanation": "Tuples cannot be modified after creation."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What will `person = {'name': 'Sam'}; print(person.get('age', 20))` output?",
                        "options": ["20", "None", "KeyError", "Sam"],
                        "correct": "20",
                        "difficulty": "medium",
                        "explanation": ".get(key, default) returns the default value 20 when the key doesn't exist."
                    }
                ]
            }
        }
    },
    {
        "id": "world-7-functions",
        "world_number": 7,
        "name": "Function Factory",
        "slug": "functions",
        "description": "Construct modular, reusable code using functions, parameters, return values, and scope.",
        "icon": "⚙️",
        "theme_color": "#6366F1",
        "order_index": 7,
        "topic": {
            "id": "topic-functions",
            "title": "Functions & Modularity",
            "slug": "functions-modularity",
            "description": "Encapsulate logic into reusable blocks using def, arguments, and return values.",
            "order_index": 7,
            "xp_reward": 50,
            "lesson": {
                "id": "lesson-functions",
                "title": "Writing Python Functions",
                "content_markdown": """# Function Factory ⚙️

Functions are reusable recipes that take inputs, perform actions, and return results.

### 1. Defining a Function
Use the `def` keyword:

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("Avery")
print(message)  # Hello, Avery!
```

### 2. Parameters & Arguments
- **Parameters**: Variables declared in the function definition (`name`)
- **Arguments**: Real values passed when calling the function (`"Avery"`)

### 3. `print()` vs `return`
- `print()` simply displays something to the user.
- `return` sends a value back to whoever called the function so it can be saved or used in further calculations!

```python
def square(n):
    return n * n

ans = square(4)  # ans is 16
```
"""
            },
            "practice": [
                {
                    "question_type": "predict_output",
                    "prompt": "What does this code output?",
                    "code_snippet": "def add(a, b):\n    return a + b\n\nprint(add(4, 6))",
                    "options": ["10", "46", "None", "Error"],
                    "correct": "10",
                    "explanation": "add(4, 6) calculates 4 + 6 and returns 10."
                },
                {
                    "question_type": "mcq",
                    "prompt": "What keyword sends a value back from a function to its caller?",
                    "options": ["send", "output", "return", "yield"],
                    "correct": "return",
                    "explanation": "The return keyword passes the result back."
                }
            ],
            "game": {
                "game_type": "mission",
                "title": "Function Factory: The Assembly Line",
                "description": "Calibrate the factory robot by selecting functions with the correct return signatures!",
                "instructions": "Predict the return value of each factory robot module.",
                "xp_reward": 50,
                "config": {
                    "modules": [
                        {"signature": "def multiply(x, y): return x * y", "call": "multiply(3, 4)", "output": "12"},
                        {"signature": "def is_even(n): return n % 2 == 0", "call": "is_even(7)", "output": "False"}
                    ]
                }
            },
            "challenge": {
                "id": "chal-calc-cube",
                "title": "Mission 7: The Power Generator",
                "slug": "cube-generator",
                "description": "Define a function `power(base, exp)` that returns `base ** exp`. Then call `print(power(2, 5))`.",
                "instructions": "Write the function `power` and print the result of `power(2, 5)`.",
                "starter_code": "def power(base, exp):\n    # Return base raised to exp\n    pass\n\n# Call and print power(2, 5)\n",
                "difficulty": "medium",
                "xp_reward": 75,
                "test_cases": [
                    {"input": "", "expected": "32", "is_hidden": False}
                ],
                "concept_q": {
                    "question": "What is the return value of a Python function that does not contain a return statement?",
                    "options": ["None", "0", "False", "Error"],
                    "correct_answer": "None"
                }
            },
            "assessment": {
                "title": "Functions Assessment",
                "description": "Prove your understanding of parameters, return values, and function scope.",
                "passing_threshold": 0.70,
                "time_limit_minutes": 10,
                "xp_reward": 100,
                "questions": [
                    {
                        "question_type": "output_prediction",
                        "prompt": "What is printed?",
                        "code_snippet": "def test():\n    x = 5\ntest()\n# What would print(x) do here?",
                        "options": ["NameError because x is local to test", "5", "None", "0"],
                        "correct": "NameError because x is local to test",
                        "difficulty": "medium",
                        "explanation": "Variables defined inside a function have local scope."
                    },
                    {
                        "question_type": "mcq",
                        "prompt": "Which keyword defines a function in Python?",
                        "options": ["def", "function", "fn", "fun"],
                        "correct": "def",
                        "difficulty": "easy",
                        "explanation": "def keyword defines functions in Python."
                    },
                    {
                        "question_type": "output_prediction",
                        "prompt": "What will `print(bool(''))` output?",
                        "code_snippet": "print(bool(''))",
                        "options": ["False", "True", "None", "Error"],
                        "correct": "False",
                        "difficulty": "medium",
                        "explanation": "An empty string is falsy in Python."
                    }
                ]
            }
        }
    }
]

BOSS_BATTLE_DATA = {
    "world_id": "world-7-functions",
    "title": "The Python Beginner Boss: Pythos the Synthesizer",
    "boss_name": "Pythos the Synthesizer",
    "boss_avatar": "🐉",
    "description": "Prove your ultimate mastery of Python Foundations, Variables, Operators, Conditions, Loops, Collections, and Functions in one grand multi-phase showdown!",
    "storyline": "Pythos stands between you and the Intermediate Realm. To defeat him, you must synthesize every concept you learned: parse player stats, compute damage multipliers, filter fallen beasts, and return the victorious message!",
    "xp_reward": 250,
    "stages": [
        {
            "stage_number": 1,
            "title": "Stage 1: Variable & Operator Shield Break",
            "prompt": "Calculate damage: `base_dmg = 50`, `crit_rate = 1.5`, `defense = 15`. Calculate `final_dmg = int((base_dmg * crit_rate) - defense)` and print it.",
            "expected_output": "60"
        },
        {
            "stage_number": 2,
            "title": "Stage 2: Loop & Collection Minion Wave",
            "prompt": "Given minions HP list `[25, 40, 60]`. Use a loop to subtract 20 damage from each and print the sum of remaining HP.",
            "expected_output": "65"
        },
        {
            "stage_number": 3,
            "title": "Stage 3: Function of Final Triumph",
            "prompt": "Define a function `victory_shout(hero, score)` that returns `f'{hero} conquered the arena with {score} XP!'`. Call and print `victory_shout('Master', 250)`.",
            "expected_output": "Master conquered the arena with 250 XP!"
        }
    ]
}


async def seed_database(db: AsyncSession):
    # Seed Modes
    modes_to_seed = [
        {"id": "beginner", "name": "Beginner Mode", "description": "Master core Python fundamentals through 7 interactive worlds.", "order_index": 1, "is_locked": False},
        {"id": "intermediate", "name": "Intermediate Mode", "description": "Object-oriented programming, error handling, modules, and file I/O.", "order_index": 2, "is_locked": True},
        {"id": "advanced", "name": "Advanced Mode", "description": "Generators, decorators, async concurrency, and performance tuning.", "order_index": 3, "is_locked": True},
    ]

    for m_info in modes_to_seed:
        m_res = await db.execute(select(Mode).where(Mode.id == m_info["id"]))
        if not m_res.scalar_one_or_none():
            mode = Mode(
                id=m_info["id"],
                name=m_info["name"],
                description=m_info["description"],
                order_index=m_info["order_index"],
                is_locked_by_default=m_info["is_locked"]
            )
            db.add(mode)

    # Seed Achievements
    for ach in ACHIEVEMENTS_DATA:
        ach_res = await db.execute(select(Achievement).where(Achievement.id == ach["id"]))
        if not ach_res.scalar_one_or_none():
            db.add(Achievement(
                id=ach["id"],
                code=ach["code"],
                title=ach["title"],
                description=ach["description"],
                icon=ach["icon"],
                category=ach["category"],
                xp_bonus=ach["xp_bonus"]
            ))

    # Seed Worlds, Topics, Lessons, Practices, Games, Challenges, Assessments
    for w_data in WORLDS_DATA:
        # Check world
        w_res = await db.execute(select(World).where(World.id == w_data["id"]))
        curr_world = w_res.scalar_one_or_none()
        if not curr_world:
            curr_world = World(
                id=w_data["id"],
                mode_id="beginner",
                world_number=w_data["world_number"],
                name=w_data["name"],
                slug=w_data["slug"],
                description=w_data["description"],
                icon=w_data["icon"],
                theme_color=w_data["theme_color"],
                order_index=w_data["order_index"]
            )
            db.add(curr_world)
            await db.flush()

        # Seed Topic
        t_data = w_data["topic"]
        t_res = await db.execute(select(Topic).where(Topic.id == t_data["id"]))
        curr_topic = t_res.scalar_one_or_none()
        if not curr_topic:
            curr_topic = Topic(
                id=t_data["id"],
                world_id=curr_world.id,
                title=t_data["title"],
                slug=t_data["slug"],
                description=t_data["description"],
                order_index=t_data["order_index"],
                xp_reward=t_data["xp_reward"]
            )
            db.add(curr_topic)
            await db.flush()

        # Seed Lesson
        les_data = t_data["lesson"]
        les_res = await db.execute(select(Lesson).where(Lesson.id == les_data["id"]))
        if not les_res.scalar_one_or_none():
            db.add(Lesson(
                id=les_data["id"],
                topic_id=curr_topic.id,
                title=les_data["title"],
                content_markdown=les_data["content_markdown"],
                order_index=1
            ))

        # Seed Mini Practices
        for idx, p in enumerate(t_data["practice"], start=1):
            p_id = f"practice-{curr_topic.id}-{idx}"
            p_res = await db.execute(select(MiniPractice).where(MiniPractice.id == p_id))
            if not p_res.scalar_one_or_none():
                db.add(MiniPractice(
                    id=p_id,
                    topic_id=curr_topic.id,
                    question_type=p["question_type"],
                    prompt=p["prompt"],
                    code_snippet=p.get("code_snippet"),
                    options_json=json.dumps(p.get("options")),
                    correct_answer_json=json.dumps(p["correct"]),
                    explanation=p.get("explanation"),
                    order_index=idx
                ))

        # Seed Game
        g_data = t_data["game"]
        g_id = f"game-{curr_topic.id}"
        g_res = await db.execute(select(Game).where(Game.id == g_id))
        if not g_res.scalar_one_or_none():
            db.add(Game(
                id=g_id,
                topic_id=curr_topic.id,
                game_type=g_data["game_type"],
                title=g_data["title"],
                description=g_data["description"],
                instructions=g_data["instructions"],
                config_json=json.dumps(g_data["config"]),
                xp_reward=g_data["xp_reward"]
            ))

        # Seed Challenge
        c_data = t_data["challenge"]
        c_res = await db.execute(select(CodingChallenge).where(CodingChallenge.id == c_data["id"]))
        curr_challenge = c_res.scalar_one_or_none()
        if not curr_challenge:
            curr_challenge = CodingChallenge(
                id=c_data["id"],
                topic_id=curr_topic.id,
                title=c_data["title"],
                slug=c_data["slug"],
                description=c_data["description"],
                instructions=c_data["instructions"],
                starter_code=c_data["starter_code"],
                difficulty=c_data["difficulty"],
                time_limit_seconds=300,
                xp_reward=c_data["xp_reward"],
                post_concept_question_json=json.dumps(c_data.get("concept_q"))
            )
            db.add(curr_challenge)
            await db.flush()

            # Seed Test Cases
            for tc_idx, tc in enumerate(c_data["test_cases"], start=1):
                db.add(TestCase(
                    id=f"tc-{curr_challenge.id}-{tc_idx}",
                    challenge_id=curr_challenge.id,
                    input_data=tc["input"],
                    expected_output=tc["expected"],
                    is_hidden=tc["is_hidden"]
                ))

        # Seed Assessment
        a_data = t_data["assessment"]
        a_id = f"assess-{curr_topic.id}"
        a_res = await db.execute(select(Assessment).where(Assessment.id == a_id))
        curr_assess = a_res.scalar_one_or_none()
        if not curr_assess:
            curr_assess = Assessment(
                id=a_id,
                topic_id=curr_topic.id,
                title=a_data["title"],
                description=a_data["description"],
                passing_threshold=a_data["passing_threshold"],
                time_limit_minutes=a_data["time_limit_minutes"],
                xp_reward=a_data["xp_reward"]
            )
            db.add(curr_assess)
            await db.flush()

            # Seed Questions
            for q_idx, q in enumerate(a_data["questions"], start=1):
                db.add(Question(
                    id=f"q-{curr_assess.id}-{q_idx}",
                    assessment_id=curr_assess.id,
                    topic_id=curr_topic.id,
                    question_type=q["question_type"],
                    prompt=q["prompt"],
                    code_snippet=q.get("code_snippet"),
                    options_json=json.dumps(q.get("options")),
                    correct_answer_json=json.dumps(q["correct"]),
                    explanation=q.get("explanation"),
                    difficulty=q["difficulty"]
                ))

    # Seed Boss Battle
    boss_res = await db.execute(select(BossBattle).where(BossBattle.id == "boss-beginner"))
    if not boss_res.scalar_one_or_none():
        db.add(BossBattle(
            id="boss-beginner",
            world_id=BOSS_BATTLE_DATA["world_id"],
            title=BOSS_BATTLE_DATA["title"],
            boss_name=BOSS_BATTLE_DATA["boss_name"],
            boss_avatar=BOSS_BATTLE_DATA["boss_avatar"],
            description=BOSS_BATTLE_DATA["description"],
            storyline=BOSS_BATTLE_DATA["storyline"],
            challenges_json=json.dumps(BOSS_BATTLE_DATA["stages"]),
            xp_reward=BOSS_BATTLE_DATA["xp_reward"]
        ))

    await db.commit()
    print("Database seeding completed successfully for all 7 Worlds + Boss Battle!")

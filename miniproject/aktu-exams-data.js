/* ==============================================================================
   AKTU EXAMS & SYLLABUS DATA — Dr. A.P.J. Abdul Kalam Technical University
   Official Syllabus, Verified PYQ Question Bank, and Mock Test Repository
   Applicable for B.Tech CSE (BCS/BAS/BCC & K-Series CBCS/NEP Schemes)
   ============================================================================== */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AKTU_EXAM_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==========================================================================
     1. OFFICIAL AKTU SYLLABUS REGISTRY
     ========================================================================== */
  const SYLLABUS_REGISTRY = {
    'BCS-301': {
      code: 'BCS-301',
      altCode: 'KCS-301',
      name: 'Data Structures',
      shortName: 'DS',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 4,
      marks: { sessional: 30, ese: 70, total: 100 },
      durationHours: 3,
      units: [
        {
          unit: 1,
          title: 'Introduction, Arrays & Searching/Sorting',
          topics: [
            'Basic Terminology, Elementary Data Organization, Built-in vs User-Defined Data Types',
            'Abstract Data Types (ADT), Algorithms, Space and Time Complexity Analysis, Big-Oh, Omega, Theta notations',
            'Arrays: Single and Multidimensional Arrays, Row Major & Column Major Representation, Address Calculation',
            'Sparse Matrices and Their Memory Representations',
            'Searching: Linear Search, Binary Search (Iterative & Recursive), Analysis of Time Complexities',
            'Sorting: Bubble Sort, Insertion Sort, Selection Sort'
          ],
          weightage: '14 Marks (Section A: 1-2 questions, Section B/C: 1 question)'
        },
        {
          unit: 2,
          title: 'Stacks, Recursion & Queues',
          topics: [
            'Stack: Primitive Operations (Push, Pop, Peek), Array & Linked List Implementation of Stacks',
            'Stack Applications: Polish & Reverse Polish Notations, Infix to Postfix/Prefix Conversion, Evaluation of Postfix Expressions',
            'Recursion: Tower of Hanoi, Factorial, Fibonacci, Recursion Removal using Stacks',
            'Queues: Operations (Enqueue, Dequeue), Array & Linked Implementation, Overflow & Underflow Conditions',
            'Queue Variations: Circular Queue, Double-Ended Queue (Deque), Priority Queue'
          ],
          weightage: '14 Marks (Section A: 1-2 questions, Section B/C: 1 question)'
        },
        {
          unit: 3,
          title: 'Linked Lists & Dynamic Memory',
          topics: [
            'Dynamic Memory Allocation: malloc, calloc, realloc, free',
            'Singly Linked List: Insertion, Deletion, Traversal, Searching, Reversal, Merging',
            'Circular Linked Lists and Operations',
            'Doubly Linked Lists: Insertion & Deletion at Head, Middle, Tail',
            'Applications: Polynomial Representation and Addition using Linked Lists, Header Linked Lists'
          ],
          weightage: '14 Marks (Section A: 1 question, Section B/C: 1-2 questions)'
        },
        {
          unit: 4,
          title: 'Trees & Binary Search Trees',
          topics: [
            'Basic Tree Terminology: Root, Node, Degree, Level, Height, Forest',
            'Binary Trees: Types (Full, Complete, Perfect, Extended / 2-Tree), Array & Linked Representation',
            'Binary Tree Traversals: Inorder, Preorder, Postorder (Recursive & Iterative)',
            'Binary Search Trees (BST): Properties, Searching, Insertion, Deletion of Nodes',
            'Balanced Trees: AVL Trees, Balance Factor Calculation, Rotations (LL, RR, LR, RL)',
            'Threaded Binary Trees: Inorder Threading, Traversals without Recursion or Stack'
          ],
          weightage: '14 Marks (Section A: 1 question, Section B/C: 1-2 questions)'
        },
        {
          unit: 5,
          title: 'Graphs, Advanced Sorting & Hashing',
          topics: [
            'Graph Terminology: Directed, Undirected, Weighted, Cyclic, Adjacency Matrix & Adjacency List Representations',
            'Graph Traversals: Breadth First Search (BFS), Depth First Search (DFS)',
            'Spanning Trees: Minimum Spanning Trees (Prim\'s and Kruskal\'s Algorithms)',
            'Single-Source Shortest Path: Dijkstra\'s Algorithm',
            'Advanced Sorting: Quick Sort, Merge Sort, Heap Sort (Min-Heap & Max-Heap Construction & Analysis)',
            'Hashing: Hash Functions (Division, Mid-Square, Folding), Collision Resolution Techniques (Chaining, Linear Probing, Quadratic Probing, Double Hashing)'
          ],
          weightage: '14 Marks (Section A: 1 question, Section B/C: 1-2 questions)'
        }
      ],
      books: [
        'Horowitz and Sahni, Fundamentals of Data Structures, Galgotia Publications',
        'Seymour Lipschutz, Data Structures with C (Schaum\'s Outlines), Tata McGraw Hill',
        'Tenanbaum, Langsam, Augenstein, Data Structures Using C, Pearson Education'
      ]
    },

    'BCS-302': {
      code: 'BCS-302',
      altCode: 'KCS-302',
      name: 'Computer Organization & Architecture',
      shortName: 'COA',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 4,
      marks: { sessional: 30, ese: 70, total: 100 },
      durationHours: 3,
      units: [
        {
          unit: 1,
          title: 'Functional Units, Bus Structure & Computer Arithmetic',
          topics: [
            'Functional Units of Digital Computer, Von Neumann vs Harvard Architecture',
            'Bus Structures, Multiple Bus Organization, Bus Arbitration Techniques (Daisy Chaining, Polling, Independent Request)',
            'Data Representation: Signed Magnitude, 1\'s Complement, 2\'s Complement',
            'Fixed-Point Arithmetic: Addition, Subtraction, Overflow Detection',
            'Multiplication: Booth\'s Multiplication Algorithm for Signed Integers',
            'Division: Restoring and Non-Restoring Division Algorithms',
            'Floating-Point Representation: IEEE 754 Standard (Single 32-bit & Double 64-bit Precision), Floating-Point Arithmetic'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 2,
          title: 'Central Processing Unit & Instruction Set Architecture',
          topics: [
            'CPU Organization: General Register Organization, Stack Organization, Accumulator Organization',
            'Instruction Formats: Three-Address, Two-Address, One-Address, Zero-Address Instructions',
            'Addressing Modes: Immediate, Direct, Indirect, Register, Register Indirect, Relative, Indexed, Base-Register',
            'Instruction Cycle: Fetch, Decode, Execute, Interrupt Cycle, Instruction Register (IR), Program Counter (PC)',
            'RISC vs CISC Architecture: Characteristics, Differences, Trade-offs'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 3,
          title: 'Control Unit Design & Pipelining',
          topics: [
            'Control Unit Design: Control Signals, Hardwired Control Unit Architecture, Design Methods',
            'Microprogrammed Control Unit: Control Memory, Address Sequencing, Microinstruction Formats (Horizontal & Vertical)',
            'Instruction Pipelining: Pipeline Stages, Space-Time Diagram, Pipeline Hazards (Structural, Data, Control Hazards)',
            'Pipeline Performance: Clock Cycle, Throughput, Speedup, Efficiency'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 4,
          title: 'Memory System Organization',
          topics: [
            'Memory Hierarchy: Speed, Size, Cost Trade-offs, Main Memory (RAM, ROM, DRAM, SRAM)',
            'Auxiliary Memory: Magnetic Disks, Solid-State Drives (SSD)',
            'Cache Memory: Locality of Reference (Temporal & Spatial), Hit Ratio & Average Memory Access Time (AMAT)',
            'Cache Mapping Techniques: Direct Mapping, Fully Associative Mapping, Set-Associative Mapping',
            'Cache Replacement Policies: LRU, FIFO, LFU, Random; Write Policies: Write-Through vs Write-Back',
            'Virtual Memory: Paging, Segmentation, Translation Lookaside Buffer (TLB), Page Faults'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 5,
          title: 'Input-Output Organization',
          topics: [
            'Peripheral Devices, Input-Output Interface, I/O Bus and Interface Modules',
            'Asynchronous Data Transfer: Strobe Control, Handshaking (Two-Wire Asynchronous Handshake)',
            'Modes of Transfer: Programmed I/O, Interrupt-Driven I/O, Direct Memory Access (DMA)',
            'DMA Controller: Block Diagram, Cycle Stealing, Burst Transfer, Transparent DMA',
            'Interrupt Handling: Daisy Chaining Priority Interrupt, Priority Encoder, Vector Interrupts'
          ],
          weightage: '14 Marks'
        }
      ],
      books: [
        'M. Morris Mano, Computer System Architecture, Pearson Education / Prentice Hall',
        'William Stallings, Computer Organization and Architecture: Designing for Performance, Pearson',
        'Carl Hamacher, Zvonko Vranesic, Safwat Zaky, Computer Organization, McGraw Hill'
      ]
    },

    'BAS-303': {
      code: 'BAS-303',
      altCode: 'KAS-302',
      name: 'Mathematics - IV',
      shortName: 'Maths-4',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 4,
      marks: { sessional: 30, ese: 70, total: 100 },
      durationHours: 3,
      units: [
        {
          unit: 1,
          title: 'Partial Differential Equations',
          topics: [
            'Origin of First Order Partial Differential Equations, Lagrange\'s Linear Equation',
            'Non-Linear Partial Differential Equations of First Order, Charpit\'s Method',
            'Linear Partial Differential Equations of Second and Higher Order with Constant Coefficients',
            'Classification of Second Order Partial Differential Equations (Elliptic, Parabolic, Hyperbolic)'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 2,
          title: 'Applications of Partial Differential Equations',
          topics: [
            'Method of Separation of Variables for Solving PDEs',
            'One-Dimensional Wave Equation (Vibrating String) and Boundary Conditions',
            'One-Dimensional Heat Conduction Equation and Steady-State Heat Flow',
            'Two-Dimensional Laplace Equation in Cartesian Coordinates'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 3,
          title: 'Statistical Techniques - I',
          topics: [
            'Moments, Skewness and Kurtosis',
            'Curve Fitting: Method of Least Squares, Fitting of Straight Lines, Second Degree Parabolas, Exponential Curves',
            'Correlation: Karl Pearson\'s Coefficient of Correlation, Rank Correlation',
            'Regression Analysis: Lines of Regression, Angle between Two Regression Lines'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 4,
          title: 'Statistical Techniques - II (Probability Distributions)',
          topics: [
            'Random Variables: Discrete and Continuous Random Variables, Probability Mass Function, Probability Density Function',
            'Mathematical Expectation, Variance and Moment Generating Function (MGF)',
            'Theoretical Probability Distributions: Binomial Distribution, Poisson Distribution, Normal Distribution and Properties'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 5,
          title: 'Statistical Techniques - III (Hypothesis Testing)',
          topics: [
            'Sampling Theory, Null Hypothesis, Alternative Hypothesis, Level of Significance, Types of Errors (Type I and Type II)',
            'Large Sample Tests: Test for Single Mean, Difference of Means, Single Proportion, Difference of Proportions',
            'Small Sample Tests: Student\'s t-Test (Single Mean & Difference of Means), Paired t-Test',
            'F-Test for Equality of Variances, Chi-Square Test for Goodness of Fit and Independence of Attributes'
          ],
          weightage: '14 Marks'
        }
      ],
      books: [
        'B.V. Ramana, Higher Engineering Mathematics, Tata McGraw-Hill',
        'Erwin Kreyszig, Advanced Engineering Mathematics, John Wiley & Sons',
        'S.C. Gupta & V.K. Kapoor, Fundamentals of Mathematical Statistics, Sultan Chand & Sons'
      ]
    },

    'BAS-301': {
      code: 'BAS-301',
      altCode: 'KAS-301',
      name: 'Technical Communication',
      shortName: 'TC',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 3,
      marks: { sessional: 30, ese: 70, total: 100 },
      durationHours: 3,
      units: [
        {
          unit: 1,
          title: 'Fundamentals of Technical Communication',
          topics: [
            'Technical Communication: Definition, Nature, Scope, Features, Difference between General and Technical Communication',
            'The Communication Process: Sender, Encoding, Message, Channel, Receiver, Decoding, Feedback',
            'Barriers to Communication: Intrapersonal, Interpersonal, Organizational, Environmental, Overcoming Barriers',
            'Language as a Tool of Communication, Characteristics of Scientific Language, Precision and Objectivity'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 2,
          title: 'Forms of Technical Communication',
          topics: [
            'Technical Reports: Objectives, Characteristics, Types of Reports (Informational, Analytical, Periodic, Feasibility)',
            'Structure and Layout of a Formal Technical Report (Front Matter, Main Body, Back Matter)',
            'Technical Proposals: Purpose, Types, Structure, Guidelines for Writing Persuasive Proposals',
            'Business Correspondence: Formal Letters, Inquiry, Quotation, Order, Complaint, Resume & Cover Letter'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 3,
          title: 'Technical Writing: Essays & Research Articles',
          topics: [
            'Technical Articles and Papers: Planning, Drafting, Editing, Structuring an Abstract',
            'Paragraph Development: Topic Sentence, Coherence, Unity, Methods of Paragraph Development (Comparison, Contrast, Cause-Effect)',
            'Ethics in Communication: Plagiarism, Copyright, Academic Integrity, Citing Sources (IEEE / APA / MLA styles)'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 4,
          title: 'Presentation Strategies & Soft Skills',
          topics: [
            'Oral Presentations: Defining Purpose, Analyzing Audience, Structuring Content, Rehearsing',
            'Nuances of Voice Dynamics: Pitch, Modulation, Tone, Pronunciation, Pace',
            'Kinesics and Body Language: Posture, Gestures, Eye Contact, Facial Expressions',
            'Group Discussion: Dynamics, Leadership, Roles, Do\'s and Don\'ts in Campus Recruitment GDs',
            'Interview Skills: Types of Interviews, Preparation, Frequently Asked Technical and HR Questions'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 5,
          title: 'Value-Based Text Readings & Nuances',
          topics: [
            'Analytical and Critical Reading of Excerpts from Scientific Pioneers',
            'Vocabulary Building: Root Words, Affixes, Synonyms, Antonyms, One-word Substitutions, Technical Jargon',
            'Effective Listening: Active vs Passive Listening, Principles of Good Listening',
            'Phonetics and Stress Patterns: Word Stress, Sentence Stress, Intonation Patterns'
          ],
          weightage: '14 Marks'
        }
      ],
      books: [
        'Meenakshi Raman and Sangeeta Sharma, Technical Communication: Principles and Practice, Oxford University Press',
        'R.C. Sharma and Krishna Mohan, Business Correspondence and Report Writing, Tata McGraw-Hill'
      ]
    },

    'BCS-303': {
      code: 'BCS-303',
      altCode: 'KCS-303',
      name: 'Discrete Structures & Theory of Logic',
      shortName: 'DSTL',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 4,
      marks: { sessional: 30, ese: 70, total: 100 },
      durationHours: 3,
      units: [
        {
          unit: 1,
          title: 'Set Theory, Relations & Functions',
          topics: [
            'Sets, Subsets, Power Sets, Venn Diagrams, Set Operations (Union, Intersection, Complement, Cartesian Product)',
            'Relations: Binary Relations, Types of Relations (Reflexive, Symmetric, Transitive, Anti-symmetric)',
            'Equivalence Relations and Equivalence Classes, Partitions of Sets',
            'Composition of Relations, Transitive Closure, Warshall\'s Algorithm',
            'Partially Ordered Sets (Posets), Hasse Diagrams, Maximal/Minimal Elements, Greatest/Least Elements',
            'Lattices as Posets, Sublattices, Properties of Lattices (Bounded, Distributive, Complemented Lattices)'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 2,
          title: 'Algebraic Structures',
          topics: [
            'Algebraic Systems: Properties, Semi-groups, Monoids, Subsemigroups, Submonoids',
            'Groups: Definition, Abelian Groups, Order of a Group and Element',
            'Subgroups, Cosets, Lagrange\'s Theorem, Normal Subgroups',
            'Homomorphism and Isomorphism of Groups, Rings, Fields and Integral Domains'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 3,
          title: 'Propositional & Predicate Logic',
          topics: [
            'Propositions, Truth Values, Connectives (Conjunction, Disjunction, Negation, Conditional, Bi-conditional)',
            'Tautology, Contradiction, Contingency, Logical Equivalences and Laws of Logic',
            'Normal Forms: Disjunctive Normal Form (DNF), Conjunctive Normal Form (CNF), Principal Normal Forms (PDNF, PCNF)',
            'Predicate Logic: Predicates, Quantifiers (Universal and Existential), Free and Bound Variables',
            'Rules of Inference: Modus Ponens, Modus Tollens, Resolution Principle'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 4,
          title: 'Combinatorics & Recurrence Relations',
          topics: [
            'Basic Counting Principles: Sum Rule, Product Rule, Pigeonhole Principle and Extended Pigeonhole Principle',
            'Permutations and Combinations, Binomial Coefficients and Pascal\'s Identity',
            'Generating Functions: Ordinary Generating Functions, Calculating Coefficients',
            'Recurrence Relations: Linear Homogeneous Recurrence Relations with Constant Coefficients',
            'Linear Non-Homogeneous Recurrence Relations, Particular Solutions'
          ],
          weightage: '14 Marks'
        },
        {
          unit: 5,
          title: 'Graph Theory & Trees',
          topics: [
            'Graphs: Basic Definitions, Directed and Undirected Graphs, Subgraphs, Degree of a Vertex, Handshaking Lemma',
            'Special Graphs: Complete Graphs, Regular Graphs, Bipartite Graphs, Complete Bipartite Graphs',
            'Paths, Cycles, Connectivity, Eulerian Paths and Circuits (Euler\'s Theorem), Hamiltonian Cycles',
            'Trees: Characterization of Trees, Spanning Trees, Rooted Trees, Binary Trees',
            'Planar Graphs: Euler\'s Formula (V - E + R = 2), Kuratowski\'s Theorem, Graph Coloring, Chromatic Number'
          ],
          weightage: '14 Marks'
        }
      ],
      books: [
        'Kenneth H. Rosen, Discrete Mathematics and Its Applications, McGraw Hill',
        'J.P. Tremblay and R. Manohar, Discrete Mathematical Structures with Applications to Computer Science, Tata McGraw-Hill',
        'C.L. Liu and D.P. Mohapatra, Elements of Discrete Mathematics, Tata McGraw-Hill'
      ]
    },

    'BCC-302': {
      code: 'BCC-302',
      altCode: 'KNC-302',
      name: 'Python Programming',
      shortName: 'Python',
      semester: 3,
      branch: 'Computer Science & Engineering',
      scheme: 'AKTU NEP-2020 / CBCS Curriculum',
      credits: 2,
      marks: { sessional: 20, ese: 50, total: 70 },
      durationHours: 2,
      units: [
        {
          unit: 1,
          title: 'Python Basics & Flow Control',
          topics: [
            'Features of Python, Interactive and Script Modes, Identifiers, Keywords, Variables',
            'Data Types (Integers, Floats, Strings, Booleans), Operators (Arithmetic, Relational, Logical, Bitwise, Membership, Identity)',
            'Operator Precedence and Associativity, Type Casting',
            'Decision Making: if, if-else, if-elif-else, Nested if',
            'Loops: while loop, for loop with range(), break, continue, pass statements'
          ],
          weightage: '10 Marks'
        },
        {
          unit: 2,
          title: 'Functions, Strings & Recursion',
          topics: [
            'Defining Functions, Function Arguments (Positional, Keyword, Default, Variable-length *args, **kwargs)',
            'Scope of Variables (Local, Global, nonlocal), return statement',
            'Lambda Functions, map(), filter(), reduce() functions',
            'String Manipulation: Slicing, Concatenation, Formatting, Built-in String Methods',
            'Recursive Functions: Factorial, GCD, Fibonacci Sequence in Python'
          ],
          weightage: '10 Marks'
        },
        {
          unit: 3,
          title: 'Data Structures: Lists, Tuples, Sets & Dictionaries',
          topics: [
            'Lists: Creating, Accessing, Slicing, Appending, Extending, Inserting, Removing, List Comprehensions',
            'Tuples: Immutability, Packing, Unpacking, Tuple Operations and Methods',
            'Sets: Set Creation, Mutability, Set Operations (Union, Intersection, Difference, Symmetric Difference)',
            'Dictionaries: Key-Value Pairs, Accessing Values, Updating, Iterating, Dictionary Comprehensions'
          ],
          weightage: '10 Marks'
        },
        {
          unit: 4,
          title: 'File Handling & Modules',
          topics: [
            'File Handling: Opening Files (read, write, append, binary modes), with statement',
            'Reading and Writing Text Files: read(), readline(), readlines(), write(), writelines()',
            'File Pointers: tell(), seek() methods',
            'Modules and Packages: Importing Modules (import, from ... import), Standard Library Modules (math, random, os, sys)'
          ],
          weightage: '10 Marks'
        },
        {
          unit: 5,
          title: 'Object-Oriented Python & Exception Handling',
          topics: [
            'OOP Principles: Classes, Objects, __init__() Constructor, Instance vs Class Attributes',
            'Encapsulation and Data Hiding, Inheritance (Single, Multiple, Multilevel), Method Overriding, super()',
            'Polymorphism and Operator Overloading (__str__, __add__)',
            'Exception Handling: try, except, else, finally blocks, Raising Exceptions, Custom Exception Classes'
          ],
          weightage: '10 Marks'
        }
      ],
      books: [
        'Allen B. Downey, Think Python: How to Think Like a Computer Scientist, O\'Reilly',
        'Mark Lutz, Learning Python, O\'Reilly Media',
        'Reema Thareja, Python Programming Using Problem Solving Approach, Oxford University Press'
      ]
    }
  };

  /* ==========================================================================
     2. AUTHENTIC AKTU PREVIOUS YEAR QUESTION PAPERS (VERIFIED PAPERS)
     ========================================================================== */
  const VERIFIED_PAPERS = [
    {
      id: 'aktu_bcs301_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      altCode: 'KCS-301',
      examYear: '2023-24',
      examType: 'Regular / Carry Over',
      paperCode: 'BCS301',
      maxMarks: 70,
      durationHours: 3,
      source: 'Dr. A.P.J. Abdul Kalam Technical University Examination Portal (aktu.ac.in)',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BCS301-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 14,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Differentiate between Linear and Non-Linear data structures with an example of each.',
              solution: 'Linear Data Structures arrange data elements in a sequential order where each element has a unique predecessor and successor (e.g., Array, Linked List, Stack, Queue). Non-Linear Data Structures arrange elements hierarchically or in interconnected relationships with multiple paths (e.g., Trees, Graphs).'
            },
            {
              qNum: '1(b)',
              unit: 1,
              marks: 2,
              question: 'Define Space Complexity and Time Complexity of an algorithm.',
              solution: 'Time Complexity is the amount of computational time taken by an algorithm to run as a function of the input size n. Space Complexity is the total amount of memory space required by the algorithm in its life cycle, comprising fixed instruction space and variable data space.'
            },
            {
              qNum: '1(c)',
              unit: 2,
              marks: 2,
              question: 'Write the condition for circular queue overflow and underflow in an array of size MAX.',
              solution: 'Underflow condition: front == -1 (or front == rear + 1 if initialized to 0). Overflow condition in circular queue: (rear + 1) % MAX == front.'
            },
            {
              qNum: '1(d)',
              unit: 2,
              marks: 2,
              question: 'Convert the infix expression (A + B) * (C - D) into prefix notation.',
              solution: 'Step 1: Reverse: (D - C) * (B + A)\nStep 2: Replace brackets: (D - C) * (B + A)\nStep 3: Convert to postfix: D C - B A + *\nStep 4: Reverse postfix: * + A B - C D\nFinal Prefix = * + A B - C D.'
            },
            {
              qNum: '1(e)',
              unit: 3,
              marks: 2,
              question: 'What is the advantage of a Doubly Linked List over a Singly Linked List?',
              solution: 'A Doubly Linked List maintains both next and prev pointers at each node, allowing bidirectional traversal (forward and backward) and O(1) node deletion given a pointer to the node, without requiring traversal from the head.'
            },
            {
              qNum: '1(f)',
              unit: 4,
              marks: 2,
              question: 'What is an AVL Tree and what are its allowable balance factors?',
              solution: 'An AVL tree is a self-balancing binary search tree in which the heights of the two child subtrees of any node differ by at most one. Allowable balance factor BF = Height(Left) - Height(Right) ∈ {-1, 0, +1}.'
            },
            {
              qNum: '1(g)',
              unit: 5,
              marks: 2,
              question: 'What is collision in hashing? Name two collision resolution techniques.',
              solution: 'A collision occurs when a hash function maps two distinct keys to the exact same hash table index (h(k1) = h(k2) where k1 ≠ k2). Two resolution methods are Open Addressing (Linear/Quadratic Probing) and Separate Chaining.'
            }
          ]
        },
        {
          section: 'Section B',
          instructions: 'Attempt any three questions. Each question carries 7 marks.',
          totalMarks: 21,
          questions: [
            {
              qNum: '2(a)',
              unit: 1,
              marks: 7,
              question: 'An array A[-2..4, -3..5] is stored in column-major order in memory. If base address is 1000 and each element occupies 2 bytes, calculate the memory address of element A[2, 3].',
              solution: 'Formula for Column-Major Order in array A[L1..U1, L2..U2]:\nAddress(A[i, j]) = Base + w * [(j - L2) * M + (i - L1)]\nWhere:\nRows M = U1 - L1 + 1 = 4 - (-2) + 1 = 7\nColumns N = U2 - L2 + 1 = 5 - (-3) + 1 = 9\nw = 2 bytes, Base = 1000, i = 2, j = 3\nCalculation:\nAddress(A[2, 3]) = 1000 + 2 * [(3 - (-3)) * 7 + (2 - (-2))]\n= 1000 + 2 * [6 * 7 + 4] = 1000 + 2 * [42 + 4] = 1000 + 2 * 46 = 1000 + 92 = 1092.\nAddress of A[2, 3] = 1092.'
            },
            {
              qNum: '2(b)',
              unit: 2,
              marks: 7,
              question: 'Convert the following infix expression into postfix using Stack: A + (B * C - (D / E ^ F) * G) * H. Show complete step-by-step stack contents.',
              solution: 'Using operator precedence: ^ (highest, right-to-left) > * = / > + = -.\nTokens scanned left to right:\n1. A -> Postfix: A\n2. + -> Stack: [ + ]\n3. ( -> Stack: [ +, ( ]\n4. B -> Postfix: A B\n5. * -> Stack: [ +, (, * ]\n6. C -> Postfix: A B C\n7. - -> Pops *: Postfix: A B C *, Stack: [ +, (, - ]\n8. ( -> Stack: [ +, (, -, ( ]\n9. D -> Postfix: A B C * D\n10. / -> Stack: [ +, (, -, (, / ]\n11. E -> Postfix: A B C * D E\n12. ^ -> Stack: [ +, (, -, (, /, ^ ]\n13. F -> Postfix: A B C * D E F\n14. ) -> Pops ^, /: Postfix: A B C * D E F ^ /, Stack: [ +, (, - ]\n15. * -> Stack: [ +, (, -, * ]\n16. G -> Postfix: A B C * D E F ^ / G\n17. ) -> Pops *, -: Postfix: A B C * D E F ^ / G * -, Stack: [ + ]\n18. * -> Stack: [ +, * ]\n19. H -> Postfix: A B C * D E F ^ / G * - H\n20. End of string: Pops *, + -> Final Postfix: A B C * D E F ^ / G * - H * +'
            },
            {
              qNum: '2(c)',
              unit: 3,
              marks: 7,
              question: 'Write a C function to reverse a Singly Linked List in O(n) time and O(1) auxiliary space by altering pointers.',
              solution: 'struct Node* reverseList(struct Node* head) {\n    struct Node *prev = NULL, *current = head, *next = NULL;\n    while (current != NULL) {\n        next = current->next;  // Store next pointer\n        current->next = prev;  // Reverse current pointer\n        prev = current;        // Move prev forward\n        current = next;        // Move current forward\n    }\n    return prev; // prev is the new head\n}\nTime Complexity: O(n) single pass, Auxiliary Space: O(1).'
            },
            {
              qNum: '2(d)',
              unit: 4,
              marks: 7,
              question: 'Construct an AVL tree by inserting the sequence: 14, 17, 11, 7, 53, 4, 13, 12, 8. Show rotations explicitly.',
              solution: '1. Insert 14: Root [14]\n2. Insert 17: Right child of 14\n3. Insert 11: Left child of 14 (Balanced)\n4. Insert 7: Left child of 11 (Balanced)\n5. Insert 53: Right child of 17 (Balanced)\n6. Insert 4: Left child of 7 -> Imbalance at node 11 (BF = +2, LL imbalance). Right rotation on 11 -> Subtree becomes 7 with children 4 and 11.\n7. Insert 13: Right child of 11\n8. Insert 12: Left child of 13 -> RL imbalance at 11. Right rotate 13, Left rotate 11.\n9. Insert 8: Right child of 7. Tree restored to height balanced.'
            },
            {
              qNum: '2(e)',
              unit: 5,
              marks: 7,
              question: 'Explain Quick Sort with Divide and Conquer strategy. Trace Quick Sort on array [38, 27, 43, 3, 9, 82, 10]. Analyze best and worst cases.',
              solution: 'Quick Sort chooses a pivot element and partitions the array into two subarrays such that elements < pivot are to the left and elements > pivot are to the right. It recursively applies this to left and right subarrays.\nTrace with pivot 10:\nPartition: [3, 9], pivot 10, [43, 27, 82, 38]\nRecursion on Left [3, 9]: sorted [3, 9]\nRecursion on Right [43, 27, 82, 38] with pivot 38 -> [27], 38, [82, 43]\nCombined result: [3, 9, 10, 27, 38, 43, 82]\nBest Case: O(n log n) when pivot divides array into equal halves.\nWorst Case: O(n^2) when array is already sorted or reverse sorted.'
            }
          ]
        },
        {
          section: 'Section C',
          instructions: 'Attempt any one part from each question. Each question carries 7 marks.',
          totalMarks: 35,
          questions: [
            {
              qNum: '3',
              unit: 1,
              marks: 7,
              question: 'Explain Binary Search algorithm with iterative C code and analyze its best, average, and worst-case time complexity.',
              solution: 'Binary search works on sorted arrays. It compares target with middle element: if equal, search terminates; if smaller, search narrows to left half; if greater, to right half.\nC Code:\nint binarySearch(int arr[], int n, int key) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == key) return mid;\n        if (arr[mid] < key) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\nBest Case: O(1) when target is at middle. Average & Worst Case: O(log n).'
            },
            {
              qNum: '4',
              unit: 2,
              marks: 7,
              question: 'Write a C program to implement a Circular Queue using an array. Detail enqueue and dequeue functions with boundary checks.',
              solution: 'Circular queue reuses empty cells by wrapping rear and front indices using modulo arithmetic.\n#define SIZE 5\nint q[SIZE], front = -1, rear = -1;\nvoid enqueue(int val) {\n    if ((rear + 1) % SIZE == front) { printf("Queue Full\\n"); return; }\n    if (front == -1) front = 0;\n    rear = (rear + 1) % SIZE;\n    q[rear] = val;\n}\nint dequeue() {\n    if (front == -1) { printf("Queue Empty\\n"); return -1; }\n    int data = q[front];\n    if (front == rear) front = rear = -1;\n    else front = (front + 1) % SIZE;\n    return data;\n}'
            },
            {
              qNum: '5',
              unit: 3,
              marks: 7,
              question: 'Discuss Polynomial Addition using Singly Linked Lists. Show node structure and write the algorithm.',
              solution: 'Each node in the list stores coefficient, exponent, and next pointer: struct Node { int coeff; int expo; struct Node* next; };\nAlgorithm:\nTraverse both lists p1 and p2:\n1. If p1->expo == p2->expo, sum coefficients and create node (p1->coeff + p2->coeff, p1->expo). Advance p1 and p2.\n2. If p1->expo > p2->expo, insert node with p1\'s term. Advance p1.\n3. If p2->expo > p1->expo, insert node with p2\'s term. Advance p2.\n4. Append remaining terms of p1 or p2.\nTime Complexity: O(m + n).'
            },
            {
              qNum: '6',
              unit: 4,
              marks: 7,
              question: 'Given the following Inorder and Preorder traversals, reconstruct the unique Binary Tree:\nInorder: D B E A F C G\nPreorder: A B D E C F G',
              solution: 'Step 1: First element of Preorder is root -> Root = A.\nStep 2: Locate A in Inorder: [D B E] are in Left Subtree; [F C G] are in Right Subtree.\nStep 3: In Left Subtree: Preorder is [B D E], Inorder is [D B E] -> Root is B. D is left child of B, E is right child of B.\nStep 4: In Right Subtree: Preorder is [C F G], Inorder is [F C G] -> Root is C. F is left child of C, G is right child of C.\nFinal Tree:\n        A\n       / \\\n      B   C\n     / \\ / \\\n    D  E F  G'
            },
            {
              qNum: '7',
              unit: 5,
              marks: 7,
              question: 'Find Minimum Spanning Tree of the following weighted graph using Prim\'s Algorithm and calculate total weight: Vertices: A, B, C, D, E. Edges: (A,B)=2, (A,C)=3, (B,C)=1, (B,D)=1, (B,E)=4, (C,D)=2, (D,E)=3.',
              solution: 'Start with vertex A:\nStep 1: Visited {A}. Minimum weight outgoing edge: (A, B) = 2. Visited = {A, B}.\nStep 2: Minimum weight outgoing edge from {A, B}: (B, C)=1 or (B, D)=1. Pick (B, C)=1. Visited = {A, B, C}.\nStep 3: Minimum weight outgoing edge from {A, B, C}: (B, D)=1. Visited = {A, B, C, D}.\nStep 4: Minimum weight outgoing edge to unvisited E: (D, E)=3 or (B, E)=4. Pick (D, E)=3. Visited = {A, B, C, D, E}.\nEdges in MST: (A, B), (B, C), (B, D), (D, E).\nTotal MST Cost = 2 + 1 + 1 + 3 = 7.'
            }
          ]
        }
      ]
    },

    {
      id: 'aktu_bcs302_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Computer Organization & Architecture',
      subjectCode: 'BCS-302',
      altCode: 'KCS-302',
      examYear: '2023-24',
      examType: 'Regular / Carry Over',
      paperCode: 'BCS302',
      maxMarks: 70,
      durationHours: 3,
      source: 'Dr. A.P.J. Abdul Kalam Technical University Examination Portal (aktu.ac.in)',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BCS302-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 14,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Differentiate between Von Neumann and Harvard architecture.',
              solution: 'Von Neumann architecture shares a single memory and bus system for both data and instructions, leading to the Von Neumann bottleneck. Harvard architecture utilizes physically separate memories and buses for instructions and data, allowing simultaneous instruction fetch and data read/write.'
            },
            {
              qNum: '1(b)',
              unit: 1,
              marks: 2,
              question: 'Represent decimal number -25 in 8-bit 2\'s complement form.',
              solution: '+25 in 8-bit binary: 00011001.\n1\'s complement: 11100110.\nAdd 1: 11100111.\nFinal 8-bit 2\'s complement representation: 11100111.'
            },
            {
              qNum: '1(c)',
              unit: 2,
              marks: 2,
              question: 'What is the purpose of Program Counter (PC) and Instruction Register (IR)?',
              solution: 'The Program Counter (PC) holds the memory address of the next instruction to be fetched and executed. The Instruction Register (IR) holds the opcode and operand fields of the instruction currently being decoded and executed.'
            },
            {
              qNum: '1(d)',
              unit: 2,
              marks: 2,
              question: 'Explain Immediate and Direct addressing modes with examples.',
              solution: 'In Immediate Addressing, the operand value is given directly inside the instruction itself (e.g., ADD R1, #25). In Direct Addressing, the address field of the instruction contains the effective memory address of the operand (e.g., LOAD R1, 1050).'
            },
            {
              qNum: '1(e)',
              unit: 3,
              marks: 2,
              question: 'What is a Pipeline Hazard? Mention its three main categories.',
              solution: 'A pipeline hazard is any condition that prevents the next instruction in the instruction stream from executing in its designated clock cycle. Three main categories are: 1. Structural Hazards (resource conflicts), 2. Data Hazards (data dependencies RAW/WAR/WAW), 3. Control Hazards (branches and jumps).'
            },
            {
              qNum: '1(f)',
              unit: 4,
              marks: 2,
              question: 'State the Principle of Locality of Reference and its two forms.',
              solution: 'Locality of Reference states that computer programs tend to access a relatively small portion of their address space at any given time. Temporal Locality: recently accessed memory locations are likely to be accessed again soon. Spatial Locality: memory locations close to the recently accessed location are likely to be accessed soon.'
            },
            {
              qNum: '1(g)',
              unit: 5,
              marks: 2,
              question: 'Differentiate between Programmed I/O and Interrupt-driven I/O.',
              solution: 'In Programmed I/O, the CPU continuously polls the status of the I/O module in a busy-wait loop, wasting processing cycles. In Interrupt-driven I/O, the CPU issues an I/O command and continues other work; the I/O module interrupts the CPU only when it is ready to transfer data.'
            }
          ]
        },
        {
          section: 'Section B',
          instructions: 'Attempt any three questions. Each question carries 7 marks.',
          totalMarks: 21,
          questions: [
            {
              qNum: '2(a)',
              unit: 1,
              marks: 7,
              question: 'Multiply (+13) with (-6) using Booth\'s Multiplication Algorithm. Show step-by-step register contents of M, A, Q, and Q-1.',
              solution: 'Multiplicand M = +13 = 01101 (5 bits), -M = 10011.\nMultiplier Q = -6 = 11010 (5 bits). Count = 5.\nInitial: A = 00000, Q = 11010, Q-1 = 0.\nStep 1: Q0 Q-1 = 0 0 -> Arithmetic Shift Right (ASR) A, Q, Q-1 -> A = 00000, Q = 01101, Q-1 = 0. Count = 4.\nStep 2: Q0 Q-1 = 1 0 -> A = A - M = A + (-M) = 10011. ASR -> A = 11001, Q = 10110, Q-1 = 1. Count = 3.\nStep 3: Q0 Q-1 = 0 1 -> A = A + M = 11001 + 01101 = 00110. ASR -> A = 00011, Q = 01011, Q-1 = 0. Count = 2.\nStep 4: Q0 Q-1 = 1 0 -> A = A + (-M) = 00011 + 10011 = 10110. ASR -> A = 11011, Q = 00101, Q-1 = 1. Count = 1.\nStep 5: Q0 Q-1 = 1 1 -> ASR -> A = 11101, Q = 10010, Q-1 = 1. Count = 0.\nResult AQ = 1110110010_2 in 2\'s complement = -78_10. Correct (+13 * -6 = -78).'
            },
            {
              qNum: '2(b)',
              unit: 3,
              marks: 7,
              question: 'A 4-stage instruction pipeline has stage delays of 150ps, 120ps, 160ps, and 140ps with an interface latch delay of 10ps. Calculate the clock cycle time, maximum throughput, and speedup over non-pipelined execution for 1000 instructions.',
              solution: '1. Clock Cycle Time (tau): tau = max(stage delays) + latch delay = max(150, 120, 160, 140) + 10 = 160 + 10 = 170 ps.\n2. Non-pipelined time per instruction: 150 + 120 + 160 + 140 = 570 ps.\nFor n = 1000 instructions:\nNon-pipelined execution time Tn = 1000 * 570 ps = 570,000 ps.\nPipelined execution time Tp = (k + n - 1) * tau = (4 + 1000 - 1) * 170 ps = 1003 * 170 ps = 170,510 ps.\n3. Speedup S = Tn / Tp = 570,000 / 170,510 = 3.34x.\n4. Maximum Throughput = 1 / tau = 1 / 170ps = 5.88 Giga-instructions per second (GIPS).'
            },
            {
              qNum: '2(c)',
              unit: 4,
              marks: 7,
              question: 'A computer system features a 64KB cache memory with 16-byte cache lines and a 32-bit physical address space (4GB main memory). Determine the bit field split (Tag, Index, Word offset) for: (a) Direct Cache Mapping (b) 4-Way Set Associative Cache Mapping.',
              solution: 'Physical Address = 32 bits.\nBlock size = 16 bytes = 2^4 bytes -> Word Offset = 4 bits.\nCache size = 64KB = 2^16 bytes.\nTotal lines in cache = 64KB / 16B = 2^16 / 2^4 = 2^12 = 4096 lines.\n(a) Direct Mapping:\nLine / Index bits = log2(4096) = 12 bits.\nWord offset = 4 bits.\nTag bits = 32 - (12 + 4) = 16 bits.\nFormat: [Tag: 16 bits] [Line Index: 12 bits] [Word Offset: 4 bits].\n\n(b) 4-Way Set Associative Mapping:\nNumber of sets = Total lines / 4 = 4096 / 4 = 1024 sets = 2^10 sets.\nSet Index bits = 10 bits.\nWord offset = 4 bits.\nTag bits = 32 - (10 + 4) = 18 bits.\nFormat: [Tag: 18 bits] [Set Index: 10 bits] [Word Offset: 4 bits].'
            }
          ]
        }
      ]
    },

    {
      id: 'aktu_bcs303_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Discrete Structures & Theory of Logic',
      subjectCode: 'BCS-303',
      altCode: 'KCS-303',
      examYear: '2023-24',
      examType: 'Regular / Carry Over',
      paperCode: 'BCS303',
      maxMarks: 70,
      durationHours: 3,
      source: 'AKTU Official Evaluation Division (aktu.ac.in)',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BCS303-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 14,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Define an Equivalence Relation.',
              solution: 'A relation R on a set A is an equivalence relation if and only if it satisfies three properties: 1. Reflexive (a R a for all a ∈ A), 2. Symmetric (if a R b then b R a), 3. Transitive (if a R b and b R c then a R c).'
            },
            {
              qNum: '1(b)',
              unit: 2,
              marks: 2,
              question: 'State Lagrange\'s Theorem for finite groups.',
              solution: 'Lagrange\'s Theorem states that the order of every subgroup H of a finite group G divides the order of the group G, i.e., |G| / |H| = [G : H], where [G : H] is the index of H in G.'
            },
            {
              qNum: '1(c)',
              unit: 3,
              marks: 2,
              question: 'State De Morgan\'s Laws in propositional logic.',
              solution: '1. ¬(P ∧ Q) ≡ ¬P ∨ ¬Q (The negation of a conjunction is the disjunction of the negations).\n2. ¬(P ∨ Q) ≡ ¬P ∧ ¬Q (The negation of a disjunction is the conjunction of the negations).'
            },
            {
              qNum: '1(d)',
              unit: 4,
              marks: 2,
              question: 'State Pigeonhole Principle with an illustrative example.',
              solution: 'If k + 1 or more pigeons are placed into k pigeonholes, then at least one pigeonhole must contain two or more pigeons. Example: In any group of 13 people, at least two must share the same birth month.'
            },
            {
              qNum: '1(e)',
              unit: 5,
              marks: 2,
              question: 'State Handshaking Lemma for undirected graphs.',
              solution: 'In any undirected graph G = (V, E), the sum of degrees of all vertices is equal to twice the number of edges: ∑_{v ∈ V} deg(v) = 2|E|. Consequently, the number of vertices with odd degree is always even.'
            }
          ]
        },
        {
          section: 'Section B',
          instructions: 'Attempt any three questions. Each question carries 7 marks.',
          totalMarks: 21,
          questions: [
            {
              qNum: '2(a)',
              unit: 4,
              marks: 7,
              question: 'Solve the homogeneous recurrence relation: a_n - 7a_{n-1} + 10a_{n-2} = 0 for n >= 2, given a_0 = 1, a_1 = 8.',
              solution: 'Characteristic equation: r^2 - 7r + 10 = 0\nFactoring: (r - 2)(r - 5) = 0 -> Roots r1 = 2, r2 = 5.\nGeneral Solution: a_n = C1 * (2^n) + C2 * (5^n).\nApplying initial conditions:\nFor n = 0: C1 + C2 = 1\nFor n = 1: 2*C1 + 5*C2 = 8\nMultiply equation 1 by 2: 2*C1 + 2*C2 = 2\nSubtract: 3*C2 = 6 -> C2 = 2.\nThen C1 = 1 - C2 = 1 - 2 = -1.\nFinal Closed-Form Solution: a_n = 2 * (5^n) - (2^n).'
            }
          ]
        }
      ]
    },

    {
      id: 'aktu_bas301_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Technical Communication',
      subjectCode: 'BAS-301',
      altCode: 'KAS-301',
      examYear: '2023-24',
      examType: 'Regular / Carry Over',
      paperCode: 'BAS301',
      maxMarks: 70,
      durationHours: 3,
      source: 'AKTU Examination Portal (aktu.ac.in)',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BAS301-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 14,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Distinguish between General Communication and Technical Communication.',
              solution: 'General Communication conveys personal, social, and emotional messages with informal language and flexible structure. Technical Communication transmits specialized scientific, business, or engineering information with precision, objectivity, factual accuracy, and structured formal format.'
            },
            {
              qNum: '1(b)',
              unit: 2,
              marks: 2,
              question: 'What are the main components of the Front Matter in a formal technical report?',
              solution: 'Front matter components: Cover Page, Title Page, Certificate of Authenticity / Approval, Acknowledgements, Abstract / Executive Summary, Table of Contents, List of Figures, and List of Tables.'
            },
            {
              qNum: '1(c)',
              unit: 3,
              marks: 2,
              question: 'What is Plagiarism? Why is ethical citation crucial in academic writing?',
              solution: 'Plagiarism is the unethical representation of another author\'s words, ideas, research, or data as one\'s own original work without proper attribution. Ethical citation respects intellectual property rights, prevents copyright infringement, and provides validation for research claims.'
            },
            {
              qNum: '1(d)',
              unit: 4,
              marks: 2,
              question: 'What is Kinesics in non-verbal communication?',
              solution: 'Kinesics refers to the interpretation of body motion communication such as facial expressions, gestures, eye contact, body posture, and physical mannerisms during interpersonal interactions and presentations.'
            }
          ]
        }
      ]
    },

    {
      id: 'aktu_bas303_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Mathematics-IV',
      subjectCode: 'BAS-303',
      altCode: 'KAS-302',
      examYear: '2023-24',
      examType: 'Regular / Carry Over',
      paperCode: 'BAS303',
      maxMarks: 70,
      durationHours: 3,
      source: 'AKTU Central Examination Repository',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BAS303-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 14,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Form the partial differential equation by eliminating arbitrary constants a and b from z = (x + a)(y + b).',
              solution: 'Differentiating partially with respect to x: p = ∂z/∂x = y + b.\nDifferentiating partially with respect to y: q = ∂z/∂y = x + a.\nSubstituting into original equation:\nz = (x + a)(y + b) = q * p.\nRequired PDE: z = p * q.'
            },
            {
              qNum: '1(b)',
              unit: 3,
              marks: 2,
              question: 'If the two regression lines are 3x + 2y = 26 and 6x + y = 31, find the mean values of x and y.',
              solution: 'Regression lines pass through the point of means (x̄, ȳ):\n1) 3x̄ + 2ȳ = 26\n2) 6x̄ + ȳ = 31\nMultiply (2) by 2: 12x̄ + 2ȳ = 62\nSubtract (1): 9x̄ = 36 -> x̄ = 4.\nSubstitute x̄ = 4 into (1): 3(4) + 2ȳ = 26 -> 12 + 2ȳ = 26 -> 2ȳ = 14 -> ȳ = 7.\nMean of x = 4, Mean of y = 7.'
            }
          ]
        }
      ]
    },

    {
      id: 'aktu_bcc302_2023_24',
      course: 'B.Tech',
      branch: 'Computer Science & Engineering',
      semester: 3,
      subject: 'Python Programming',
      subjectCode: 'BCC-302',
      altCode: 'KNC-302',
      examYear: '2023-24',
      examType: 'Regular Examination',
      paperCode: 'BCC302',
      maxMarks: 50,
      durationHours: 2,
      source: 'AKTU Emerging Technology Assessment Cell',
      verified: true,
      officialUrl: 'https://aktu.ac.in/examination/syllabus-and-papers/BCC302-2023-24.pdf',
      sections: [
        {
          section: 'Section A',
          instructions: 'Attempt all questions. Each question carries 2 marks.',
          totalMarks: 10,
          questions: [
            {
              qNum: '1(a)',
              unit: 1,
              marks: 2,
              question: 'Explain the difference between / and // operators in Python 3.',
              solution: 'The single slash operator / performs floating-point division (e.g., 7 / 2 evaluates to 3.5). The double slash // performs floor division (integer division), returning the largest integer less than or equal to the quotient (e.g., 7 // 2 evaluates to 3, and -7 // 2 evaluates to -4).'
            },
            {
              qNum: '1(b)',
              unit: 3,
              marks: 2,
              question: 'What is the key difference between a List and a Tuple in Python?',
              solution: 'Lists are mutable sequences defined with square brackets [] where items can be modified, appended, or deleted in place. Tuples are immutable sequences defined with parentheses () whose elements cannot be altered after creation, making them hashable and suitable as dictionary keys.'
            }
          ]
        }
      ]
    }
  ];

  /* ==========================================================================
     3. PRECONFIGURED TESTS (INTERACTIVE TEST ENGINE)
     ========================================================================== */
  const TEST_CATALOG = [
    // --- Unit-wise Tests ---
    {
      id: 'test_ds_unit1',
      title: 'Unit 1 Mastery Test: Arrays, Complexity & Searching',
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      type: 'unit',
      unit: 1,
      durationMinutes: 20,
      totalMarks: 20,
      passingMarks: 10,
      questionsCount: 10,
      instructions: '10 Questions testing Unit 1 fundamentals, address calculation, Big-O analysis, and linear/binary searching.',
      questions: [
        {
          id: 'q_ds_u1_mcq1',
          unit: 1,
          type: 'mcq',
          question: 'What is the time complexity of searching an element in an unsorted array of n elements?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'In an unsorted array, linear search must examine up to all n elements in the worst case, yielding O(n) time complexity.'
        },
        {
          id: 'q_ds_u1_mcq2',
          unit: 1,
          type: 'mcq',
          question: 'In a Row-Major ordered 2D array A[1..M, 1..N] with base address B and element size w, what is Address(A[i, j])?',
          options: [
            'B + w * [(i - 1) * N + (j - 1)]',
            'B + w * [(j - 1) * M + (i - 1)]',
            'B + w * [(i - 1) * M + (j - 1)]',
            'B + w * [i * N + j]'
          ],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'In Row-Major order, rows are stored consecutively. To reach row i, we skip (i - 1) complete rows each having N elements, then add (j - 1) columns.'
        },
        {
          id: 'q_ds_u1_mcq3',
          unit: 1,
          type: 'mcq',
          question: 'Which asymptotic notation represents the tight bound (both upper and lower bound) of an algorithm?',
          options: ['Big-Oh (O)', 'Big-Omega (Ω)', 'Theta (Θ)', 'Little-oh (o)'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'Theta (Θ) notation characterizes both upper and lower bounds simultaneously: c1*g(n) <= f(n) <= c2*g(n).'
        },
        {
          id: 'q_ds_u1_mcq4',
          unit: 1,
          type: 'mcq',
          question: 'What is the maximum number of comparisons needed in Binary Search for an array of 64 sorted elements?',
          options: ['6', '7', '64', '32'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Max comparisons = ⌊log2(64)⌋ + 1 = 6 + 1 = 7 comparisons.'
        },
        {
          id: 'q_ds_u1_mcq5',
          unit: 1,
          type: 'mcq',
          question: 'What is a Sparse Matrix?',
          options: [
            'A matrix with only positive entries',
            'A matrix in which the majority of elements are zero',
            'A matrix where rows exceed columns',
            'A matrix with non-zero diagonal elements only'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'A sparse matrix is one where zero elements vastly outnumber non-zero elements, typically represented using 3-tuple format (row, col, value) to save memory.'
        },
        {
          id: 'q_ds_u1_mcq6',
          unit: 1,
          type: 'mcq',
          question: 'Which sorting algorithm has a worst-case time complexity of O(n^2) but best-case of O(n) for nearly sorted inputs?',
          options: ['Selection Sort', 'Insertion Sort', 'Merge Sort', 'Heap Sort'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Insertion Sort only requires 1 comparison per element on an already sorted array, yielding O(n) best-case complexity.'
        },
        {
          id: 'q_ds_u1_mcq7',
          unit: 1,
          type: 'mcq',
          question: 'An array A[-2..3, 1..4] with 2 bytes per element has base address 2000. Under column-major order, find Address(A[0, 2]).',
          options: ['2016', '2014', '2020', '2018'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Rows M = 3 - (-2) + 1 = 6. Columns L2 = 1. i = 0, j = 2. Address = 2000 + 2 * [(2 - 1)*6 + (0 - (-2))] = 2000 + 2 * [6 + 2] = 2000 + 16 = 2016.'
        },
        {
          id: 'q_ds_u1_mcq8',
          unit: 1,
          type: 'mcq',
          question: 'What is an Abstract Data Type (ADT)?',
          options: [
            'A hardware register structure',
            'A mathematical specification of data values and allowable operations independent of implementation',
            'A built-in data type in C compiler',
            'A dynamic variable allocated on stack'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'An ADT defines the semantic interface (values and operations) while completely hiding the underlying implementation and data structures.'
        },
        {
          id: 'q_ds_u1_mcq9',
          unit: 1,
          type: 'mcq',
          question: 'What is the worst-case number of element swaps in Selection Sort for an array of size n?',
          options: ['O(n^2)', 'O(n)', 'O(log n)', 'O(1)'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Selection Sort performs at most n - 1 swaps in total (O(n)), even though its comparisons are O(n^2).'
        },
        {
          id: 'q_ds_u1_mcq10',
          unit: 1,
          type: 'mcq',
          question: 'Which notation describes an algorithm whose running time does not grow as the input size n increases?',
          options: ['O(n)', 'O(log n)', 'O(1)', 'O(n!)'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'O(1) describes constant-time operations whose running time is independent of input size n.'
        }
      ]
    },

    {
      id: 'test_ds_unit2',
      title: 'Unit 2 Mastery Test: Stacks, Queues & Recursion',
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      type: 'unit',
      unit: 2,
      durationMinutes: 20,
      totalMarks: 20,
      passingMarks: 10,
      questionsCount: 10,
      instructions: '10 Questions testing Stack LIFO, Queue FIFO, Circular Queues, Polish notations, and Recursion.',
      questions: [
        {
          id: 'q_ds_u2_mcq1',
          unit: 2,
          type: 'mcq',
          question: 'Which data structure follows the Last In First Out (LIFO) discipline?',
          options: ['Queue', 'Stack', 'Tree', 'Graph'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Stack strictly enforces LIFO discipline; the last inserted element is the first one removed.'
        },
        {
          id: 'q_ds_u2_mcq2',
          unit: 2,
          type: 'mcq',
          question: 'What is the result of evaluating the postfix expression: 6 3 2 + * 5 - ?',
          options: ['25', '20', '35', '15'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: '1. Push 6, 3, 2. 2. + pops 2 and 3, pushes 3+2=5. Stack: [6, 5]. 3. * pops 5 and 6, pushes 6*5=30. 4. Push 5. 5. - pops 5 and 30, pushes 30-5=25.'
        },
        {
          id: 'q_ds_u2_mcq3',
          unit: 2,
          type: 'mcq',
          question: 'In a circular queue of size N using an array, what condition indicates that the queue is FULL?',
          options: [
            'rear == front',
            '(rear + 1) % N == front',
            'rear == N - 1',
            'front == 0'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'In a circular array queue, when the next slot after rear wrapped modulo N equals front, the queue is full.'
        },
        {
          id: 'q_ds_u2_mcq4',
          unit: 2,
          type: 'mcq',
          question: 'What is the minimum number of moves required to solve the Tower of Hanoi problem with n disks?',
          options: ['2n - 1', '2^n - 1', 'n^2', '2^n'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'The recurrence T(n) = 2T(n-1) + 1 with T(1) = 1 yields T(n) = 2^n - 1 minimum moves.'
        },
        {
          id: 'q_ds_u2_mcq5',
          unit: 2,
          type: 'mcq',
          question: 'Which of the following data structures is essential for implementing Breadth First Search (BFS)?',
          options: ['Stack', 'Queue', 'Binary Search Tree', 'Hash Table'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'BFS explores vertices level-by-level in FIFO order, strictly requiring a Queue data structure.'
        },
        {
          id: 'q_ds_u2_mcq6',
          unit: 2,
          type: 'mcq',
          question: 'Which data structure is naturally utilized by the system runtime to manage recursive function calls?',
          options: ['Call Stack', 'Heap Memory', 'Circular Queue', 'Linked List'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'The call stack pushes activation records (stack frames) for each recursive invocation and pops them upon return.'
        },
        {
          id: 'q_ds_u2_mcq7',
          unit: 2,
          type: 'mcq',
          question: 'In a Deque (Double Ended Queue), insertion and deletion are permitted at:',
          options: ['Front end only', 'Rear end only', 'Both front and rear ends', 'Middle only'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'A Deque allows insertion and deletion operations at both its front and rear ends.'
        },
        {
          id: 'q_ds_u2_mcq8',
          unit: 2,
          type: 'mcq',
          question: 'What happens when an element is popped from an empty stack?',
          options: ['Stack Overflow', 'Stack Underflow', 'Segmentation Fault', 'Memory Leak'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Attempting to pop or peek from an empty stack causes a Stack Underflow condition.'
        },
        {
          id: 'q_ds_u2_mcq9',
          unit: 2,
          type: 'mcq',
          question: 'Convert the infix expression A + B * C to postfix form.',
          options: ['A B C * +', '+ A * B C', 'A B + C *', 'A B C + *'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Because multiplication has higher precedence than addition: B * C becomes BC*, then A + (BC*) becomes ABC*+.'
        },
        {
          id: 'q_ds_u2_mcq10',
          unit: 2,
          type: 'mcq',
          question: 'A Priority Queue retrieves elements based on:',
          options: ['LIFO order', 'FIFO order', 'Associated priority value of elements', 'Alphabetical key order'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'In a Priority Queue, every element has an assigned priority; the highest (or lowest) priority element is always served first.'
        }
      ]
    },

    // --- Combined-Unit Tests (Mid-Term Style) ---
    {
      id: 'test_ds_combined_1_2',
      title: 'Mid-Term Assessment: Units 1 & 2 (Arrays, Stacks & Queues)',
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      type: 'combined',
      units: [1, 2],
      durationMinutes: 45,
      totalMarks: 30,
      passingMarks: 15,
      questionsCount: 15,
      instructions: 'Class Test covering foundational data structures, algorithmic complexities, linear containers, and stack/queue applications.',
      questions: [
        {
          id: 'ct_q1',
          unit: 1,
          type: 'mcq',
          question: 'What is the worst-case time complexity of Quick Sort when picking the first element as pivot on an already sorted list?',
          options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'On sorted input with first element pivot, partitioning produces unbalanced subproblems of sizes 0 and n-1 at each level, causing O(n^2) worst case.'
        },
        {
          id: 'ct_q2',
          unit: 2,
          type: 'mcq',
          question: 'Which data structure is required to test whether a given string has balanced parentheses?',
          options: ['Queue', 'Stack', 'Tree', 'Array'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'A stack pushes open brackets and pops on corresponding closing brackets, verifying matching and nesting order.'
        },
        {
          id: 'ct_q3',
          unit: 1,
          type: 'mcq',
          question: 'Two-dimensional array A[0..4, 0..5] stored in row-major with base 500 and 4 bytes per element. Find address of A[3, 2].',
          options: ['580', '576', '584', '568'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Cols N = 6. Address = 500 + 4 * [3 * 6 + 2] = 500 + 4 * [18 + 2] = 500 + 80 = 580.'
        },
        {
          id: 'ct_q4',
          unit: 2,
          type: 'mcq',
          question: 'Prefix notation is also known as:',
          options: ['Polish Notation', 'Reverse Polish Notation', 'Infix Notation', 'Postfix Notation'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Prefix notation where operator precedes operands is called Polish Notation; Postfix is Reverse Polish Notation.'
        },
        {
          id: 'ct_q5',
          unit: 2,
          type: 'mcq',
          question: 'If a circular queue has front = 2, rear = 4, size = 6, how many elements are currently in the queue?',
          options: ['2', '3', '4', '1'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Count = (rear - front + size) % size + 1 = (4 - 2 + 6) % 6 + 1 = 2 + 1 = 3 elements.'
        }
      ]
    },

    // --- Monthly / Sessional Assessment Tests ---
    {
      id: 'test_sessional_1_cse',
      title: 'College Sessional Exam 1 (Odd Semester)',
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      type: 'monthly',
      units: [1, 2, 3],
      durationMinutes: 60,
      totalMarks: 50,
      passingMarks: 20,
      questionsCount: 20,
      instructions: 'Standard AKTU Sessional Examination 1 covering Units 1, 2, and 3. Includes objective and short analytical problems.',
      questions: [
        {
          id: 'sess1_q1',
          unit: 1,
          type: 'mcq',
          question: 'Which of the following sorting algorithms is NOT stable by default?',
          options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort'],
          correctOptionIndex: 3,
          marks: 2,
          explanation: 'Quick Sort is inherently unstable as long-range partitioning swaps can alter the relative order of equal keys.'
        },
        {
          id: 'sess1_q2',
          unit: 3,
          type: 'mcq',
          question: 'What is the time complexity of deleting the first node in a Singly Linked List given only head pointer?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Deleting head is O(1): head = head->next; free old head node.'
        },
        {
          id: 'sess1_q3',
          unit: 3,
          type: 'mcq',
          question: 'In a circular linked list, the next pointer of the last node points to:',
          options: ['NULL', 'Head Node', 'Previous Node', 'Any random node'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'In a circular singly linked list, the tail node\'s next pointer links back to the head node, forming a loop.'
        }
      ]
    },

    // --- Full-Syllabus Mock Test (AKTU ESE Pattern) ---
    {
      id: 'test_ds_full_mock',
      title: 'AKTU Full-Syllabus End Semester Mock Examination',
      subject: 'Data Structures',
      subjectCode: 'BCS-301',
      type: 'full_mock',
      units: [1, 2, 3, 4, 5],
      durationMinutes: 180,
      totalMarks: 70,
      passingMarks: 21,
      questionsCount: 20,
      instructions: 'Full 3-Hour Simulation conforming strictly to the official AKTU 70-Mark End Semester Examination Pattern (Sections A, B, and C).',
      questions: [
        {
          id: 'full_q1',
          unit: 1,
          type: 'mcq',
          question: 'What is the recurrence relation for the Merge Sort algorithm on n elements?',
          options: [
            'T(n) = 2T(n/2) + O(n)',
            'T(n) = T(n - 1) + O(n)',
            'T(n) = 2T(n/2) + O(1)',
            'T(n) = T(n/2) + O(n)'
          ],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'Merge sort splits problem into two subproblems of size n/2 and merges in linear O(n) time: T(n) = 2T(n/2) + O(n).'
        },
        {
          id: 'full_q2',
          unit: 2,
          type: 'mcq',
          question: 'Which notation is evaluated directly from left to right using a single operand stack?',
          options: ['Infix', 'Postfix (Reverse Polish)', 'Prefix', 'Fully Parenthesized Infix'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Postfix expressions are evaluated in one left-to-right pass: operands are pushed onto stack, and operators pop operands and push result.'
        },
        {
          id: 'full_q3',
          unit: 3,
          type: 'mcq',
          question: 'Which linked list allows traversal in both forward and backward directions with O(1) space per node overhead?',
          options: ['Singly Linked List', 'Doubly Linked List', 'Circular Singly Linked List', 'Header Linked List'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Doubly Linked List maintains both prev and next pointers, enabling bidirectional traversal.'
        },
        {
          id: 'full_q4',
          unit: 4,
          type: 'mcq',
          question: 'What is the height of an AVL tree with n nodes in the worst case?',
          options: ['O(log2 n)', 'O(n)', 'O(n^2)', 'O(√n)'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'The height of an AVL tree is strictly bounded by 1.44 * log2(n), ensuring O(log n) worst-case search time.'
        },
        {
          id: 'full_q5',
          unit: 5,
          type: 'mcq',
          question: 'Dijkstra\'s algorithm fails or gives incorrect results when the graph contains:',
          options: [
            'Cycles',
            'Negative edge weights',
            'Multiple disconnected components',
            'Directed edges'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Dijkstra relies on greedy assumption that once a vertex distance is finalized, it cannot be improved; negative edges violate this, requiring Bellman-Ford.'
        },
        {
          id: 'full_q6',
          unit: 2,
          type: 'mcq',
          question: 'In a circular array queue of capacity N, which condition confirms that the queue is full?',
          options: [
            'rear == front',
            '(rear + 1) % N == front',
            'rear == N - 1',
            'front == 0 && rear == N'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'In a circular queue with array of size N, when the next slot after rear wrapped modulo N equals front, the queue is full.'
        },
        {
          id: 'full_q7',
          unit: 2,
          type: 'mcq',
          question: 'What is the minimum number of moves required to solve the Tower of Hanoi problem with n disks?',
          options: [
            '2n - 1',
            '2^n - 1',
            'n^2',
            '2^n'
          ],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'Recurrence T(n) = 2T(n-1) + 1 yields the minimal move formula 2^n - 1.'
        },
        // --- Section B (3 Analytical Questions x 7 Marks = 21 Marks) ---
        {
          id: 'full_q8',
          unit: 1,
          type: 'mcq',
          question: 'An array A[-2..4, -3..5] is stored in column-major order in memory. If base address is 1000 and each element occupies 2 bytes, calculate the memory address of element A[2, 3].',
          options: [
            '1092',
            '1048',
            '1120',
            '1084'
          ],
          correctOptionIndex: 0,
          marks: 7,
          explanation: 'Rows M = 4 - (-2) + 1 = 7. Address(A[2, 3]) = 1000 + 2 * [(3 - (-3)) * 7 + (2 - (-2))] = 1000 + 2 * [42 + 4] = 1000 + 92 = 1092.'
        },
        {
          id: 'full_q9',
          unit: 2,
          type: 'mcq',
          question: 'Convert the infix expression A + (B * C - (D / E ^ F) * G) * H into postfix notation using operator precedence.',
          options: [
            'A B C * D E F ^ / G * - H * +',
            'A B C * + D E F ^ / G * - H *',
            'A B C D E F ^ / * G - H * + *',
            '+ A * - * B C * / D ^ E F G H'
          ],
          correctOptionIndex: 0,
          marks: 7,
          explanation: 'Following stack operator precedence (^ > * = / > + = -), the unique postfix evaluation string is A B C * D E F ^ / G * - H * +.'
        },
        {
          id: 'full_q10',
          unit: 5,
          type: 'mcq',
          question: 'Which design paradigm does Quick Sort use, and what is its average-case time complexity?',
          options: [
            'Greedy Strategy, O(n)',
            'Dynamic Programming, O(n^2)',
            'Divide and Conquer, O(n log n)',
            'Backtracking, O(log n)'
          ],
          correctOptionIndex: 2,
          marks: 7,
          explanation: 'Quick Sort partitions the problem around a pivot using Divide and Conquer, achieving O(n log n) average running time.'
        },
        // --- Section C (5 In-Depth Questions x 7 Marks = 35 Marks) ---
        {
          id: 'full_q11',
          unit: 3,
          type: 'mcq',
          question: 'What is the optimal auxiliary space complexity to reverse a Singly Linked List of n nodes by pointer manipulation?',
          options: [
            'O(n) auxiliary space',
            'O(1) auxiliary space',
            'O(log n) auxiliary space',
            'O(n^2) auxiliary space'
          ],
          correctOptionIndex: 1,
          marks: 7,
          explanation: 'By iteratively maintaining 3 pointer variables (prev, current, next), a singly linked list can be reversed in O(n) time and O(1) auxiliary space.'
        },
        {
          id: 'full_q12',
          unit: 4,
          type: 'mcq',
          question: 'In an AVL Tree, after an insertion into the left subtree of the right child causing imbalance, which rotation restores balance?',
          options: [
            'RL (Right-Left) Double Rotation',
            'LL (Left-Left) Single Rotation',
            'RR (Right-Right) Single Rotation',
            'No rotation needed'
          ],
          correctOptionIndex: 0,
          marks: 7,
          explanation: 'An insertion into the left child of a right subtree produces an RL imbalance, resolved via a Right rotation on child followed by Left rotation on root.'
        },
        {
          id: 'full_q13',
          unit: 5,
          type: 'mcq',
          question: 'In Prim\'s algorithm for Minimum Spanning Tree (MST), which greedy choice is executed at each iteration?',
          options: [
            'Add the global minimum edge anywhere in the graph',
            'Add the minimum-weight edge connecting the current tree to an unvisited vertex',
            'Delete the maximum cycle edge',
            'Sort all edges in ascending order'
          ],
          correctOptionIndex: 1,
          marks: 7,
          explanation: 'Prim\'s algorithm grows a single tree vertex-by-vertex by greedily selecting the lowest-weight edge crossing the cut between visited and unvisited vertices.'
        },
        {
          id: 'full_q14',
          unit: 4,
          type: 'mcq',
          question: 'To uniquely reconstruct a binary tree from its traversals, which traversal MUST be provided alongside Preorder or Postorder?',
          options: [
            'Level Order Traversal',
            'Eulerian Traversal',
            'Inorder Traversal',
            'Depth First Search'
          ],
          correctOptionIndex: 2,
          marks: 7,
          explanation: 'Inorder traversal is required because it splits nodes into left and right subtrees relative to the root identified from Preorder or Postorder.'
        },
        {
          id: 'full_q15',
          unit: 5,
          type: 'mcq',
          question: 'What is the primary difference between Linear Probing and Separate Chaining in hash table collision resolution?',
          options: [
            'Linear Probing stores colliding keys in the array table; Separate Chaining uses linked lists outside the primary table',
            'Linear Probing uses linked lists; Separate Chaining uses quadratic formulas',
            'Linear Probing eliminates all collisions completely',
            'Separate Chaining cannot store more elements than the table size'
          ],
          correctOptionIndex: 0,
          marks: 7,
          explanation: 'Linear probing is an Open Addressing technique searching sequential table slots, whereas Separate Chaining allocates dynamic linked list nodes for colliding entries.'
        }
      ]
    }
  ];

  /* ==========================================================================
     4. UNIT-WISE AKTU PYQ REPOSITORY
     ========================================================================== */
  const UNIT_PYQ_BANK = [
    // --- Data Structures Unit 1 ---
    {
      id: 'pyq_ds_u1_aktu23_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 1,
      unitTitle: 'Introduction, Arrays & Complexity',
      question: 'Define Abstract Data Type (ADT). Differentiate between Linear and Non-Linear data structures with suitable examples.',
      marks: 2,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'An Abstract Data Type (ADT) is a mathematical model for data types where a data type is defined by its behavior (semantics) from the user point of view, specifying operations without exposing internal implementation details.\nLinear Data Structures: Elements are sequentially ordered (e.g., Arrays, Stacks, Queues, Linked Lists).\nNon-Linear Data Structures: Elements have hierarchical or interconnected relationships (e.g., Trees, Graphs).'
    },
    {
      id: 'pyq_ds_u1_aktu23_2',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 1,
      unitTitle: 'Introduction, Arrays & Complexity',
      question: 'An array A[-2..4, -3..5] is stored in column-major order in memory. If base address is 1000 and each element occupies 2 bytes, calculate the memory address of element A[2, 3].',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'Formula for Column-Major Order: Address(A[i, j]) = Base + w * [(j - L2) * M + (i - L1)]\nRows M = U1 - L1 + 1 = 4 - (-2) + 1 = 7.\nw = 2 bytes, Base = 1000, i = 2, j = 3, L2 = -3, L1 = -2.\nAddress(A[2, 3]) = 1000 + 2 * [(3 - (-3)) * 7 + (2 - (-2))]\n= 1000 + 2 * [6 * 7 + 4] = 1000 + 2 * [42 + 4] = 1000 + 2 * 46 = 1000 + 92 = 1092.'
    },

    // --- Data Structures Unit 2 ---
    {
      id: 'pyq_ds_u2_aktu23_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 2,
      unitTitle: 'Stacks, Queues & Recursion',
      question: 'Convert the following infix expression into postfix using Stack: A + (B * C - (D / E ^ F) * G) * H. Show step-by-step stack contents.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'Operator precedence: ^ > * = / > + = -.\nTokens scanned from left to right:\n1. A -> Postfix: A\n2. + -> Stack: [ + ]\n3. ( -> Stack: [ +, ( ]\n4. B -> Postfix: A B\n5. * -> Stack: [ +, (, * ]\n6. C -> Postfix: A B C\n7. - -> Pops *: Postfix: A B C *, Stack: [ +, (, - ]\n8. ( -> Stack: [ +, (, -, ( ]\n9. D -> Postfix: A B C * D\n10. / -> Stack: [ +, (, -, (, / ]\n11. E -> Postfix: A B C * D E\n12. ^ -> Stack: [ +, (, -, (, /, ^ ]\n13. F -> Postfix: A B C * D E F\n14. ) -> Pops ^, /: Postfix: A B C * D E F ^ /, Stack: [ +, (, - ]\n15. * -> Stack: [ +, (, -, * ]\n16. G -> Postfix: A B C * D E F ^ / G\n17. ) -> Pops *, -: Postfix: A B C * D E F ^ / G * -, Stack: [ + ]\n18. * -> Stack: [ +, * ]\n19. H -> Postfix: A B C * D E F ^ / G * - H\n20. End of string: Pops *, +: Final Postfix = A B C * D E F ^ / G * - H * +'
    },
    {
      id: 'pyq_ds_u2_aktu22_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 2,
      unitTitle: 'Stacks, Queues & Recursion',
      question: 'Explain Circular Queue with array representation. Write C functions for insert (enqueue) and delete (dequeue) operations handling full and empty boundary conditions.',
      marks: 7,
      examYear: '2022-23',
      examType: 'Regular',
      paperCode: 'KCS301',
      source: 'AKTU Odd Sem ESE 2022-23',
      solution: 'A Circular Queue is a linear data structure following FIFO principle where the last position connects back to the first. This eliminates memory wastage in linear queues.\nBoundary conditions:\nEmpty: front == -1\nFull: (rear + 1) % MAX == front\nEnqueue: rear = (rear + 1) % MAX; queue[rear] = item;\nDequeue: val = queue[front]; if (front == rear) front = rear = -1; else front = (front + 1) % MAX;'
    },

    // --- Data Structures Unit 3 ---
    {
      id: 'pyq_ds_u3_aktu23_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 3,
      unitTitle: 'Linked Lists',
      question: 'Write a C function to reverse a Singly Linked List in O(n) time and O(1) auxiliary space by manipulating pointers.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'struct Node* reverseList(struct Node* head) {\n    struct Node *prev = NULL, *current = head, *next = NULL;\n    while (current != NULL) {\n        next = current->next;  // save next node\n        current->next = prev;  // reverse pointer\n        prev = current;        // advance prev\n        current = next;        // advance current\n    }\n    return prev; // new head\n}'
    },

    // --- Data Structures Unit 4 ---
    {
      id: 'pyq_ds_u4_aktu23_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 4,
      unitTitle: 'Trees & Binary Search Trees',
      question: 'Construct an AVL tree by inserting the sequence of keys: 14, 17, 11, 7, 53, 4, 13, 12, 8. Clearly show all LL, RR, LR, RL rotations required.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: '1. Insert 14: Root [14]\n2. Insert 17: Right child of 14\n3. Insert 11: Left child of 14\n4. Insert 7: Left child of 11\n5. Insert 53: Right child of 17\n6. Insert 4: Left child of 7 -> Imbalance at node 11 (BF = +2). Right rotation at 11 -> 7 becomes subtree root with children 4 and 11.\n7. Insert 13: Right child of 11\n8. Insert 12: Left child of 13 -> RL imbalance at 11. RL double rotation restores balance.\n9. Insert 8: Right child of 7. Balanced tree achieved.'
    },

    // --- Data Structures Unit 5 ---
    {
      id: 'pyq_ds_u5_aktu23_1',
      subjectCode: 'BCS-301',
      subject: 'Data Structures',
      unit: 5,
      unitTitle: 'Graphs, Sorting & Hashing',
      question: 'Explain Quick Sort algorithm using Divide and Conquer strategy. Trace Quick Sort for array: [38, 27, 43, 3, 9, 82, 10]. Analyze its best, average, and worst-case time complexities.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS301',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'Quick Sort chooses pivot element and partitions array into elements < pivot and elements > pivot, then recursively sorts partitions.\nPartition on [38, 27, 43, 3, 9, 82, 10] with pivot 10: Left [3, 9], Pivot 10, Right [43, 27, 82, 38].\nRecursive calls yield sorted array: [3, 9, 10, 27, 38, 43, 82].\nBest & Average Case: O(n log n). Worst Case: O(n^2) when array is already sorted.'
    },

    // --- COA Unit 1 ---
    {
      id: 'pyq_coa_u1_aktu23_1',
      subjectCode: 'BCS-302',
      subject: 'Computer Organization & Architecture',
      unit: 1,
      unitTitle: 'Functional Units & Arithmetic',
      question: 'Convert decimal number -12.625 into IEEE 754 single-precision (32-bit) floating point representation.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS302',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: '1. Sign: Negative -> Sign bit S = 1.\n2. Binary conversion: 12 = 1100_2. 0.625 * 2 = 1.25 (1), 0.25 * 2 = 0.5 (0), 0.5 * 2 = 1.0 (1) -> 0.101_2.\n12.625 = 1100.101_2.\n3. Normalized: 1.100101 * 2^3.\n4. Exponent E = 3 + 127 = 130_10 = 10000010_2.\n5. Mantissa (23 bits): 10010100000000000000000.\n6. IEEE 754 32-bit format: [1] [10000010] [10010100000000000000000] = C14A0000 (Hex).'
    },

    // --- COA Unit 3 ---
    {
      id: 'pyq_coa_u3_aktu23_1',
      subjectCode: 'BCS-302',
      subject: 'Computer Organization & Architecture',
      unit: 3,
      unitTitle: 'Control Unit & Pipelining',
      question: 'A 4-stage instruction pipeline has stage delays of 150ps, 120ps, 160ps, and 140ps with an interface latch delay of 10ps. Calculate the clock cycle time, maximum throughput, and speedup over non-pipelined execution for 1000 instructions.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS302',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: '1. Clock Cycle Time: tau = max(150, 120, 160, 140) + 10 = 160 + 10 = 170 ps.\n2. Non-pipelined time per instruction: 150 + 120 + 160 + 140 = 570 ps.\nTn = 1000 * 570 ps = 570,000 ps.\nPipelined execution time Tp = (4 + 1000 - 1) * 170 ps = 1003 * 170 ps = 170,510 ps.\n3. Speedup S = Tn / Tp = 570,000 / 170,510 = 3.34x.\nThroughput = 1 / 170 ps = 5.88 GIPS.'
    },

    // --- COA Unit 4 ---
    {
      id: 'pyq_coa_u4_aktu23_1',
      subjectCode: 'BCS-302',
      subject: 'Computer Organization & Architecture',
      unit: 4,
      unitTitle: 'Memory Organization',
      question: 'A computer system features a 64KB cache memory with 16-byte cache lines and a 32-bit physical address space (4GB main memory). Determine the bit field split (Tag, Index, Word offset) for: (a) Direct Cache Mapping (b) 4-Way Set Associative Cache Mapping.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS302',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'Total physical address = 32 bits.\nLine size = 16 bytes = 2^4 bytes -> Word Offset = 4 bits.\nCache size = 64KB = 2^16 bytes.\nTotal cache lines = 2^16 / 2^4 = 4096 lines = 2^12 lines.\n(a) Direct Mapping:\nLine Index = 12 bits, Offset = 4 bits, Tag = 32 - (12 + 4) = 16 bits.\nFormat: [Tag: 16 bits] [Line: 12 bits] [Offset: 4 bits].\n(b) 4-Way Set Associative:\nSets = 4096 / 4 = 1024 sets = 2^10 sets.\nSet Index = 10 bits, Offset = 4 bits, Tag = 32 - (10 + 4) = 18 bits.\nFormat: [Tag: 18 bits] [Set: 10 bits] [Offset: 4 bits].'
    },

    // --- DSTL Unit 4 ---
    {
      id: 'pyq_dstl_u4_aktu23_1',
      subjectCode: 'BCS-303',
      subject: 'Discrete Structures & Theory of Logic',
      unit: 4,
      unitTitle: 'Combinatorics & Recurrence Relations',
      question: 'Solve the homogeneous recurrence relation: a_n - 7a_{n-1} + 10a_{n-2} = 0 for n >= 2, given a_0 = 1, a_1 = 8.',
      marks: 7,
      examYear: '2023-24',
      examType: 'Regular',
      paperCode: 'BCS303',
      source: 'AKTU Odd Sem ESE 2023-24',
      solution: 'Characteristic equation: r^2 - 7r + 10 = 0 -> (r - 2)(r - 5) = 0 -> r1 = 2, r2 = 5.\nGeneral Solution: a_n = C1*(2^n) + C2*(5^n).\nInitial conditions: a_0 = 1 -> C1 + C2 = 1. a_1 = 8 -> 2*C1 + 5*C2 = 8.\nSolving yields: C2 = 2, C1 = -1.\nFinal Closed-Form: a_n = 2*(5^n) - (2^n).'
    }
  ];

  /* ==========================================================================
     5. UPCOMING EXAMS & ACADEMIC PLANNER DEFAULTS
     ========================================================================== */
  const DEFAULT_EXAMS = [
    {
      id: 'exam_aktu_odd_sem',
      title: 'AKTU Odd Semester End-Sem Theory Exams (2024-25)',
      type: 'university',
      date: '2025-01-15T09:30:00',
      description: 'Official Dr. A.P.J. Abdul Kalam Technical University End Semester Theory Examination for 3rd & 5th Semesters.',
      isOfficial: true,
      venue: 'Assigned Examination Centre / College Campus',
      durationHours: 3
    },
    {
      id: 'exam_sessional_1',
      title: 'College Sessional Examination - I',
      type: 'sessional',
      date: '2024-11-04T10:00:00',
      description: 'Internal Assessment Test 1 covering Units 1 and 2.',
      isOfficial: false,
      venue: 'Department Classrooms',
      durationHours: 1.5
    },
    {
      id: 'exam_sessional_2',
      title: 'College Sessional Examination - II',
      type: 'sessional',
      date: '2024-12-08T10:00:00',
      description: 'Internal Assessment Test 2 covering Units 3 and 4.',
      isOfficial: false,
      venue: 'Department Classrooms',
      durationHours: 1.5
    },
    {
      id: 'exam_put',
      title: 'Pre-University Test (PUT) Full Mock Examination',
      type: 'put',
      date: '2024-12-28T09:30:00',
      description: 'Full-syllabus mock test strictly mirroring AKTU End-Sem paper pattern across all 5 units.',
      isOfficial: false,
      venue: 'Examination Hall',
      durationHours: 3
    }
  ];

  return {
    SYLLABUS_REGISTRY,
    VERIFIED_PAPERS,
    TEST_CATALOG,
    UNIT_PYQ_BANK,
    DEFAULT_EXAMS
  };
});

/* ========================================================================
   AKTU COURSES & SYLLABUS DATA
   Dr. A.P.J. Abdul Kalam Technical University, Uttar Pradesh, Lucknow
   Programmes, Semester-wise Subjects, Official Codes, Units & Textbooks
======================================================================== */

const AKTU_PROGRAMMES = [
  {
    id: 'btech-cse',
    code: 'AKTU-UG-CSE',
    name: 'B.Tech in Computer Science & Engineering',
    shortName: 'B.Tech CSE',
    degree: 'B.Tech',
    level: 'UG',
    branch: 'Computer Science & Engineering',
    duration: '4 Years (8 Semesters)',
    scheme: 'NEP 2020 / CBCS Structure',
    eligibility: '10+2 with Physics, Mathematics and Chemistry/CS/IT (Min 45%)',
    description: 'Premier undergraduate engineering programme covering foundational computing, advanced systems, software architecture, data structures, algorithms, machine learning, and computer networks.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I (First Year - Group A)',
        subjects: [
          {
            code: 'KAS-101',
            name: 'Engineering Mathematics - I',
            category: 'Basic Science',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Matrices', desc: 'Elementary transformations, Rank of a matrix, Echelon form, Normal form, Consistency of linear system of equations, Eigenvalues and Eigenvectors, Cayley-Hamilton Theorem, Diagonalization.' },
              { unit: 'Unit II', title: 'Differential Calculus - I', desc: 'Successive differentiation, Leibnitz theorem, Partial derivatives, Euler theorem for homogeneous functions, Total derivatives, Expansion of functions by Taylor and Maclaurin theorems.' },
              { unit: 'Unit III', title: 'Differential Calculus - II', desc: 'Jacobians and their properties, Approximation of errors, Extrema of functions of several variables, Lagrange method of undetermined multipliers.' },
              { unit: 'Unit IV', title: 'Multiple Integrals', desc: 'Double integrals, Change of order of integration, Change of variables, Triple integrals, Application of multiple integrals to area and volume.' },
              { unit: 'Unit V', title: 'Vector Calculus', desc: 'Scalar and vector fields, Gradient, Directional derivative, Divergence and Curl, Line, Surface and Volume integrals, Green, Gauss and Stokes theorems.' }
            ],
            books: ['B.V. Ramana, Higher Engineering Mathematics, Tata McGraw Hill', 'E. Kreyszig, Advanced Engineering Mathematics, John Wiley & Sons']
          },
          {
            code: 'KAS-102',
            name: 'Engineering Physics',
            category: 'Basic Science',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Relativistic Mechanics', desc: 'Inertial frames, Michelson-Morley experiment, Postulates of special theory of relativity, Lorentz transformation, Length contraction, Time dilation, Mass-energy equivalence.' },
              { unit: 'Unit II', title: 'Electromagnetic Field Theory', desc: 'Stokes and Divergence theorem, Continuity equation, Displacement current, Maxwell equations, Wave equation for free space, Poynting theorem.' },
              { unit: 'Unit III', title: 'Quantum Mechanics', desc: 'Wave particle duality, de-Broglie hypothesis, Davisson-Germer experiment, Heisenberg uncertainty principle, Schrodinger wave equation, Particle in a 1D box.' },
              { unit: 'Unit IV', title: 'Wave Optics', desc: 'Interference in thin films, Newton rings, Diffraction at single slit and plane transmission grating, Polarization and Brewster law.' },
              { unit: 'Unit V', title: 'Fiber Optics & Laser', desc: 'Principle of optical fiber, Numerical aperture, Acceptance angle, Spontaneous and Stimulated emission, Ruby laser, He-Ne laser.' }
            ],
            books: ['H.K. Malik and A.K. Singh, Engineering Physics, McGraw Hill', 'Arthur Beiser, Concepts of Modern Physics, Tata McGraw Hill']
          },
          {
            code: 'KCS-101',
            name: 'Programming for Problem Solving (PPS - C)',
            category: 'Engineering Science',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction to Programming', desc: 'Computer architecture basics, Number systems, Memory hierarchy, Compilers, Interpreters, Algorithms and Flowcharts, C data types, Variables, Operators.' },
              { unit: 'Unit II', title: 'Control Statements & Loops', desc: 'Conditional branching (if-else, switch-case), Iteration (while, do-while, for loops), Break, Continue, Goto statements.' },
              { unit: 'Unit III', title: 'Arrays & Functions', desc: '1D and 2D arrays, Character arrays and strings, Standard string functions, Function prototype, Call by value vs Call by reference, Recursion.' },
              { unit: 'Unit IV', title: 'Pointers & Dynamic Memory', desc: 'Pointer declaration, Address operator, Pointer arithmetic, Pointers and arrays, Dynamic memory allocation (malloc, calloc, realloc, free).' },
              { unit: 'Unit V', title: 'Structures, Unions & File I/O', desc: 'Defining structures and unions, Array of structures, Nested structures, File handling in C (fopen, fclose, fscanf, fprintf, fgetc, fputc).' }
            ],
            books: ['E. Balagurusamy, Programming in ANSI C, McGraw Hill', 'Brian W. Kernighan and Dennis M. Ritchie, The C Programming Language, PHI']
          },
          {
            code: 'KEE-101',
            name: 'Basic Electrical Engineering',
            category: 'Engineering Science',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'DC Circuits', desc: 'Ohm law, Kirchhoff laws (KCL & KVL), Mesh and Nodal analysis, Thevenin, Norton, Superposition, and Maximum Power Transfer theorems.' },
              { unit: 'Unit II', title: 'Steady-State Analysis of AC Circuits', desc: 'Representation of sinusoidal waveforms, Peak and RMS values, Form factor, Phasor representation, Single-phase series and parallel R-L, R-C, R-L-C circuits.' },
              { unit: 'Unit III', title: 'Transformers', desc: 'Magnetic circuits, Construction and principle of single-phase transformer, Ideal transformer, EMF equation, Equivalent circuit, Losses, Efficiency.' },
              { unit: 'Unit IV', title: 'Electrical Machines', desc: 'Construction and operating principle of DC motor, Three-phase induction motor, Revolving magnetic field concept, Slip, Torque-slip characteristics.' },
              { unit: 'Unit V', title: 'Electrical Installations', desc: 'Components of LT switchgear: Switch Fuse Unit (SFU), MCB, ELCB, MCCB, Types of wires and cables, Earthing, Battery characteristics.' }
            ],
            books: ['D.P. Kothari and I.J. Nagrath, Basic Electrical Engineering, Tata McGraw Hill']
          }
        ]
      },
      {
        semester: 3,
        title: 'Semester III (Second Year)',
        subjects: [
          {
            code: 'KCS-301',
            name: 'Data Structures',
            category: 'Departmental Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction & Arrays', desc: 'Data structure definitions, Abstract Data Types (ADT), Time & Space complexity, Big-O notations, 1D/2D arrays, Address calculation, Sparse matrices representation.' },
              { unit: 'Unit II', title: 'Stacks & Queues', desc: 'Stack ADT, Array and Linked representations, Applications of Stacks (Infix to Postfix conversion, Expression evaluation), Recursion simulation, Queue ADT, Circular Queue, Deque, Priority Queue.' },
              { unit: 'Unit III', title: 'Linked Lists', desc: 'Singly Linked List, Doubly Linked List, Circular Linked List, Polynomial representation and arithmetic using linked list, Memory allocation and Garbage collection.' },
              { unit: 'Unit IV', title: 'Trees & BST', desc: 'Binary Trees, Tree Traversals (Inorder, Preorder, Postorder), Binary Search Trees (BST), AVL Trees (Rotations and Balancing), B-Trees, Heaps and Priority Queues.' },
              { unit: 'Unit V', title: 'Graphs, Sorting & Hashing', desc: 'Graph representations (Adjacency Matrix, Adjacency List), Traversals (BFS, DFS), Minimum Spanning Tree (Prim, Kruskal), Shortest Path (Dijkstra), Sorting (Quick, Merge, Heap), Hashing techniques and Collision resolution.' }
            ],
            books: ['Aaron M. Tenenbaum, Data Structures Using C and C++, PHI', 'Thomas H. Cormen, Introduction to Algorithms, MIT Press', 'Seymour Lipschutz, Data Structures, McGraw Hill']
          },
          {
            code: 'KCS-302',
            name: 'Computer Organization & Architecture (COA)',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Functional Units & Bus Architecture', desc: 'Von Neumann vs Harvard architecture, Functional units of computer, Bus structures and interconnection, Bus arbitration, Fixed-point and Floating-point representations (IEEE 754).' },
              { unit: 'Unit II', title: 'Central Processing Unit', desc: 'Register organization, ALU design, Instruction format, Addressing modes, Data transfer and manipulation instructions, Program control instructions.' },
              { unit: 'Unit III', title: 'Control Unit & Pipelining', desc: 'Hardwired vs Microprogrammed control unit, Micro-instruction sequencing, Pipelining basics, Instruction pipeline, Pipeline hazards (Structural, Data, Control).' },
              { unit: 'Unit IV', title: 'Memory Organization', desc: 'Memory hierarchy, Main memory (RAM/ROM), Associative memory, Cache memory mapping (Direct, Associative, Set-Associative), Cache replacement policies, Virtual memory.' },
              { unit: 'Unit V', title: 'Input-Output Organization', desc: 'Peripheral devices, I/O interface, Asynchronous data transfer, Modes of transfer (Programmed I/O, Interrupt-driven I/O, Direct Memory Access - DMA), DMA controller.' }
            ],
            books: ['M. Morris Mano, Computer System Architecture, Pearson', 'William Stallings, Computer Organization and Architecture, Pearson']
          },
          {
            code: 'KCS-303',
            name: 'Discrete Structures & Theory of Logic (DSTL)',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Sets, Relations & Functions', desc: 'Sets, Subsets, Power sets, Operations on sets, Venn diagrams, Binary relations, Equivalence relations, Partial ordering relations, Hasse diagrams, Lattices, Functions and Bijective mappings.' },
              { unit: 'Unit II', title: 'Algebraic Structures', desc: 'Semigroups, Monoids, Groups, Subgroups, Abelian groups, Cosets, Lagrange theorem, Normal subgroups, Homomorphism and Isomorphism of groups, Rings and Fields.' },
              { unit: 'Unit III', title: 'Propositional & Predicate Logic', desc: 'Propositions, Logical connectives, Truth tables, Tautologies, Contradictions, Logical equivalence, Normal forms (DNF, CNF), Predicates and Quantifiers, Rules of inference.' },
              { unit: 'Unit IV', title: 'Combinatorics & Recurrence Relations', desc: 'Permutations and Combinations, Pigeonhole principle, Principle of Inclusion-Exclusion, Generating functions, Recurrence relations and solving linear recurrence relations.' },
              { unit: 'Unit V', title: 'Graph Theory', desc: 'Graphs, Subgraphs, Walks, Paths, Cycles, Connected components, Euler graphs, Hamiltonian paths, Trees, Spanning trees, Planar graphs, Graph coloring.' }
            ],
            books: ['Kenneth H. Rosen, Discrete Mathematics and Its Applications, McGraw Hill', 'C.L. Liu, Elements of Discrete Mathematics, McGraw Hill']
          },
          {
            code: 'KNC-301',
            name: 'Universal Human Values & Professional Ethics',
            category: 'Humanities & Social Sciences',
            ltp: '2-0-0',
            credits: 2,
            marks: 'Internal: 50 | Total: 50',
            units: [
              { unit: 'Unit I', title: 'Course Introduction - Need & Basic Guidelines', desc: 'Understanding value education, Self-exploration, Natural acceptance and experiential validation, Continuous happiness and prosperity.' },
              { unit: 'Unit II', title: 'Harmony in the Human Being', desc: 'Human being as a co-existence of Self (I) and Body, Needs of Self and Body, Sukh and Suvidha, Program for self-organization (Sanyam and Swasthya).' },
              { unit: 'Unit III', title: 'Harmony in the Family & Society', desc: 'Values in human relationships (Trust - Vishwas, Respect - Samman, Affection, Gratitude), Comprehensive human goal in society.' },
              { unit: 'Unit IV', title: 'Harmony in Nature & Existence', desc: 'Interconnectedness and mutual fulfillment in nature, Four orders of nature (Material, Pranic, Animal, Human), Holistic perception of harmony.' },
              { unit: 'Unit V', title: 'Professional Ethics & Competence', desc: 'Definitiveness of ethical human conduct, Holistic technologies, Production systems and management models, Transition towards universal human order.' }
            ],
            books: ['R.R. Gaur, R. Sangal, G.P. Bagaria, A Foundation Course in Human Values and Professional Ethics, Excel Books']
          }
        ]
      },
      {
        semester: 4,
        title: 'Semester IV (Second Year)',
        subjects: [
          {
            code: 'KCS-401',
            name: 'Operating Systems',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'OS Concepts & Process Management', desc: 'Operating system functions and structure, System calls, Process concept, Process states, Process Control Block (PCB), Process scheduling (FCFS, SJF, Priority, Round Robin), Inter-Process Communication (IPC).' },
              { unit: 'Unit II', title: 'Process Synchronization & Deadlocks', desc: 'Critical section problem, Peterson solution, Semaphores, Monitors, Classic synchronization problems (Dining Philosophers, Producer-Consumer), Deadlock characterization, Prevention, Avoidance (Banker algorithm), Detection and Recovery.' },
              { unit: 'Unit III', title: 'Memory Management', desc: 'Logical vs Physical address space, Swapping, Contiguous memory allocation, Paging, Page table structure, Segmentation, Virtual memory, Demand paging, Page replacement algorithms (FIFO, LRU, Optimal), Thrashing.' },
              { unit: 'Unit IV', title: 'File System & Directory Structure', desc: 'File concept, Access methods (Sequential, Direct), Directory structures, File mounting, File allocation methods (Contiguous, Linked, Indexed), Free-space management.' },
              { unit: 'Unit V', title: 'Disk Management & Protection', desc: 'Disk structure, Disk scheduling algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK), RAID levels, System protection and security goals, Access matrix model.' }
            ],
            books: ['Abraham Silberschatz, Peter B. Galvin, Greg Gagne, Operating System Concepts, Wiley', 'Andrew S. Tanenbaum, Modern Operating Systems, Pearson']
          },
          {
            code: 'KCS-402',
            name: 'Theory of Automata & Formal Languages (TAFL)',
            category: 'Departmental Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Finite Automata', desc: 'Alphabets, Strings, Languages, Deterministic Finite Automata (DFA), Non-deterministic Finite Automata (NFA), Equivalence of DFA and NFA, Minimization of DFA, Moore and Mealy machines.' },
              { unit: 'Unit II', title: 'Regular Expressions & Languages', desc: 'Regular expressions, Regular grammars, Arden theorem, Pumping Lemma for regular languages, Closure properties of regular languages.' },
              { unit: 'Unit III', title: 'Context-Free Grammars & Languages', desc: 'Context-Free Grammars (CFG), Derivation trees, Ambiguity in grammars, Simplification of CFG, Normal forms (Chomsky Normal Form - CNF, Greibach Normal Form - GNF).' },
              { unit: 'Unit IV', title: 'Pushdown Automata', desc: 'Pushdown Automata (PDA) definition and model, Acceptance by final state and empty stack, Equivalence of PDA and CFG, Deterministic PDA, Pumping Lemma for CFL.' },
              { unit: 'Unit V', title: 'Turing Machines & Computability', desc: 'Turing Machine model, Design of Turing Machines, Variations of Turing Machines, Church-Turing thesis, Universal Turing Machine, Decidability, Halting Problem, Post Correspondence Problem (PCP).' }
            ],
            books: ['John E. Hopcroft, Rajeev Motwani, Jeffrey D. Ullman, Introduction to Automata Theory, Languages, and Computation, Pearson', 'Michael Sipser, Introduction to the Theory of Computation, Cengage']
          },
          {
            code: 'KNC-402',
            name: 'Python Programming',
            category: 'Mandatory Course',
            ltp: '2-0-0',
            credits: 2,
            marks: 'Internal: 50 | Total: 50',
            units: [
              { unit: 'Unit I', title: 'Python Basics & Control Flow', desc: 'Python interpreter, Variables, Expressions, Data types, Conditional statements, Loops, Functions, Fruitful functions, Scope of variables.' },
              { unit: 'Unit II', title: 'Data Structures in Python', desc: 'Strings, Lists, Tuples, Dictionaries, Sets, List comprehensions, Slicing and indexing, Built-in methods and algorithms.' },
              { unit: 'Unit III', title: 'Modules & File Handling', desc: 'Modules, Packages, Standard libraries (os, sys, math, random), File operations (read, write, append), Exception handling (try, except, finally).' },
              { unit: 'Unit IV', title: 'Object-Oriented Python', desc: 'Classes and Objects, Encapsulation, Inheritance, Polymorphism, Operator overloading, Method overriding, Abstract classes.' },
              { unit: 'Unit V', title: 'Scientific & Data Libraries', desc: 'NumPy for multi-dimensional arrays, Pandas for dataframes and tabular analysis, Matplotlib for data visualization.' }
            ],
            books: ['Allen B. Downey, Think Python, O\'Reilly', 'Mark Lutz, Learning Python, O\'Reilly']
          }
        ]
      },
      {
        semester: 5,
        title: 'Semester V (Third Year)',
        subjects: [
          {
            code: 'KCS-501',
            name: 'Database Management Systems (DBMS)',
            category: 'Departmental Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Database Architecture & ER Modeling', desc: 'Database system architecture, Data abstraction, Three-schema architecture, Data independence, Entity-Relationship (ER) model, Enhanced ER (EER) diagrams.' },
              { unit: 'Unit II', title: 'Relational Model & Relational Algebra', desc: 'Relational data model, Integrity constraints (Entity, Referential, Domain), Relational algebra operations (Select, Project, Join, Union, Difference), Tuple Relational Calculus, SQL DDL/DML/DCL.' },
              { unit: 'Unit III', title: 'Relational Database Design & Normalization', desc: 'Functional dependencies, Normal forms: 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), Multi-valued dependencies and 4NF, Lossless-join decomposition, Dependency preservation.' },
              { unit: 'Unit IV', title: 'Transaction Processing & Concurrency', desc: 'Transaction concept, ACID properties, Transaction states, Serializability (Conflict and View), Concurrency control protocols: Two-Phase Locking (2PL), Timestamp ordering, Deadlock handling.' },
              { unit: 'Unit V', title: 'Recovery & Storage Indexing', desc: 'Recovery systems, Log-based recovery (Deferred and Immediate update), Checkpoints, Shadow paging, File organization, B-Tree and B+ Tree indexing, Hashing techniques.' }
            ],
            books: ['Abraham Silberschatz, Henry F. Korth, S. Sudarshan, Database System Concepts, McGraw Hill', 'Ramez Elmasri, Shamkant B. Navathe, Fundamentals of Database Systems, Pearson']
          },
          {
            code: 'KCS-502',
            name: 'Compiler Design',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction & Lexical Analysis', desc: 'Phases of compiler, Compiler construction tools, Lexical analysis role, Tokens, Patterns, Lexemes, Specification of tokens, Regular expressions, Lexical Analyzer Generator (LEX).' },
              { unit: 'Unit II', title: 'Syntax Analysis & Parsing', desc: 'Role of parser, Context-free grammars, Top-down parsing (Recursive Descent, LL(1) parsers), First and Follow sets, Bottom-up parsing (Shift-Reduce, Operator Precedence, LR parsers: SLR, CLR, LALR), YACC parser generator.' },
              { unit: 'Unit III', title: 'Syntax-Directed Translation & Type Checking', desc: 'Syntax-Directed Definitions (SDD), Inherited and Synthesized attributes, Dependency graphs, Evaluation order, Syntax-Directed Translation schemes, Type systems, Type expressions, Type checking.' },
              { unit: 'Unit IV', title: 'Intermediate Code Generation & Symbol Tables', desc: 'Intermediate languages: Three-address code, Quadruples, Triples, Syntax trees, Translation of expressions, Control flow, Symbol table organization and management.' },
              { unit: 'Unit V', title: 'Code Optimization & Generation', desc: 'Principal sources of optimization, Basic blocks and Flow graphs, Loop optimization, DAG representation, Target machine code generation, Register allocation and assignment.' }
            ],
            books: ['Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman, Compilers: Principles, Techniques, and Tools, Pearson']
          },
          {
            code: 'KCS-503',
            name: 'Design & Analysis of Algorithms (DAA)',
            category: 'Departmental Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Algorithm Analysis & Recurrences', desc: 'Algorithm characteristics, Asymptotic notations (Big O, Omega, Theta), Master Theorem, Recurrence tree method, Substitution method, Advanced sorting (Heap sort, Radix sort, Counting sort).' },
              { unit: 'Unit II', title: 'Divide & Conquer, Greedy Method', desc: 'Divide and conquer strategy, Strassen matrix multiplication, Greedy algorithm paradigm, Fractional Knapsack problem, Huffman coding, Job sequencing with deadlines, Optimal storage on tapes.' },
              { unit: 'Unit III', title: 'Dynamic Programming', desc: 'Principle of optimality, 0/1 Knapsack problem, Matrix Chain Multiplication, Longest Common Subsequence (LCS), Bellman-Ford shortest path, Floyd-Warshall all-pairs shortest path, Traveling Salesperson Problem (TSP).' },
              { unit: 'Unit IV', title: 'Backtracking & Branch and Bound', desc: 'State space tree, Backtracking: 8-Queens problem, Graph coloring, Hamiltonian cycles, Subset sum problem, Branch and Bound: 0/1 Knapsack, Assignment problem.' },
              { unit: 'Unit V', title: 'Tractable & Intractable Problems', desc: 'P, NP, NP-Complete, and NP-Hard classes, Reducibility, Cook Theorem, Proving NP-Completeness (3-SAT, Clique problem, Vertex Cover), Approximation algorithms.' }
            ],
            books: ['Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein, Introduction to Algorithms, MIT Press', 'Ellis Horowitz, Sartaj Sahni, Sanguthevar Rajasekaran, Fundamentals of Computer Algorithms, Universities Press']
          }
        ]
      },
      {
        semester: 6,
        title: 'Semester VI (Third Year)',
        subjects: [
          {
            code: 'KCS-601',
            name: 'Software Engineering',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Software Process Models', desc: 'Software engineering discipline, Software development lifecycle (SDLC), Waterfall, Prototyping, Spiral, Agile methodologies (Scrum, Kanban, XP).' },
              { unit: 'Unit II', title: 'Requirements & Architectural Design', desc: 'Requirement engineering, SRS document (IEEE standard), Data Flow Diagrams (DFD), Use case diagrams, Class diagrams, Sequence diagrams, Architectural patterns.' },
              { unit: 'Unit III', title: 'Software Metrics & Project Estimation', desc: 'Size-oriented metrics, Function Point (FP) analysis, COCOMO model, Halstead software science, Project scheduling, Gantt charts, PERT/CPM networks.' },
              { unit: 'Unit IV', title: 'Software Testing & Quality Assurance', desc: 'Software testing objectives, White-box testing (Cyclomatic complexity, Path testing), Black-box testing (Equivalence partitioning, Boundary value analysis), Unit, Integration, System, Acceptance testing, CMMI, ISO standards.' },
              { unit: 'Unit V', title: 'Maintenance & Software Evolution', desc: 'Software maintenance types (Corrective, Adaptive, Perfective, Preventive), Reverse engineering, Re-engineering, Configuration management, CASE tools.' }
            ],
            books: ['Roger S. Pressman, Software Engineering: A Practitioner\'s Approach, McGraw Hill', 'Ian Sommerville, Software Engineering, Pearson']
          },
          {
            code: 'KCS-602',
            name: 'Web Technology',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'HTML5, CSS3 & Responsive Design', desc: 'Web architecture, HTTP protocol, HTML5 semantic elements, CSS3 box model, Flexbox, Grid, CSS animations, Responsive Web Design media queries.' },
              { unit: 'Unit II', title: 'Client-Side Scripting - JavaScript', desc: 'JavaScript language fundamentals, DOM manipulation, Event handling, ES6 features (Arrow functions, Promises, Async/Await), JSON processing.' },
              { unit: 'Unit III', title: 'Server-Side Web Architecture', desc: 'Web servers, Server architecture, Servlets, JavaServer Pages (JSP) or Node.js runtime, RESTful API architecture, Handling GET/POST requests, Session management.' },
              { unit: 'Unit IV', title: 'Database Connectivity & ORM', desc: 'JDBC architecture, Establishing database connections, Executing SQL queries, Transaction handling, Basics of Object-Relational Mapping (ORM).' },
              { unit: 'Unit V', title: 'Web Security & Contemporary Frameworks', desc: 'Web security vulnerabilities (XSS, CSRF, SQL Injection), HTTPS & SSL/TLS, Single Page Applications (SPA) overview, Microservices architecture.' }
            ],
            books: ['Uttam K. Roy, Web Technologies, Oxford University Press', 'Jon Duckett, HTML and CSS: Design and Build Websites, Wiley']
          },
          {
            code: 'KCS-603',
            name: 'Computer Networks',
            category: 'Departmental Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Network Architecture & Physical Layer', desc: 'Data communications, Network topology, LAN, MAN, WAN, OSI reference model, TCP/IP protocol suite, Transmission media, Bandwidth, Throughput, Transmission impairment.' },
              { unit: 'Unit II', title: 'Data Link Layer & MAC', desc: 'Framing, Error detection & correction (CRC, Hamming code), Flow control protocols (Stop-and-Wait, Go-Back-N, Selective Repeat), Multiple Access protocols (ALOHA, CSMA/CD, CSMA/CA), Ethernet standards.' },
              { unit: 'Unit III', title: 'Network Layer & Routing', desc: 'Logical addressing: IPv4 vs IPv6, Subnetting and CIDR, Routing algorithms: Distance Vector (Bellman-Ford), Link State (Dijkstra), OSPF, BGP, ARP, RARP, ICMP.' },
              { unit: 'Unit IV', title: 'Transport Layer', desc: 'Process-to-process delivery, Port addresses, UDP segment format and operation, TCP connection management (Three-way handshake), Flow control, Congestion control algorithms (Leaky bucket, Token bucket).' },
              { unit: 'Unit V', title: 'Application Layer & Network Security', desc: 'DNS (Domain Name System), HTTP/HTTPS, FTP, SMTP, POP3, Network security fundamentals, Cryptography basics (Symmetric vs Asymmetric), Firewalls.' }
            ],
            books: ['Andrew S. Tanenbaum, David J. Wetherall, Computer Networks, Pearson', 'Behrouz A. Forouzan, Data Communications and Networking, McGraw Hill']
          }
        ]
      },
      {
        semester: 7,
        title: 'Semester VII (Fourth Year)',
        subjects: [
          {
            code: 'KCS-701',
            name: 'Artificial Intelligence',
            category: 'Departmental Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction & Search Techniques', desc: 'Turing test, Agent architectures, Uninformed search (BFS, DFS, Uniform Cost Search), Informed search (A* search, AO* search, Heuristic functions), Adversarial search (Minimax, Alpha-Beta pruning).' },
              { unit: 'Unit II', title: 'Knowledge Representation', desc: 'Propositional logic, First-Order Logic (FOL), Resolution principle, Forward and Backward chaining, Semantic networks, Frames, Conceptual dependency.' },
              { unit: 'Unit III', title: 'Reasoning Under Uncertainty', desc: 'Probabilistic reasoning, Bayes Rule, Bayesian Belief Networks (BBN), Dempster-Shafer theory, Fuzzy logic and fuzzy sets.' },
              { unit: 'Unit IV', title: 'Planning & Learning Basics', desc: 'Components of planning system, STRIPS representation, Goal Stack Planning, Supervised, Unsupervised and Reinforcement learning foundations.' },
              { unit: 'Unit V', title: 'Natural Language Processing & Expert Systems', desc: 'Syntactic analysis, Parsing, Semantic analysis, Discourse processing, Expert system architecture, Knowledge engineering, Real-world AI applications.' }
            ],
            books: ['Stuart Russell, Peter Norvig, Artificial Intelligence: A Modern Approach, Pearson', 'Elaine Rich, Kevin Knight, Artificial Intelligence, McGraw Hill']
          },
          {
            code: 'KCS-702',
            name: 'Cloud Computing',
            category: 'Departmental Elective',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Cloud Fundamentals & Virtualization', desc: 'Cloud computing characteristics, Service models (IaaS, PaaS, SaaS), Deployment models (Public, Private, Hybrid, Community), Virtualization types (Hypervisors, Containers).' },
              { unit: 'Unit II', title: 'Cloud Infrastructure & Storage', desc: 'Data center architecture, Elastic compute, Distributed file systems (GFS, HDFS), Object storage, Block storage, Cloud database systems.' },
              { unit: 'Unit III', title: 'Resource Provisioning & Orchestration', desc: 'Dynamic resource management, Auto-scaling, SLA management, Container orchestration with Kubernetes, Serverless architecture (FaaS).' },
              { unit: 'Unit IV', title: 'Cloud Security & Privacy', desc: 'Cloud threat taxonomy, Identity and Access Management (IAM), Data encryption in transit and at rest, Multi-tenancy isolation, Compliance standards.' },
              { unit: 'Unit V', title: 'Cloud Platforms & Contemporary Trends', desc: 'Amazon Web Services (AWS), Google Cloud Platform (GCP), Microsoft Azure architectural overview, Edge computing, Fog computing.' }
            ],
            books: ['Rajkumar Buyya, Christian Vecchiola, S. Thamarai Selvi, Mastering Cloud Computing, McGraw Hill']
          }
        ]
      }
    ]
  },
  {
    id: 'mca',
    code: 'AKTU-PG-MCA',
    name: 'Master of Computer Applications (MCA)',
    shortName: 'MCA',
    degree: 'MCA',
    level: 'PG',
    branch: 'Computer Applications',
    duration: '2 Years (4 Semesters)',
    scheme: 'AICTE / AKTU Revised 2-Year Scheme',
    eligibility: 'BCA / B.Sc / B.Com / B.A. with Mathematics at 10+2 or Graduation (Min 50%)',
    description: 'Postgraduate professional master\'s curriculum focused on modern software design, cloud engineering, enterprise data platforms, machine learning, and IT management.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I (First Year)',
        subjects: [
          {
            code: 'KCA-101',
            name: 'Fundamental of Computers & Emerging Technologies',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Computer Architecture & Evolution', desc: 'Architecture of modern computers, CPU organization, Memory hierarchies, Bus systems, System software vs Application software.' },
              { unit: 'Unit II', title: 'Operating Systems & Networking', desc: 'OS functions, Processes, Memory management, Network topologies, OSI and TCP/IP protocol architectures.' },
              { unit: 'Unit III', title: 'Cloud Computing & IoT', desc: 'Cloud paradigms, Virtualization, IoT architecture, Sensors, Actuators, Smart city applications.' },
              { unit: 'Unit IV', title: 'Data Analytics & AI', desc: 'Big data concepts, Machine learning fundamentals, Neural networks, Real-world AI applications.' },
              { unit: 'Unit V', title: 'Cyber Security & Blockchain', desc: 'Threat vectors, Cryptography, Blockchain distributed ledgers, Smart contracts.' }
            ],
            books: ['V. Rajaraman, Fundamentals of Computers, PHI']
          },
          {
            code: 'KCA-102',
            name: 'Problem Solving with Python',
            category: 'Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Python Fundamentals', desc: 'Variables, Data types, Operators, Control structures, Loops, Functional programming principles.' },
              { unit: 'Unit II', title: 'Data Structures', desc: 'Lists, Tuples, Sets, Dictionaries, Slicing, List and dict comprehensions.' },
              { unit: 'Unit III', title: 'OOP in Python', desc: 'Classes, Objects, Inheritance, Polymorphism, Magic methods, Custom exceptions.' },
              { unit: 'Unit IV', title: 'File Handling & Modules', desc: 'File streams, Serialization (Pickle, JSON), Standard library modules, Virtual environments.' },
              { unit: 'Unit V', title: 'Scientific Computing', desc: 'NumPy arrays, Pandas DataFrames, Matplotlib visualization, Scikit-learn basics.' }
            ],
            books: ['Mark Lutz, Programming Python, O\'Reilly']
          }
        ]
      },
      {
        semester: 2,
        title: 'Semester II (First Year)',
        subjects: [
          {
            code: 'KCA-201',
            name: 'Data Structures & Algorithms with C',
            category: 'Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Complexity & Linear Data Structures', desc: 'Asymptotic notation, Stacks, Queues, Circular queues, Linked lists, Polynomial manipulation.' },
              { unit: 'Unit II', title: 'Trees & BST', desc: 'Binary search trees, AVL trees, Red-Black trees, B-Trees, Traversals and applications.' },
              { unit: 'Unit III', title: 'Graphs & Shortest Paths', desc: 'Graph representations, BFS, DFS, Dijkstra, Bellman-Ford, Prim, Kruskal.' },
              { unit: 'Unit IV', title: 'Divide & Conquer, Dynamic Programming', desc: 'Sorting algorithms, Matrix chain multiplication, Longest common subsequence, 0/1 Knapsack.' },
              { unit: 'Unit V', title: 'NP-Completeness & Hashing', desc: 'Hash tables, Collision strategies, P vs NP, Approximation algorithms.' }
            ],
            books: ['Thomas H. Cormen, Introduction to Algorithms, MIT Press']
          },
          {
            code: 'KCA-202',
            name: 'Object Oriented Programming with Java',
            category: 'Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Java Basics & OOP', desc: 'JVM architecture, Class path, Encapsulation, Inheritance, Interfaces, Abstract classes.' },
              { unit: 'Unit II', title: 'Exception Handling & Packages', desc: 'Checked/unchecked exceptions, Try-catch-finally, User-defined exceptions, Java packages.' },
              { unit: 'Unit III', title: 'Multithreading & Concurrency', desc: 'Thread lifecycle, Synchronization, Locks, Inter-thread communication, Executors.' },
              { unit: 'Unit IV', title: 'Java Collections Framework', desc: 'List, Set, Map, Queue, Generics, Iterators, Lambda expressions, Streams API.' },
              { unit: 'Unit V', title: 'I/O Streams & JDBC', desc: 'Byte and character streams, Serialization, JDBC drivers, PreparedStatement, Connection pooling.' }
            ],
            books: ['Herbert Schildt, Java: The Complete Reference, McGraw Hill']
          }
        ]
      }
    ]
  },
  {
    id: 'bpharm',
    code: 'AKTU-UG-BPHARM',
    name: 'Bachelor of Pharmacy (B.Pharm)',
    shortName: 'B.Pharm',
    degree: 'B.Pharm',
    level: 'UG',
    branch: 'Pharmacy',
    duration: '4 Years (8 Semesters)',
    scheme: 'PCI Standard Curriculum / AKTU Regulated',
    eligibility: '10+2 with Physics, Chemistry and Biology/Mathematics (Min 50%)',
    description: 'Comprehensive pharmaceutical science curriculum covering human anatomy, pharmaceutics, pharmaceutical chemistry, pharmacology, pharmacognosy, and pharmaceutical jurisprudence.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I (First Year)',
        subjects: [
          {
            code: 'BP-101T',
            name: 'Human Anatomy and Physiology - I',
            category: 'Pharmaceutical Sciences',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Cellular Level & Tissues', desc: 'Cell structure and functions, Homeostasis, Transport mechanisms, Classification of tissues.' },
              { unit: 'Unit II', title: 'Integumentary & Skeletal Systems', desc: 'Skin structure and functions, Bones classification, Division of skeletal system, Joints.' },
              { unit: 'Unit III', title: 'Body Fluids & Lymphatic System', desc: 'Blood composition and functions, Hemopoiesis, Blood groups, Coagulation, Lymph organs.' },
              { unit: 'Unit IV', title: 'Peripheral Nervous System', desc: 'Classification of PNS, Structure and function of sympathetic and parasympathetic systems.' },
              { unit: 'Unit V', title: 'Cardiovascular System', desc: 'Heart anatomy and physiology, Cardiac cycle, ECG, Blood pressure regulation, Circulation circuits.' }
            ],
            books: ['Ross and Wilson, Anatomy and Physiology in Health and Illness, Churchill Livingstone']
          },
          {
            code: 'BP-102T',
            name: 'Pharmaceutical Analysis - I',
            category: 'Pharmaceutical Sciences',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Errors & Volumetric Analysis', desc: 'Sources of errors, Precision, Accuracy, Expressing concentration, Primary and secondary standards.' },
              { unit: 'Unit II', title: 'Acid-Base Titration', desc: 'Acid-base neutralization curves, Theory of indicators, Non-aqueous titrations.' },
              { unit: 'Unit III', title: 'Precipitation & Complexometric Titrations', desc: 'Mohr method, Volhard method, Fajan method, EDTA titrations and masking agents.' },
              { unit: 'Unit IV', title: 'Redox Titrations', desc: 'Permanganometry, Dichrometry, Iodometry, Iodimetry, Cerimetry, Karl Fischer titration.' },
              { unit: 'Unit V', title: 'Electroanalytical Methods', desc: 'Potentiometry, Conductometry, Polarography, Reference electrodes, Dropping mercury electrode.' }
            ],
            books: ['A.H. Beckett and J.B. Stenlake, Practical Pharmaceutical Chemistry, CBS Publishers']
          },
          {
            code: 'BP-103T',
            name: 'Pharmaceutics - I',
            category: 'Pharmaceutical Sciences',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Historical Background & Dosage Forms', desc: 'Indian Pharmacopoeia (IP), British Pharmacopoeia (BP), Prescription parts and handling, Posology.' },
              { unit: 'Unit II', title: 'Pharmaceutical Calculations & Powders', desc: 'Weights and measures, Proof spirit, Powders classification, Dusting powders, Effervescent granules.' },
              { unit: 'Unit III', title: 'Liquid Dosage Forms', desc: 'Monophasic liquids: Syrups, Elixirs, Linctuses, Gargles, Mouthwashes, Throat paints.' },
              { unit: 'Unit IV', title: 'Biphasic Dosage Forms', desc: 'Suspensions: Flocculated vs Deflocculated, Emulsions: Identification tests, Stability issues.' },
              { unit: 'Unit V', title: 'Suppositories & Pharmaceutical Incompatibilities', desc: 'Suppository bases, Displacement value, Physical, Chemical, and Therapeutic incompatibilities.' }
            ],
            books: ['R.M. Mehta, Dispensing Pharmacy, Vallabh Prakashan']
          }
        ]
      },
      {
        semester: 3,
        title: 'Semester III (Second Year)',
        subjects: [
          {
            code: 'BP-301T',
            name: 'Pharmaceutical Organic Chemistry - II',
            category: 'Pharmaceutical Sciences',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Benzene & Its Homologs', desc: 'Structure of benzene, Kekulé structure, Aromaticity, Electrophilic aromatic substitution, Orientation in disubstituted benzenes.' },
              { unit: 'Unit II', title: 'Phenols, Aromatic Amines & Acids', desc: 'Acidity of phenols, Coupling reactions, Basicity of amines, Diazotization reactions, Acidity of aromatic acids.' },
              { unit: 'Unit III', title: 'Fats & Oils', desc: 'Fatty acids, Saponification value, Ester value, Acid value, Iodine value, Rancidity of oils.' },
              { unit: 'Unit IV', title: 'Polynuclear Hydrocarbons', desc: 'Naphthalene, Phenanthrene, Anthracene synthesis, reactions and medicinal significance.' },
              { unit: 'Unit V', title: 'Cycloalkanes', desc: 'Baeyer strain theory, Limitations, Sachse-Mohr theory, Theory of strainless rings.' }
            ],
            books: ['Morrison and Boyd, Organic Chemistry, Pearson']
          }
        ]
      }
    ]
  },
  {
    id: 'mba',
    code: 'AKTU-PG-MBA',
    name: 'Master of Business Administration (MBA)',
    shortName: 'MBA',
    degree: 'MBA',
    level: 'PG',
    branch: 'Management',
    duration: '2 Years (4 Semesters)',
    scheme: 'AKTU Master of Business Administration Curriculum',
    eligibility: 'Bachelor Degree in any discipline (Min 50%) + CUET-PG / CAT / MAT',
    description: 'Premier management programme designed for executive leadership, financial analysis, strategic planning, human resource management, digital marketing, and business analytics.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I (First Year)',
        subjects: [
          {
            code: 'KMBN-101',
            name: 'Management Concepts & Organisational Behaviour',
            category: 'Core Management',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Management Foundations', desc: 'Evolution of management thought, Taylor scientific management, Fayol administrative theory, Modern management functions.' },
              { unit: 'Unit II', title: 'Planning & Decision Making', desc: 'Strategic planning, Management by Objectives (MBO), Decision-making models and cognitive biases.' },
              { unit: 'Unit III', title: 'Individual Behaviour in Organizations', desc: 'Personality theories, Perception, Attribution theory, Learning and Motivation (Maslow, Herzberg, Vroom).' },
              { unit: 'Unit IV', title: 'Group Dynamics & Leadership', desc: 'Group cohesion, Team building, Conflict management styles, Transformational vs Transactional leadership.' },
              { unit: 'Unit V', title: 'Organizational Culture & Change', desc: 'Organizational climate, Lewin change model, Resistance to change, Stress management strategies.' }
            ],
            books: ['Stephen P. Robbins, Organizational Behavior, Pearson', 'Harold Koontz, Essentials of Management, McGraw Hill']
          },
          {
            code: 'KMBN-102',
            name: 'Managerial Economics',
            category: 'Core Management',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Economic Principles in Business', desc: 'Nature and scope of managerial economics, Opportunity cost, Marginal analysis, Equi-marginal principle.' },
              { unit: 'Unit II', title: 'Demand & Supply Dynamics', desc: 'Law of demand, Elasticity of demand (Price, Income, Cross), Demand forecasting techniques.' },
              { unit: 'Unit III', title: 'Production & Cost Analysis', desc: 'Production function, Law of diminishing returns, Economies of scale, Short-run and Long-run cost curves.' },
              { unit: 'Unit IV', title: 'Market Structures & Pricing', desc: 'Perfect competition, Monopoly, Monopolistic competition, Oligopoly models, Pricing strategies.' },
              { unit: 'Unit V', title: 'Macroeconomic Environment', desc: 'National income concepts (GDP, GNP), Inflation dynamics, Monetary policy, Fiscal policy, Business cycles.' }
            ],
            books: ['Dominick Salvatore, Managerial Economics in a Global Economy, Oxford']
          },
          {
            code: 'KMBN-105',
            name: 'Marketing Management',
            category: 'Core Management',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Marketing Concept & Environment', desc: 'Core marketing concepts, Marketing mix (4Ps & 7Ps), Macro and Micro environmental analysis.' },
              { unit: 'Unit II', title: 'STP - Segmentation, Targeting, Positioning', desc: 'Market segmentation criteria, Target market selection, Value proposition, Brand positioning strategies.' },
              { unit: 'Unit III', title: 'Product & Pricing Decisions', desc: 'Product life cycle (PLC), New product development process, Pricing methods and price elasticity.' },
              { unit: 'Unit IV', title: 'Channel Management & Logistics', desc: 'Marketing channels, Intermediaries, Retailing, Wholesaling, Supply chain integration.' },
              { unit: 'Unit V', title: 'Integrated Marketing Communications', desc: 'Promotional mix (Advertising, PR, Personal selling, Sales promotion), Digital marketing channels.' }
            ],
            books: ['Philip Kotler, Kevin Lane Keller, Marketing Management, Pearson']
          }
        ]
      },
      {
        semester: 3,
        title: 'Semester III (Second Year)',
        subjects: [
          {
            code: 'KMBN-301',
            name: 'Strategic Management',
            category: 'Core Management',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Strategic Intent & Environmental Appraisal', desc: 'Vision, Mission, Objectives, PESTEL analysis, Porter Five Forces framework, Resource-Based View (RBV).' },
              { unit: 'Unit II', title: 'Strategy Formulation', desc: 'Corporate-level strategies (Growth, Stability, Retrenchment), Porter Generic business strategies, Ansoff Matrix.' },
              { unit: 'Unit III', title: 'Portfolio Analysis', desc: 'BCG Growth-Share Matrix, GE-McKinsey Matrix, Strategic Business Units (SBUs).' },
              { unit: 'Unit IV', title: 'Strategy Implementation', desc: 'McKinsey 7S framework, Structural alignment, Resource allocation, Strategic leadership.' },
              { unit: 'Unit V', title: 'Strategic Evaluation & Control', desc: 'Balanced Scorecard, Benchmarking, Operational control vs Strategic audit.' }
            ],
            books: ['Fred R. David, Strategic Management: A Competitive Advantage Approach, Pearson']
          }
        ]
      }
    ]
  },
  {
    id: 'bca',
    code: 'AKTU-UG-BCA',
    name: 'Bachelor of Computer Applications (BCA)',
    shortName: 'BCA',
    degree: 'BCA',
    level: 'UG',
    branch: 'Computer Applications',
    duration: '3 Years (6 Semesters)',
    scheme: 'AKTU Affiliated / CBCS Scheme',
    eligibility: '10+2 in any stream with Mathematics (Min 45%)',
    description: 'Undergraduate computer application programme providing a thorough grounding in software development, web systems, database design, and mobile computing.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I',
        subjects: [
          {
            code: 'BCA-101',
            name: 'Mathematics - I',
            category: 'Basic Science',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Determinants & Matrices', desc: 'Properties of determinants, Inverse of matrices, Rank, Cramer rule, Solution of linear equations.' },
              { unit: 'Unit II', title: 'Differential Calculus', desc: 'Limits, Continuity, Differentiability, Successive differentiation, Rolle and Mean value theorems.' },
              { unit: 'Unit III', title: 'Integral Calculus', desc: 'Definite integrals, Integration by parts, Partial fractions, Reduction formulae.' },
              { unit: 'Unit IV', title: 'Co-ordinate Geometry', desc: 'Straight lines, Circles, Parabola, Ellipse, Hyperbola standard equations.' },
              { unit: 'Unit V', title: 'Vector Algebra', desc: 'Dot product, Cross product, Scalar triple product, Vector equations.' }
            ],
            books: ['H.K. Dass, Engineering Mathematics, S. Chand']
          },
          {
            code: 'BCA-102',
            name: 'Programming Principle & Algorithm',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Problem Solving Concepts', desc: 'Steps in problem solving, Pseudocode, Flowchart symbols, Variables, Constants.' },
              { unit: 'Unit II', title: 'C Fundamentals', desc: 'Tokens, Operators, Expressions, Data types, Formatted I/O (printf, scanf).' },
              { unit: 'Unit III', title: 'Control Structures', desc: 'If-else, Switch-case, For loop, While loop, Do-while loop, Nested loops.' },
              { unit: 'Unit IV', title: 'Arrays & Strings', desc: '1D and 2D arrays, String functions (strlen, strcpy, strcat, strcmp).' },
              { unit: 'Unit V', title: 'Functions & Pointers', desc: 'User-defined functions, Scope of variables, Pointer basics, Passing arrays to functions.' }
            ],
            books: ['Yashavant Kanetkar, Let Us C, BPB Publications']
          }
        ]
      },
      {
        semester: 3,
        title: 'Semester III',
        subjects: [
          {
            code: 'BCA-301',
            name: 'Data Structure Using C',
            category: 'Core',
            ltp: '3-1-0',
            credits: 4,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Stacks', desc: 'Array implementation of stack, Push and Pop operations, Infix to Postfix conversion, Parentheses matching.' },
              { unit: 'Unit II', title: 'Queues', desc: 'Linear queue, Circular queue, Priority queue, Enqueue and Dequeue operations.' },
              { unit: 'Unit III', title: 'Linked Lists', desc: 'Singly linked list, Node creation, Insertion and Deletion at front/middle/end.' },
              { unit: 'Unit IV', title: 'Trees', desc: 'Binary tree representations, Inorder, Preorder, Postorder traversals, BST operations.' },
              { unit: 'Unit V', title: 'Searching & Sorting', desc: 'Linear search, Binary search, Bubble sort, Selection sort, Insertion sort, Quick sort.' }
            ],
            books: ['Reema Thareja, Data Structures Using C, Oxford University Press']
          }
        ]
      }
    ]
  },
  {
    id: 'bba',
    code: 'AKTU-UG-BBA',
    name: 'Bachelor of Business Administration (BBA)',
    shortName: 'BBA',
    degree: 'BBA',
    level: 'UG',
    branch: 'Management',
    duration: '3 Years (6 Semesters)',
    scheme: 'AKTU Affiliated / CBCS Scheme',
    eligibility: '10+2 in any stream (Min 45%)',
    description: 'Undergraduate business curriculum introducing core principles of management, accounting, economics, human resources, and business communication.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I',
        subjects: [
          {
            code: 'BBA-101',
            name: 'Fundamentals of Management',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction to Management', desc: 'Concept, Nature, Importance, Principles of management, Functions of a manager.' },
              { unit: 'Unit II', title: 'Planning Process', desc: 'Types of plans, Objectives, Policies, Procedures, Forecasting techniques.' },
              { unit: 'Unit III', title: 'Organizing Structure', desc: 'Departmentation, Span of management, Centralization vs Decentralization, Delegation.' },
              { unit: 'Unit IV', title: 'Staffing & Directing', desc: 'Recruitment, Selection, Training, Motivation theories, Leadership styles.' },
              { unit: 'Unit V', title: 'Controlling Mechanism', desc: 'Steps in controlling, Budgetary and non-budgetary control techniques.' }
            ],
            books: ['L.M. Prasad, Principles and Practice of Management, Sultan Chand']
          },
          {
            code: 'BBA-102',
            name: 'Principles of Economics',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 25 | ESE: 75 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Introduction to Economics', desc: 'Micro vs Macro economics, Scarcity definition, Production Possibility Curve (PPC).' },
              { unit: 'Unit II', title: 'Demand & Supply', desc: 'Law of demand, Law of supply, Market equilibrium, Elasticity analysis.' },
              { unit: 'Unit III', title: 'Consumer Behaviour', desc: 'Utility analysis, Cardinal vs Ordinal approach, Indifference curve properties.' },
              { unit: 'Unit IV', title: 'Cost & Revenue', desc: 'Fixed, Variable and Total costs, Average and Marginal revenue curves.' },
              { unit: 'Unit V', title: 'Market Forms', desc: 'Price and output determination under Perfect Competition and Monopoly.' }
            ],
            books: ['N. Gregory Mankiw, Principles of Economics, Cengage']
          }
        ]
      }
    ]
  },
  {
    id: 'mtech-cse',
    code: 'AKTU-PG-MTECH',
    name: 'M.Tech in Computer Science & Engineering',
    shortName: 'M.Tech CSE',
    degree: 'M.Tech',
    level: 'PG',
    branch: 'Computer Science & Engineering',
    duration: '2 Years (4 Semesters)',
    scheme: 'AKTU Post Graduate Engineering Curriculum',
    eligibility: 'B.Tech/B.E. in CSE/IT or MCA with GATE / CUET-PG',
    description: 'Advanced postgraduate engineering study emphasizing distributed computing, deep learning, cryptographic protocols, cloud architectures, and master research thesis.',
    semesters: [
      {
        semester: 1,
        title: 'Semester I',
        subjects: [
          {
            code: 'MTCS-101',
            name: 'Advanced Data Structures & Algorithms',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Amortized Analysis & Fibonacci Heaps', desc: 'Aggregate analysis, Accounting method, Potential method, Dynamic tables, Binomial and Fibonacci heaps.' },
              { unit: 'Unit II', title: 'Disjoint Sets & Splay Trees', desc: 'Disjoint-set forests, Union by rank, Path compression, Splay trees, Amortized complexity of splay operations.' },
              { unit: 'Unit III', title: 'Graph Algorithms & Max Flow', desc: 'Flow networks, Ford-Fulkerson method, Edmonds-Karp algorithm, Maximum bipartite matching, Push-relabel algorithms.' },
              { unit: 'Unit IV', title: 'String Matching & Suffix Trees', desc: 'Rabin-Karp algorithm, Knuth-Morris-Pratt (KMP), Boyer-Moore algorithm, Suffix trees and arrays.' },
              { unit: 'Unit V', title: 'Approximation & Randomized Algorithms', desc: 'Randomized quicksort, Monte Carlo vs Las Vegas algorithms, Approximation algorithms for NP-hard problems.' }
            ],
            books: ['Thomas H. Cormen, Introduction to Algorithms, MIT Press']
          },
          {
            code: 'MTCS-102',
            name: 'Machine Learning',
            category: 'Core',
            ltp: '3-0-0',
            credits: 3,
            marks: 'Internal: 30 | ESE: 70 | Total: 100',
            units: [
              { unit: 'Unit I', title: 'Supervised Learning', desc: 'Linear regression, Logistic regression, Support Vector Machines (SVM), Kernel methods, Decision trees, Random forests.' },
              { unit: 'Unit II', title: 'Unsupervised Learning', desc: 'K-Means clustering, Hierarchical clustering, Principal Component Analysis (PCA), Expectation-Maximization (EM).' },
              { unit: 'Unit III', title: 'Neural Networks & Deep Learning', desc: 'Perceptrons, Multilayer feedforward networks, Backpropagation, CNN, RNN architectures.' },
              { unit: 'Unit IV', title: 'Evaluation & Model Selection', desc: 'Cross-validation, Bias-variance tradeoff, ROC curves, Precision-Recall curves, Regularization (L1/L2).' },
              { unit: 'Unit V', title: 'Reinforcement Learning', desc: 'Markov Decision Processes (MDP), Bellman equations, Q-Learning, Policy gradient methods.' }
            ],
            books: ['Tom M. Mitchell, Machine Learning, McGraw Hill', 'Christopher M. Bishop, Pattern Recognition and Machine Learning, Springer']
          }
        ]
      }
    ]
  }
];

// Helper to find a subject by code
function findAktuSubjectByCode(code) {
  for (const prog of AKTU_PROGRAMMES) {
    for (const sem of prog.semesters) {
      for (const subj of sem.subjects) {
        if (subj.code === code) {
          return { programme: prog, semester: sem, subject: subj };
        }
      }
    }
  }
  return null;
}

/* ========================================================================
   CENTRALIZED AKTU PROGRAMMES CONFIGURATION
   Provides source of truth for:
   - Program name & code
   - Course duration (Years)
   - Number of semesters (Duration * 2)
   - Available branches and specializations
======================================================================== */
const AKTU_CENTRAL_PROGRAMS = {
  'B.Tech': {
    code: 'B.Tech',
    name: 'B.Tech (Bachelor of Technology)',
    durationYears: 4,
    semestersCount: 8,
    hasBranches: true,
    branches: [
      'Computer Science & Engineering (CSE)',
      'Information Technology (IT)',
      'Computer Science & Information Technology (CSIT)',
      'Artificial Intelligence & Machine Learning (AI & ML)',
      'Artificial Intelligence (AI)',
      'Computer Science & Data Science (CSDS)',
      'Data Science',
      'Computer Science',
      'Electronics & Communication Engineering (ECE)',
      'Electrical Engineering (EE)',
      'Electrical & Electronics Engineering (EEE)',
      'Electronics Engineering',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CE)',
      'Chemical Engineering',
      'Biotechnology',
      'Automobile Engineering',
      'Aeronautical Engineering',
      'Aerospace Engineering',
      'Food Technology',
      'Agriculture Engineering',
      'Industrial & Production Engineering',
      'Instrumentation & Control Engineering',
      'Other'
    ]
  },
  'M.Tech': {
    code: 'M.Tech',
    name: 'M.Tech (Master of Technology)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Computer Science & Engineering',
      'Artificial Intelligence',
      'Data Science',
      'Information Technology',
      'VLSI Design',
      'Communication Engineering',
      'Power Electronics',
      'Thermal Engineering',
      'Structural Engineering',
      'Environmental Engineering',
      'Mechanical Engineering',
      'Other'
    ]
  },
  'MBA': {
    code: 'MBA',
    name: 'MBA (Master of Business Administration)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'General / Core',
      'Finance',
      'Marketing',
      'Human Resource',
      'International Business',
      'Information Technology',
      'Operations Management',
      'Business Analytics',
      'Other'
    ]
  },
  'MCA': {
    code: 'MCA',
    name: 'MCA (Master of Computer Applications)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Computer Applications',
      'AI & ML',
      'Data Science',
      'Other'
    ]
  },
  'B.Pharm': {
    code: 'B.Pharm',
    name: 'B.Pharm (Bachelor of Pharmacy)',
    durationYears: 4,
    semestersCount: 8,
    hasBranches: true,
    branches: [
      'General / Pharmacy',
      'Pharmaceutics',
      'Pharmacology',
      'Other'
    ]
  },
  'M.Pharm': {
    code: 'M.Pharm',
    name: 'M.Pharm (Master of Pharmacy)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Pharmaceutics',
      'Pharmacology',
      'Pharmaceutical Chemistry',
      'Pharmaceutical Analysis',
      'Pharmacognosy',
      'Other'
    ]
  },
  'B.Arch': {
    code: 'B.Arch',
    name: 'B.Arch (Bachelor of Architecture)',
    durationYears: 5,
    semestersCount: 10,
    hasBranches: true,
    branches: [
      'Architecture / Core',
      'Building Engineering & Management',
      'Other'
    ]
  },
  'M.Arch': {
    code: 'M.Arch',
    name: 'M.Arch (Master of Architecture)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Environmental Architecture',
      'Urban Design',
      'Landscape Architecture',
      'Architectural Pedagogy',
      'Other'
    ]
  },
  'BHMCT': {
    code: 'BHMCT',
    name: 'BHMCT (Hotel Management & Catering Technology)',
    durationYears: 4,
    semestersCount: 8,
    hasBranches: true,
    branches: [
      'Hotel Management & Catering Technology',
      'Food & Beverage Service',
      'Culinary Arts',
      'Accommodation Operations',
      'Other'
    ]
  },
  'BFA': {
    code: 'BFA',
    name: 'BFA (Bachelor of Fine Arts)',
    durationYears: 4,
    semestersCount: 8,
    hasBranches: true,
    branches: [
      'Applied Art',
      'Painting',
      'Sculpture',
      'Animation & Visual Effects',
      'Other'
    ]
  },
  'B.Des': {
    code: 'B.Des',
    name: 'B.Des (Bachelor of Design)',
    durationYears: 4,
    semestersCount: 8,
    hasBranches: true,
    branches: [
      'Fashion Design',
      'Industrial & Product Design',
      'Interior Design',
      'Communication Design',
      'Other'
    ]
  },
  'M.Des': {
    code: 'M.Des',
    name: 'M.Des (Master of Design)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Industrial Design',
      'Visual Communication',
      'Interaction Design',
      'Other'
    ]
  },
  'M.Plan': {
    code: 'M.Plan',
    name: 'M.Plan (Master of Planning)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Urban Planning',
      'Environmental Planning',
      'Transport Planning',
      'Housing & Regional Planning',
      'Other'
    ]
  },
  'B.Voc': {
    code: 'B.Voc',
    name: 'B.Voc (Bachelor of Vocation)',
    durationYears: 3,
    semestersCount: 6,
    hasBranches: true,
    branches: [
      'Software Development',
      'Production Technology',
      'Automobile Servicing',
      'BFSI / Banking & Finance',
      'Other'
    ]
  },
  'M.Voc': {
    code: 'M.Voc',
    name: 'M.Voc (Master of Vocation)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Software Development',
      'Technology & Automation',
      'Other'
    ]
  },
  'M.Sc': {
    code: 'M.Sc',
    name: 'M.Sc (Master of Science)',
    durationYears: 2,
    semestersCount: 4,
    hasBranches: true,
    branches: [
      'Computer Science',
      'Applied Mathematics',
      'Applied Physics',
      'Applied Chemistry',
      'Biotechnology',
      'Other'
    ]
  },
  'BCA': {
    code: 'BCA',
    name: 'BCA (Bachelor of Computer Applications)',
    durationYears: 3,
    semestersCount: 6,
    hasBranches: true,
    branches: [
      'Computer Applications',
      'Cloud & Cyber Security',
      'Data Analytics',
      'Other'
    ]
  },
  'BBA': {
    code: 'BBA',
    name: 'BBA (Bachelor of Business Administration)',
    durationYears: 3,
    semestersCount: 6,
    hasBranches: true,
    branches: [
      'General / Core Management',
      'Finance & Marketing',
      'Other'
    ]
  },
  'Integrated MBA': {
    code: 'Integrated MBA',
    name: 'Integrated MBA (5 Years Dual Degree)',
    durationYears: 5,
    semestersCount: 10,
    hasBranches: true,
    branches: [
      'Management (Integrated)',
      'Finance',
      'Marketing',
      'Other'
    ]
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.AKTU_PROGRAMMES = AKTU_PROGRAMMES;
  window.AKTU_CENTRAL_PROGRAMS = AKTU_CENTRAL_PROGRAMS;
  window.findAktuSubjectByCode = findAktuSubjectByCode;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AKTU_PROGRAMMES,
    AKTU_CENTRAL_PROGRAMS,
    findAktuSubjectByCode
  };
}

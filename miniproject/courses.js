

const COURSES = {
  btech: {
    label: 'B.Tech (AKTU CSE)',
    subjects: {
      'Data Structures (KCS-301)': [
        { front: 'What is a stack in AKTU KCS-301?', back: 'A LIFO (Last In First Out) linear data structure where insertion and deletion occur at the top.' },
        { front: 'Time complexity of binary search?', back: 'O(log n) worst and average case, requiring a sorted array.' },
        { front: 'What is an AVL Tree?', back: 'A self-balancing Binary Search Tree where balance factor of every node is -1, 0, or +1.' },
        { front: 'Difference between BFS and DFS traversal?', back: 'BFS uses a Queue and visits level-by-level; DFS uses a Stack/recursion and explores depth first.' },
        { front: 'What is a hash collision and how is it resolved?', back: 'When two keys map to the same slot. Resolved via Open Addressing (linear/quadratic probing) or Separate Chaining.' }
      ],
      'Operating Systems (KCS-401)': [
        { front: 'What are the 4 Coffman conditions for Deadlock?', back: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.' },
        { front: 'What is Thrashing in Virtual Memory?', back: 'A state where the CPU spends more time swapping pages in and out than executing actual instructions.' },
        { front: 'Explain Semaphore (Counting vs Binary)?', back: 'A synchronization variable. Binary semaphore is 0 or 1 (mutex); counting semaphore takes non-negative integer values for resource instances.' },
        { front: 'What is the Banker\'s Algorithm in AKTU OS?', back: 'A deadlock avoidance algorithm that tests safety by simulating the allocation of predetermined maximum possible resources.' }
      ],
      'DBMS (KCS-501)': [
        { front: 'What does ACID stand for in DBMS?', back: 'Atomicity (all or nothing), Consistency (preserves invariants), Isolation (concurrency control), Durability (persisted changes).' },
        { front: 'Explain BCNF (Boyce-Codd Normal Form).', back: 'A relation is in BCNF if for every non-trivial functional dependency X -> Y, X is a Super Key.' },
        { front: 'What is the Two-Phase Locking (2PL) protocol?', back: 'Concurrency control protocol with Growing Phase (locks acquired, none released) and Shrinking Phase (locks released, none acquired).' }
      ],
      'Computer Networks (KCS-603)': [
        { front: 'List the 7 layers of OSI Model from bottom to top.', back: 'Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
        { front: 'Explain TCP 3-Way Handshake.', back: '1. Client sends SYN. 2. Server sends SYN-ACK. 3. Client responds with ACK. Connection is established.' },
        { front: 'Difference between IPv4 and IPv6 addresses?', back: 'IPv4 is 32-bit dotted-decimal (~4.3B addresses); IPv6 is 128-bit hexadecimal notation (virtually unlimited).' }
      ],
      'Artificial Intelligence (KCS-701)': [
        { front: 'What is A* Search Algorithm in AKTU AI?', back: 'An informed best-first search algorithm evaluating f(n) = g(n) + h(n), where g(n) is actual cost and h(n) is admissible heuristic.' },
        { front: 'What is the Minimax algorithm with Alpha-Beta Pruning?', back: 'Adversarial game-playing algorithm where Alpha (max lower bound) and Beta (min upper bound) prune unpromising tree branches.' },
        { front: 'Difference between Supervised and Unsupervised Learning?', back: 'Supervised learning uses labeled training pairs (x, y); Unsupervised learning discovers hidden patterns in unlabeled input x.' }
      ]
    }
  },
  mca: {
    label: 'MCA (AKTU)',
    subjects: {
      'Python Problem Solving (KCA-102)': [
        { front: 'What is the difference between list and tuple in Python?', back: 'Lists are mutable (can change elements); tuples are immutable and hashable.' },
        { front: 'What is a lambda function in Python?', back: 'An anonymous, inline function defined using the lambda keyword: lambda args: expression.' },
        { front: 'How does Python handle memory management?', back: 'Via private heap space managed by Python memory manager, reference counting, and cyclic garbage collector.' }
      ],
      'Data Structures & Algos (KCA-201)': [
        { front: 'What is the Master Theorem for divide and conquer?', back: 'Solves T(n) = aT(n/b) + f(n) by comparing n^(log_b a) with f(n) across 3 asymptotic cases.' },
        { front: 'What is Dynamic Programming vs Greedy?', back: 'DP solves overlapping subproblems with memoization/tabulation; Greedy chooses the locally optimal choice at each step.' }
      ]
    }
  },
  bpharm: {
    label: 'B.Pharm (AKTU / PCI)',
    subjects: {
      'Anatomy & Physiology (BP-101T)': [
        { front: 'What is Homeostasis in Anatomy?', back: 'The maintenance of a relatively stable internal physiological environment despite external fluctuations.' },
        { front: 'Name the four primary tissue types in human body.', back: 'Epithelial tissue, Connective tissue, Muscle tissue, and Nervous tissue.' },
        { front: 'What is the functional unit of the kidney?', back: 'The Nephron, responsible for filtration, reabsorption, secretion, and urine formation.' }
      ],
      'Pharmaceutics - I (BP-103T)': [
        { front: 'What is Posology in Pharmaceutics?', back: 'The branch of medical science that deals with dosage regimens and calculation of drug doses.' },
        { front: 'Difference between Suspension and Emulsion?', back: 'Suspension is a biphasic liquid with solid particles dispersed in liquid; Emulsion has liquid droplets dispersed in an immiscible liquid.' }
      ]
    }
  },
  mba: {
    label: 'MBA (AKTU)',
    subjects: {
      'Managerial Economics (KMBN-102)': [
        { front: 'What is Price Elasticity of Demand?', back: 'The percentage change in quantity demanded divided by the percentage change in price (%ΔQ / %ΔP).' },
        { front: 'What are Economies of Scale?', back: 'Cost advantages experienced by an enterprise when production becomes efficient as scale increases.' }
      ],
      'Strategic Management (KMBN-301)': [
        { front: 'What are the 5 forces in Michael Porter\'s framework?', back: '1. Threat of new entrants, 2. Bargaining power of buyers, 3. Bargaining power of suppliers, 4. Threat of substitutes, 5. Competitive rivalry.' },
        { front: 'What is the BCG Matrix in strategic planning?', back: 'A portfolio tool evaluating business units based on Market Growth Rate vs Relative Market Share (Stars, Cash Cows, Question Marks, Dogs).' }
      ]
    }
  },
  bca: {
    label: 'BCA (AKTU)',
    subjects: {
      'Programming Fundamentals (BCA-102)': [
        { front: 'What is a pointer in C?', back: 'A variable that stores the memory address of another variable.' },
        { front: 'What is the difference between compiler and interpreter?', back: 'A compiler translates the entire source code into machine code before execution; an interpreter executes line-by-line.' }
      ],
      'Data Structures (BCA-301)': [
        { front: 'What is a Circular Queue?', back: 'A linear data structure in which operations are performed based on FIFO, and the last position is connected back to the first.' },
        { front: 'What is the time complexity of QuickSort?', back: 'O(n log n) average case, O(n²) worst case when pivot selection is unbalanced.' }
      ]
    }
  },
  bba: {
    label: 'BBA (AKTU)',
    subjects: {
      'Principles of Management (BBA-101)': [
        { front: 'What are Fayol\'s 14 principles of management?', back: 'Key principles include Division of Work, Authority and Responsibility, Discipline, Unity of Command, Unity of Direction, Subordination of Individual Interest, Centralization, Order, and Esprit de Corps.' },
        { front: 'What is SWOT Analysis?', back: 'A strategic framework identifying internal Strengths and Weaknesses, alongside external Opportunities and Threats.' }
      ]
    }
  },
  mtech: {
    label: 'M.Tech CSE (AKTU)',
    subjects: {
      'Advanced Algorithms (MTCS-101)': [
        { front: 'What is Amortized Analysis in advanced algorithms?', back: 'A technique for analyzing a sequence of operations to guarantee the average time per operation in the worst case.' },
        { front: 'What is a Fibonacci Heap?', back: 'A heap data structure with faster amortized running times: O(1) insert, find-minimum, decrease-key, and O(log n) delete/extract-min.' }
      ],
      'Machine Learning (MTCS-102)': [
        { front: 'Explain the Bias-Variance Tradeoff.', back: 'Bias measures error from erroneous assumptions (underfitting); Variance measures sensitivity to small fluctuations in training data (overfitting).' },
        { front: 'What is Backpropagation in Neural Networks?', back: 'An algorithm that computes the gradient of the loss function with respect to weights using the chain rule, propagating errors backward.' }
      ]
    }
  }
};
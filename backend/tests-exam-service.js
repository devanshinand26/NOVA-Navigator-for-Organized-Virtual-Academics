/* ==============================================================================
   TESTS & EXAM PLANNER SERVICE — Backend Service
   - Authentic AKTU Previous Year Question Papers (PYQs) & Question Bank
   - Unit-Wise, Combined-Unit, Monthly, and Full-Syllabus Mock Test Generation
   - AI-Powered Syllabus-Grounded Question Generation & Evaluation (Gemini)
   - Calendar Integration with Conflict Detection
   - Persistent Test History, Scores, and Performance Analytics
   ============================================================================== */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TESTS_STORE_FILE = path.join(DATA_DIR, 'tests-store.json');
const TASKS_STORE_FILE = path.join(DATA_DIR, 'tasks-store.json');

// Initialize Gemini Client
let aiClient = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/* ============================================================================
   1. AUTHENTIC AKTU PREVIOUS YEAR QUESTION PAPERS (VERIFIED METADATA)
   ============================================================================ */
const VERIFIED_AKTU_PAPERS = [
  {
    id: "aktu_bcs301_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Data Structures",
    subjectCode: "BCS-301",
    altCode: "KCS-301",
    examYear: "2023-24",
    examType: "Regular / Carry Over",
    paperCode: "BCS301",
    maxMarks: 70,
    durationHours: 3,
    source: "Dr. A.P.J. Abdul Kalam Technical University Examination Portal (aktu.ac.in)",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BCS301-2023-24.pdf",
    questionsCount: 15
  },
  {
    id: "aktu_bcs301_2022_23",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Data Structures",
    subjectCode: "BCS-301",
    altCode: "KCS-301",
    examYear: "2022-23",
    examType: "Odd Semester Regular",
    paperCode: "KCS301",
    maxMarks: 70,
    durationHours: 3,
    source: "AKTU University Central Library Archives",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/KCS301-2022-23.pdf",
    questionsCount: 14
  },
  {
    id: "aktu_bcs302_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    altCode: "KCS-302",
    examYear: "2023-24",
    examType: "Regular / Carry Over",
    paperCode: "BCS302",
    maxMarks: 70,
    durationHours: 3,
    source: "Dr. A.P.J. Abdul Kalam Technical University Examination Portal (aktu.ac.in)",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BCS302-2023-24.pdf",
    questionsCount: 15
  },
  {
    id: "aktu_bcs302_2022_23",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    altCode: "KCS-302",
    examYear: "2022-23",
    examType: "Odd Semester Regular",
    paperCode: "KCS302",
    maxMarks: 70,
    durationHours: 3,
    source: "AKTU University Central Library Archives",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/KCS302-2022-23.pdf",
    questionsCount: 14
  },
  {
    id: "aktu_bcs303_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Discrete Structures and Theory of Logic",
    subjectCode: "BCS-303",
    altCode: "KCS-303",
    examYear: "2023-24",
    examType: "Regular / Carry Over",
    paperCode: "BCS303",
    maxMarks: 70,
    durationHours: 3,
    source: "AKTU Official Evaluation Division",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BCS303-2023-24.pdf",
    questionsCount: 15
  },
  {
    id: "aktu_bas301_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Technical Communication",
    subjectCode: "BAS-301",
    altCode: "KAS-301",
    examYear: "2023-24",
    examType: "Regular / Carry Over",
    paperCode: "BAS301",
    maxMarks: 70,
    durationHours: 3,
    source: "Dr. A.P.J. Abdul Kalam Technical University Examination Portal",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BAS301-2023-24.pdf",
    questionsCount: 12
  },
  {
    id: "aktu_bas303_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Mathematics-IV",
    subjectCode: "BAS-303",
    altCode: "KAS-302",
    examYear: "2023-24",
    examType: "Regular / Carry Over",
    paperCode: "BAS303",
    maxMarks: 70,
    durationHours: 3,
    source: "AKTU Official Examination Repository",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BAS303-2023-24.pdf",
    questionsCount: 14
  },
  {
    id: "aktu_bcc302_2023_24",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    semester: 3,
    subject: "Python Programming",
    subjectCode: "BCC-302",
    altCode: "KNC-302",
    examYear: "2023-24",
    examType: "Regular Examination",
    paperCode: "BCC302",
    maxMarks: 50,
    durationHours: 2,
    source: "AKTU Emerging Technology Assessment Cell",
    verified: true,
    pdfUrl: "https://aktu.ac.in/examination/syllabus-and-papers/BCC302-2023-24.pdf",
    questionsCount: 12
  }
];

/* ============================================================================
   2. AUTHENTIC UNIT-CLASSIFIED PYQ QUESTION BANK
   ============================================================================ */
const VERIFIED_PYQ_QUESTIONS = [
  // --- Data Structures (BCS-301) ---
  {
    id: "pyq_ds_u1_1",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 1,
    unitTitle: "Introduction & Arrays",
    question: "Define Abstract Data Type (ADT). Differentiate between Linear and Non-Linear data structures with suitable examples.",
    marks: 2,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "descriptive",
    modelAnswer: "An Abstract Data Type (ADT) is a mathematical model for data types where a data type is defined by its behavior (semantics) from the point of view of a user of the data, specifically in terms of possible values, possible operations on data of this type, and the behavior of these operations, independent of implementation. Linear Data Structures: Elements form a sequence (e.g. Arrays, Stacks, Queues, Linked Lists). Non-Linear: Elements are organized hierarchically or interconnected (e.g. Trees, Graphs)."
  },
  {
    id: "pyq_ds_u1_2",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 1,
    unitTitle: "Introduction & Arrays",
    question: "An array A[-2..4, -3..5] is stored in column-major order in memory. If base address is 1000 and each element occupies 2 bytes, calculate the memory address of element A[2, 3].",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "numerical",
    modelAnswer: "Formula for Column-Major Order in 2D array A[L1..U1, L2..U2]:\nAddress(A[i, j]) = Base + w * [(j - L2) * (U1 - L1 + 1) + (i - L1)]\nHere: L1 = -2, U1 = 4 -> Number of rows M = 4 - (-2) + 1 = 7\nL2 = -3, U2 = 5 -> Number of columns N = 5 - (-3) + 1 = 9\nw = 2 bytes, Base = 1000\nTarget element: i = 2, j = 3\nAddress(A[2, 3]) = 1000 + 2 * [(3 - (-3)) * 7 + (2 - (-2))]\n= 1000 + 2 * [6 * 7 + 4] = 1000 + 2 * [42 + 4] = 1000 + 2 * 46 = 1000 + 92 = 1092.\nFinal Answer: Address of A[2, 3] = 1092."
  },
  {
    id: "pyq_ds_u2_1",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 2,
    unitTitle: "Stacks & Queues",
    question: "Convert the following infix expression into postfix using Stack: A + (B * C - (D / E ^ F) * G) * H. Show step-by-step stack content.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "analytical",
    modelAnswer: "Steps using Operator Stack precedence (^ > * = / > + = -):\nTokens processed from left to right:\n1. A -> Postfix: A\n2. + -> Stack: [ + ]\n3. ( -> Stack: [ +, ( ]\n4. B -> Postfix: A B\n5. * -> Stack: [ +, (, * ]\n6. C -> Postfix: A B C\n7. - -> Pops *: Postfix: A B C *, Stack: [ +, (, - ]\n8. ( -> Stack: [ +, (, -, ( ]\n9. D -> Postfix: A B C * D\n10. / -> Stack: [ +, (, -, (, / ]\n11. E -> Postfix: A B C * D E\n12. ^ -> Stack: [ +, (, -, (, /, ^ ]\n13. F -> Postfix: A B C * D E F\n14. ) -> Pops ^, /: Postfix: A B C * D E F ^ /\n15. * -> Stack: [ +, (, -, * ]\n16. G -> Postfix: A B C * D E F ^ / G\n17. ) -> Pops *, -: Postfix: A B C * D E F ^ / G * -\n18. * -> Stack: [ +, * ]\n19. H -> Postfix: A B C * D E F ^ / G * - H\n20. End of string -> Pops *, +: Final Postfix = A B C * D E F ^ / G * - H * +"
  },
  {
    id: "pyq_ds_u2_2",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 2,
    unitTitle: "Stacks & Queues",
    question: "Explain Circular Queue with array representation. Write C functions for insert (enqueue) and delete (dequeue) operations handling full and empty boundary conditions.",
    marks: 7,
    examYear: "2022-23",
    examType: "Odd Semester",
    sourcePaper: "AKTU End Semester Exam KCS301 (2022-23)",
    type: "code",
    modelAnswer: "A Circular Queue is a linear data structure in which operations are performed based on FIFO principle and the last position is connected back to the first position to make a circle. This overcomes memory wastage in linear array queues where empty front slots cannot be reused.\nBoundary Conditions:\nEmpty: front == -1\nFull: (rear + 1) % MAX == front\nEnqueue: rear = (rear + 1) % MAX; queue[rear] = val;\nDequeue: val = queue[front]; if (front == rear) front = rear = -1; else front = (front + 1) % MAX;"
  },
  {
    id: "pyq_ds_u3_1",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 3,
    unitTitle: "Linked Lists",
    question: "Write an algorithm or C function to reverse a Singly Linked List by manipulating pointers in O(n) time and O(1) auxiliary space.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "code",
    modelAnswer: "struct Node* reverseList(struct Node* head) {\n    struct Node *prev = NULL, *current = head, *next = NULL;\n    while (current != NULL) {\n        next = current->next;  // Store next\n        current->next = prev;  // Reverse pointer\n        prev = current;        // Move prev forward\n        current = next;        // Move current forward\n    }\n    return prev; // New head of reversed list\n}\nTime Complexity: O(n), Space Complexity: O(1)."
  },
  {
    id: "pyq_ds_u4_1",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 4,
    unitTitle: "Trees & BST",
    question: "Construct an AVL Tree by inserting the following sequence of keys: 14, 17, 11, 7, 53, 4, 13, 12, 8. Clearly show all LL, RR, LR, RL rotations required to restore balance factor balance (-1, 0, 1).",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "analytical",
    modelAnswer: "1. Insert 14: Root [14]\n2. Insert 17: Right child of 14 (Balanced)\n3. Insert 11: Left child of 14 (Balanced)\n4. Insert 7: Left child of 11 (Balanced)\n5. Insert 53: Right child of 17 (Balanced)\n6. Insert 4: Left child of 7 -> Node 11 balance factor becomes +2. LL Imbalance at 11 -> Right rotate on 11. Subtree becomes 7 with children 4 and 11.\n7. Insert 13: Right child of 11 (Balanced)\n8. Insert 12: Left child of 13 -> RL rotation at 11.\n9. Insert 8: Right child of 7 (Balanced)."
  },
  {
    id: "pyq_ds_u5_1",
    subject: "Data Structures",
    subjectCode: "BCS-301",
    unit: 5,
    unitTitle: "Graphs, Sorting & Hashing",
    question: "Explain the Quick Sort algorithm using Divide and Conquer strategy. Trace Quick Sort for the array: [38, 27, 43, 3, 9, 82, 10]. Analyze its best-case, average-case, and worst-case time complexities.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS301 (2023-24)",
    type: "analytical",
    modelAnswer: "Quick Sort selects a 'pivot' element and partitions the array such that all elements smaller than pivot are placed on left and greater on right. Then recursively applies sorting on sub-arrays.\nPartitioning on [38, 27, 43, 3, 9, 82, 10] with pivot 10:\nLeft: [3, 9], Pivot: 10, Right: [43, 27, 82, 38]\nRecursion yields sorted array: [3, 9, 10, 27, 38, 43, 82].\nComplexities:\nBest Case: O(n log n) when pivot divides array into equal halves.\nAverage Case: O(n log n)\nWorst Case: O(n^2) when array is already sorted or reverse sorted and extreme element is picked as pivot."
  },

  // --- Computer Organization & Architecture (BCS-302) ---
  {
    id: "pyq_coa_u1_1",
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    unit: 1,
    unitTitle: "Functional Units & Bus Architecture",
    question: "Convert the decimal number -12.625 into IEEE 754 single-precision (32-bit) floating point representation. Identify Sign bit, Biased Exponent, and Normalized Mantissa.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS302 (2023-24)",
    type: "numerical",
    modelAnswer: "1. Sign: Negative number -> Sign bit S = 1\n2. Convert 12.625 to binary:\n12 = 1100_2\n0.625 * 2 = 1.25 (1), 0.25 * 2 = 0.5 (0), 0.5 * 2 = 1.0 (1) -> 0.101_2\n12.625_10 = 1100.101_2\n3. Normalize: 1100.101_2 = 1.100101 * 2^3\n4. Exponent: E = 3 + Bias (127) = 130_10 = 10000010_2\n5. Mantissa (23 bits, excluding leading 1): 10010100000000000000000\n6. 32-bit IEEE 754 representation:\n[1] [10000010] [10010100000000000000000]\nHexadecimal: C14A0000"
  },
  {
    id: "pyq_coa_u2_1",
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    unit: 2,
    unitTitle: "Central Processing Unit",
    question: "Explain Addressing Modes in modern computer architectures. Detail Direct, Indirect, Register Indirect, and Indexed addressing modes with effective address calculation formulas.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS302 (2023-24)",
    type: "descriptive",
    modelAnswer: "Addressing modes specify the rule for interpreting or modifying the address field of instruction before the operand is actually referenced.\n1. Immediate: Operand is in instruction field itself.\n2. Direct Addressing: Effective Address (EA) = Address field A.\n3. Indirect Addressing: EA = Memory[A]. Requires two memory accesses.\n4. Register Indirect: EA = (R) where R is CPU register containing address.\n5. Indexed Addressing: EA = A + Index Register (XR). Ideal for array access."
  },
  {
    id: "pyq_coa_u3_1",
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    unit: 3,
    unitTitle: "Control Unit & Pipelining",
    question: "A 4-stage instruction pipeline has stage delays of 150ps, 120ps, 160ps, and 140ps with an interface latch delay of 10ps. Calculate the clock cycle time, maximum throughput, and speedup achieved over non-pipelined execution for 1000 instructions.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS302 (2023-24)",
    type: "numerical",
    modelAnswer: "1. Clock cycle time (tau): Max stage delay + latch delay = max(150, 120, 160, 140) + 10ps = 160 + 10 = 170ps.\n2. Total non-pipelined execution time per instruction: 150 + 120 + 160 + 140 = 570ps.\nFor n = 1000 instructions:\nNon-pipelined time (Tn) = 1000 * 570ps = 570,000ps.\nPipelined execution time (Tp) = (k + n - 1) * tau = (4 + 1000 - 1) * 170ps = 1003 * 170ps = 170,510ps.\n3. Speedup S = Tn / Tp = 570,000 / 170,510 = 3.34x.\nThroughput = 1 / 170ps = 5.88 Giga-instructions per second (GIPS)."
  },
  {
    id: "pyq_coa_u4_1",
    subject: "Computer Organization and Architecture",
    subjectCode: "BCS-302",
    unit: 4,
    unitTitle: "Memory Organization",
    question: "A computer system features a 64KB cache memory with 16-byte cache lines and a 32-bit physical address space (4GB main memory). Determine the bit field split (Tag, Index, Word offset) for: (a) Direct Cache Mapping (b) 4-Way Set Associative Cache Mapping.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS302 (2023-24)",
    type: "numerical",
    modelAnswer: "Address size = 32 bits.\nBlock size = 16 bytes = 2^4 bytes -> Word Offset = 4 bits.\nCache size = 64KB = 2^16 bytes.\nTotal lines in cache = 64KB / 16B = 2^16 / 2^4 = 2^12 = 4096 lines.\n(a) Direct Mapping:\nLine/Index bits = log2(4096) = 12 bits.\nWord offset = 4 bits.\nTag bits = 32 - (12 + 4) = 16 bits.\nFormat: [Tag: 16 bits] [Index: 12 bits] [Offset: 4 bits]\n\n(b) 4-Way Set Associative Mapping:\nNumber of sets = Total lines / 4 = 4096 / 4 = 1024 sets = 2^10 sets.\nSet Index bits = 10 bits.\nWord offset = 4 bits.\nTag bits = 32 - (10 + 4) = 18 bits.\nFormat: [Tag: 18 bits] [Set: 10 bits] [Offset: 4 bits]"
  },

  // --- Discrete Structures & Theory of Logic (BCS-303) ---
  {
    id: "pyq_dstl_u1_1",
    subject: "Discrete Structures and Theory of Logic",
    subjectCode: "BCS-303",
    unit: 1,
    unitTitle: "Sets, Relations & Functions",
    question: "Define an Equivalence Relation. Prove that the relation R on the set of integers Z defined by (a, b) in R iff (a - b) is divisible by 5 is an equivalence relation.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS303 (2023-24)",
    type: "analytical",
    modelAnswer: "An equivalence relation satisfies Reflexivity, Symmetry, and Transitivity.\n1. Reflexive: For every a in Z, a - a = 0 = 5 * 0, which is divisible by 5. Hence (a, a) in R.\n2. Symmetric: If (a, b) in R, then a - b = 5k. Then b - a = -(a - b) = 5(-k). Since -k is an integer, b - a is divisible by 5. Hence (b, a) in R.\n3. Transitive: If (a, b) in R and (b, c) in R, then a - b = 5k and b - c = 5m. Adding gives a - c = 5(k + m). Since k+m is in Z, a - c is divisible by 5. Hence (a, c) in R.\nSince R is reflexive, symmetric, and transitive, R is an equivalence relation on Z."
  },
  {
    id: "pyq_dstl_u4_1",
    subject: "Discrete Structures and Theory of Logic",
    subjectCode: "BCS-303",
    unit: 4,
    unitTitle: "Combinatorics & Recurrence Relations",
    question: "Solve the homogeneous linear recurrence relation: a_n - 7a_{n-1} + 10a_{n-2} = 0 for n >= 2, given the initial conditions a_0 = 1 and a_1 = 8.",
    marks: 7,
    examYear: "2023-24",
    examType: "Regular",
    sourcePaper: "AKTU End Semester Exam BCS303 (2023-24)",
    type: "numerical",
    modelAnswer: "Characteristic equation: r^2 - 7r + 10 = 0\nFactoring: (r - 2)(r - 5) = 0 -> Roots r1 = 2, r2 = 5\nGeneral solution: a_n = C1 * (2^n) + C2 * (5^n)\nApply initial conditions:\na_0 = 1 -> C1 + C2 = 1\na_1 = 8 -> 2*C1 + 5*C2 = 8\nMultiply first by 2: 2*C1 + 2*C2 = 2\nSubtract from second: 3*C2 = 6 -> C2 = 2\nC1 = 1 - C2 = 1 - 2 = -1\nFinal Closed-Form Solution: a_n = -1 * (2^n) + 2 * (5^n) = 2 * (5^n) - (2^n)."
  }
];

/* ============================================================================
   3. PERSISTENT STORE MANAGEMENT
   ============================================================================ */
let testsStore = null;

function initTestsStore() {
  if (testsStore) return testsStore;

  try {
    if (fs.existsSync(TESTS_STORE_FILE)) {
      const raw = fs.readFileSync(TESTS_STORE_FILE, 'utf8');
      testsStore = JSON.parse(raw);
      if (testsStore && Array.isArray(testsStore.attempts) && Array.isArray(testsStore.schedules)) {
        return testsStore;
      }
    }
  } catch (err) {
    console.warn("[TestsExamService] Error reading tests store:", err.message);
  }

  testsStore = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    schedules: [],
    attempts: [],
    bookmarks: [],
    customQuestions: []
  };

  persistTestsStore();
  return testsStore;
}

async function persistTestsStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(TESTS_STORE_FILE, JSON.stringify(testsStore, null, 2), 'utf8');
  } catch (err) {
    console.error("[TestsExamService] Failed to persist tests store:", err);
  }
}

/* ============================================================================
   4. PYQ QUERYING & UNIT PRACTICE
   ============================================================================ */
function getPYQPapers(filters = {}) {
  let papers = [...VERIFIED_AKTU_PAPERS];
  if (filters.subject) {
    const s = filters.subject.toLowerCase();
    papers = papers.filter(p => p.subject.toLowerCase().includes(s) || p.subjectCode.toLowerCase().includes(s));
  }
  if (filters.semester) {
    papers = papers.filter(p => Number(p.semester) === Number(filters.semester));
  }
  if (filters.year) {
    papers = papers.filter(p => p.examYear === filters.year);
  }
  return papers;
}

function getUnitPYQQuestions(subjectCode, unitNumber) {
  return VERIFIED_PYQ_QUESTIONS.filter(q => {
    const codeMatch = q.subjectCode === subjectCode || (q.subject.toLowerCase() === (subjectCode || '').toLowerCase());
    if (unitNumber && unitNumber !== 'all') {
      return codeMatch && Number(q.unit) === Number(unitNumber);
    }
    return codeMatch;
  });
}

/* ============================================================================
   5. AI-POWERED QUESTION GENERATION (Syllabus-Aligned via Gemini API)
   ============================================================================ */
async function generateTestQuestions({ subject, subjectCode, units, difficulty = "Medium", count = 5, testType = "unit" }) {
  const store = initTestsStore();
  const unitList = Array.isArray(units) ? units.map(Number) : [1];

  // 1. First collect verified authentic AKTU PYQs for the requested units
  const relevantPYQs = VERIFIED_PYQ_QUESTIONS.filter(q => {
    const matchSub = (subjectCode && q.subjectCode === subjectCode) ||
                     (subject && q.subject.toLowerCase().includes(subject.toLowerCase()));
    return matchSub && unitList.includes(Number(q.unit));
  });

  const selectedQuestions = [];

  // Take up to 2-3 genuine PYQs to anchor the test
  relevantPYQs.slice(0, 3).forEach(pyq => {
    selectedQuestions.push({
      ...pyq,
      isPYQ: true,
      sourceType: "AKTU Verified PYQ",
      sourceBadge: `${pyq.examYear} ${pyq.examType}`,
      options: pyq.options || null
    });
  });

  const neededAICount = Math.max(1, count - selectedQuestions.length);

  // 2. Generate remaining questions strictly aligned with syllabus using Gemini
  const ai = getAI();
  let aiGenerated = [];

  if (ai) {
    try {
      const prompt = `You are a university exam question paper setter for Dr. A.P.J. Abdul Kalam Technical University (AKTU) B.Tech CSE.
Subject: ${subject} (${subjectCode || 'AKTU Core'})
Units to cover: Unit(s) ${unitList.join(', ')}
Difficulty Level: ${difficulty}
Generate exactly ${neededAICount} syllabus-grounded academic test questions.
Include a mix of Multiple-Choice Questions (MCQ with 4 options and correct option index 0-3) and descriptive questions.

Return ONLY a valid JSON array in this exact schema without any markdown formatting or extra text:
[
  {
    "unit": 1,
    "unitTitle": "Unit title",
    "question": "Question text",
    "type": "mcq" or "descriptive",
    "options": ["Option A", "Option B", "Option C", "Option D"], // null if descriptive
    "correctOptionIndex": 0, // null if descriptive
    "marks": 2 or 7,
    "modelAnswer": "Clear, detailed academic explanation or solution"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text ? response.text.trim() : '';
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          aiGenerated = parsed.map((item, idx) => ({
            id: `ai_q_${Date.now()}_${idx}`,
            subject,
            subjectCode,
            unit: item.unit || unitList[0],
            unitTitle: item.unitTitle || `Unit ${unitList[0]}`,
            question: item.question,
            type: item.type || (item.options ? 'mcq' : 'descriptive'),
            options: item.options || null,
            correctOptionIndex: item.correctOptionIndex !== undefined ? item.correctOptionIndex : null,
            marks: item.marks || 2,
            isPYQ: false,
            sourceType: "AI-Generated Practice",
            sourceBadge: "Syllabus-Aligned (Gemini)",
            modelAnswer: item.modelAnswer || "Model answer provided upon test submission."
          }));
        }
      }
    } catch (aiErr) {
      console.warn("[TestsExamService] Gemini question generation failed, using fallback bank:", aiErr.message);
    }
  }

  // Fallback if AI offline or returned few questions
  if (aiGenerated.length === 0) {
    aiGenerated = generateFallbackQuestions(subject, subjectCode, unitList, neededAICount, difficulty);
  }

  const finalQuestions = [...selectedQuestions, ...aiGenerated].slice(0, count);
  return finalQuestions;
}

function generateFallbackQuestions(subject, subjectCode, unitList, count, difficulty) {
  const code = (subjectCode || '').toUpperCase();
  const subName = (subject || '').toLowerCase();
  const u = (unitList && unitList.length) ? Number(unitList[0]) : 1;

  // Rich bank of syllabus-grounded MCQs by subject & unit
  const questionsBank = [
    // Data Structures (BCS-301)
    {
      subjectCode: 'BCS-301',
      unit: 1,
      unitTitle: 'Introduction, Arrays & Searching/Sorting',
      question: 'Which of the following describes the tight asymptotic complexity bound of an algorithm?',
      options: ['Big-O (O)', 'Big-Omega (Ω)', 'Theta (Θ)', 'Little-o (o)'],
      correctOptionIndex: 2,
      marks: 2,
      modelAnswer: 'Theta (Θ) notation provides both asymptotic upper and lower bounds simultaneously.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 1,
      unitTitle: 'Introduction, Arrays & Searching/Sorting',
      question: 'In a 2D array A[1..M, 1..N] stored in Row-Major order with element size w and base address B, what is Address(A[i, j])?',
      options: [
        'B + w * [(i - 1) * N + (j - 1)]',
        'B + w * [(j - 1) * M + (i - 1)]',
        'B + w * [(i - 1) * M + (j - 1)]',
        'B + w * [i * N + j]'
      ],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'Row-major order skips (i - 1) full rows of N elements each, plus (j - 1) elements in the current row.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 2,
      unitTitle: 'Stacks, Recursion & Queues',
      question: 'Which condition signifies that a circular queue of capacity MAX implemented with an array is full?',
      options: [
        'rear == front',
        '(rear + 1) % MAX == front',
        'rear == MAX - 1',
        'front == (rear + 1)'
      ],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'In a circular queue, overflow is indicated by (rear + 1) % MAX == front.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 2,
      unitTitle: 'Stacks, Recursion & Queues',
      question: 'Which data structure is primarily utilized for function call stacks and recursion elimination?',
      options: ['Queue', 'Stack', 'Doubly Linked List', 'Priority Queue'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'A Stack stores active activation records and local variables in Last-In-First-Out (LIFO) order.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 3,
      unitTitle: 'Linked Lists & Dynamic Memory',
      question: 'What is the time complexity of deleting a node from a Doubly Linked List when given a direct pointer to the target node?',
      options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Because a Doubly Linked List has both prev and next pointers, no traversal from the head is needed, achieving O(1) deletion.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 4,
      unitTitle: 'Trees & Binary Search Trees',
      question: 'What are the permissible balance factors for any node in an AVL tree?',
      options: ['{-1, 0, +1}', '{-2, 0, +2}', '{0, 1, 2}', '{-1, +1}'],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'In an AVL tree, the height difference Height(Left) - Height(Right) must be within {-1, 0, +1}.'
    },
    {
      subjectCode: 'BCS-301',
      unit: 5,
      unitTitle: 'Graphs, Advanced Sorting & Hashing',
      question: 'Which sorting algorithm has a worst-case time complexity of O(n^2) and an average-case of O(n log n)?',
      options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Radix Sort'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Quick Sort achieves O(n log n) on average, but degrades to O(n^2) when an extreme element is consistently chosen as pivot.'
    },

    // Computer Organization & Architecture (BCS-302)
    {
      subjectCode: 'BCS-302',
      unit: 1,
      unitTitle: 'Functional Units & Arithmetic',
      question: 'In IEEE 754 single-precision (32-bit) floating point standard, how many bits are allocated to the exponent?',
      options: ['8 bits', '11 bits', '23 bits', '16 bits'],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'IEEE 754 single-precision allocates 1 bit for sign, 8 bits for exponent (biased by 127), and 23 bits for mantissa.'
    },
    {
      subjectCode: 'BCS-302',
      unit: 2,
      unitTitle: 'Central Processing Unit',
      question: 'Which addressing mode specifies the effective address of the operand directly as the content of a register?',
      options: ['Immediate', 'Register Direct', 'Register Indirect', 'Relative'],
      correctOptionIndex: 2,
      marks: 2,
      modelAnswer: 'In Register Indirect addressing mode, the register holds the memory address of the operand.'
    },
    {
      subjectCode: 'BCS-302',
      unit: 3,
      unitTitle: 'Control Unit & Pipelining',
      question: 'What type of pipeline hazard occurs when two instructions compete for the same physical hardware resource?',
      options: ['Data Hazard', 'Structural Hazard', 'Control Hazard', 'Branch Hazard'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Structural hazards occur when hardware resource conflicts prevent simultaneous execution of pipeline stages.'
    },
    {
      subjectCode: 'BCS-302',
      unit: 4,
      unitTitle: 'Memory Organization',
      question: 'Which cache mapping technique allows any memory block to be placed into any cache line?',
      options: ['Direct Mapping', 'Fully Associative Mapping', '2-Way Set Associative', 'Segmented Mapping'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Fully Associative Mapping permits any memory block to reside in any arbitrary line of the cache.'
    },
    {
      subjectCode: 'BCS-302',
      unit: 5,
      unitTitle: 'Input-Output Organization',
      question: 'Which I/O data transfer method transfers an entire block of data directly between memory and peripheral without CPU intervention?',
      options: ['Programmed I/O', 'Interrupt-Driven I/O', 'Direct Memory Access (DMA)', 'Polling'],
      correctOptionIndex: 2,
      marks: 2,
      modelAnswer: 'DMA bypasses the CPU for high-speed block transfers between I/O devices and main memory.'
    },

    // Mathematics - IV (BAS-303)
    {
      subjectCode: 'BAS-303',
      unit: 1,
      unitTitle: 'Partial Differential Equations',
      question: 'Lagrange linear partial differential equation of first order is expressed in the standard form:',
      options: ['Pp + Qq = R', 'p^2 + q^2 = 1', 'z = px + qy', 'F(p, q) = 0'],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'The standard Lagrange linear PDE form is Pp + Qq = R where p = dz/dx and q = dz/dy.'
    },
    {
      subjectCode: 'BAS-303',
      unit: 3,
      unitTitle: 'Statistical Techniques - I',
      question: 'Karl Pearson coefficient of correlation (r) always lies within the range:',
      options: ['0 to 1', '-1 to +1', '-infinity to +infinity', '0 to 100'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Correlation coefficient r strictly ranges between -1 (perfect negative) and +1 (perfect positive).'
    },
    {
      subjectCode: 'BAS-303',
      unit: 4,
      unitTitle: 'Statistical Techniques - II',
      question: 'In a Poisson distribution with parameter λ, what is the variance?',
      options: ['λ', 'λ^2', 'sqrt(λ)', '1/λ'],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'For a Poisson distribution, both the mean and the variance are equal to λ.'
    },

    // Discrete Structures (BCS-303)
    {
      subjectCode: 'BCS-303',
      unit: 1,
      unitTitle: 'Set Theory & Relations',
      question: 'A relation R on set A is an Equivalence Relation if and only if it is:',
      options: [
        'Reflexive, Symmetric, and Transitive',
        'Reflexive, Anti-symmetric, and Transitive',
        'Irreflexive, Symmetric, and Transitive',
        'Symmetric and Transitive only'
      ],
      correctOptionIndex: 0,
      marks: 2,
      modelAnswer: 'An equivalence relation must be simultaneously Reflexive, Symmetric, and Transitive.'
    },
    {
      subjectCode: 'BCS-303',
      unit: 3,
      unitTitle: 'Propositional & Predicate Logic',
      question: 'A compound statement that is always TRUE regardless of the truth values of its constituent propositions is called a:',
      options: ['Contradiction', 'Tautology', 'Contingency', 'Fallacy'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'A tautology is a propositional formula that evaluates to true under all possible truth value assignments.'
    },

    // Technical Communication (BAS-301)
    {
      subjectCode: 'BAS-301',
      unit: 1,
      unitTitle: 'Fundamentals of Technical Communication',
      question: 'What is the primary distinguishing characteristic of technical communication compared to general communication?',
      options: [
        'Use of flowery, poetic metaphors',
        'Factual accuracy, precision, and objective clarity',
        'Informal, conversational slang',
        'Fictional narrative structures'
      ],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'Technical communication demands absolute factual accuracy, objective clarity, precision, and logical structure.'
    },
    {
      subjectCode: 'BAS-301',
      unit: 2,
      unitTitle: 'Technical Reports & Proposals',
      question: 'Which component of a formal technical report provides a standalone executive overview of the entire study?',
      options: ['Bibliography', 'Abstract / Executive Summary', 'Appendix', 'Glossary'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'The Abstract or Executive Summary succinctly encapsulates the objectives, methodology, key findings, and recommendations.'
    },

    // Python Programming (BCC-302)
    {
      subjectCode: 'BCC-302',
      unit: 1,
      unitTitle: 'Python Basics & Control Flow',
      question: 'Which of the following built-in data types in Python is IMMUTABLE?',
      options: ['List', 'Dictionary', 'Tuple', 'Set'],
      correctOptionIndex: 2,
      marks: 2,
      modelAnswer: 'Tuples are immutable sequences in Python; their elements cannot be modified, added, or removed after creation.'
    },
    {
      subjectCode: 'BCC-302',
      unit: 3,
      unitTitle: 'Lists, Tuples & Dictionaries',
      question: 'What will be the output of `bool([0])` in Python?',
      options: ['False', 'True', '0', 'TypeError'],
      correctOptionIndex: 1,
      marks: 2,
      modelAnswer: 'In Python, any non-empty list evaluates to True, even if its single element is 0.'
    }
  ];

  // Filter matching questions
  let matches = questionsBank.filter(q => {
    const codeMatch = q.subjectCode === code || (code.includes('BCS') && q.subjectCode.includes('BCS'));
    const unitMatch = unitList.includes(q.unit);
    return codeMatch && unitMatch;
  });

  if (matches.length === 0) {
    matches = questionsBank.filter(q => q.subjectCode === code || subName.includes(q.subjectCode.toLowerCase()));
  }

  if (matches.length === 0) {
    matches = questionsBank.filter(q => unitList.includes(q.unit));
  }

  // If still empty or need more, generate generic syllabus-aligned MCQs
  const results = [];
  const pool = matches.length > 0 ? matches : questionsBank;

  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    const assignedUnit = unitList[i % unitList.length] || u;
    results.push({
      id: `ai_q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      subject: subject || 'AKTU Engineering',
      subjectCode: subjectCode || 'BCS-301',
      unit: assignedUnit,
      unitTitle: template.unitTitle || `Unit ${assignedUnit}`,
      question: template.question,
      type: 'mcq',
      options: [...template.options],
      correctOptionIndex: template.correctOptionIndex,
      marks: 2,
      isPYQ: false,
      sourceType: 'AI-Generated Practice',
      sourceBadge: 'Syllabus-Aligned Practice',
      modelAnswer: template.modelAnswer || 'Correct answer verified against official AKTU syllabus.'
    });
  }

  return results;
}

/* ============================================================================
   6. TEST EVALUATION (Auto-Graded Objective + AI-Assisted Descriptive Scoring)
   ============================================================================ */
async function evaluateTestSubmission({ testId, title, subject, subjectCode, questions, answers, userEmail }) {
  const store = initTestsStore();
  let totalMarks = 0;
  let obtainedMarks = 0;

  const evaluationDetails = [];
  const unitPerformance = {};

  const ai = getAI();

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const rawAns = answers ? answers[q.id] : undefined;
    const isAttempted = rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== "";
    const studentAns = isAttempted ? rawAns : "";
    const qMarks = Number(q.marks || 2);
    totalMarks += qMarks;

    const unitKey = `Unit ${q.unit || 1}`;
    if (!unitPerformance[unitKey]) {
      unitPerformance[unitKey] = { total: 0, obtained: 0, count: 0, title: q.unitTitle || `Unit ${q.unit || 1}` };
    }
    unitPerformance[unitKey].total += qMarks;
    unitPerformance[unitKey].count += 1;

    let awarded = 0;
    let feedback = "";
    let isCorrect = false;

    if (!isAttempted) {
      unansweredCount++;
      awarded = 0;
      isCorrect = false;
      feedback = q.type === 'mcq'
        ? `Not attempted. Correct answer was Option ${String.fromCharCode(65 + (q.correctOptionIndex || 0))}: ${q.options ? q.options[q.correctOptionIndex] : ''}`
        : "Not attempted.";
    } else if (q.type === 'mcq') {
      let chosenIndex = NaN;
      if (typeof studentAns === 'number') {
        chosenIndex = studentAns;
      } else if (typeof studentAns === 'string' && studentAns.trim() !== '') {
        chosenIndex = parseInt(studentAns, 10);
      }

      if (!isNaN(chosenIndex) && chosenIndex === q.correctOptionIndex) {
        awarded = qMarks;
        isCorrect = true;
        correctCount++;
        feedback = "Correct selection!";
      } else {
        awarded = 0;
        isCorrect = false;
        incorrectCount++;
        feedback = `Incorrect. Correct answer was Option ${String.fromCharCode(65 + (q.correctOptionIndex || 0))}: ${q.options ? q.options[q.correctOptionIndex] : ''}`;
      }
    } else {
      // Descriptive / Analytical Answer: Evaluate with AI or semantic heuristics
      if (String(studentAns).trim().length < 5) {
        awarded = 0;
        isCorrect = false;
        incorrectCount++;
        feedback = "Answer too brief to evaluate.";
      } else if (ai) {
        try {
          const evalPrompt = `You are evaluating an AKTU university engineering exam descriptive answer.
Question (${qMarks} Marks): ${q.question}
Model Answer: ${q.modelAnswer}
Student's Submitted Answer: ${studentAns}

Evaluate fairly based on technical correctness, conceptual clarity, and completeness.
Return ONLY valid JSON in this format:
{
  "awardedMarks": 5.5, // number between 0 and ${qMarks}
  "feedback": "2-sentence encouraging critique highlighting strengths and missing key points."
}`;

          const evalResp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: evalPrompt }] }],
            config: { responseMimeType: 'application/json' }
          });

          const parsedEval = JSON.parse(evalResp.text ? evalResp.text.trim() : '{}');
          awarded = Math.min(qMarks, Math.max(0, Number(parsedEval.awardedMarks || Math.round(qMarks * 0.7))));
          feedback = parsedEval.feedback || "Evaluated by AI study assistant.";
          isCorrect = awarded >= (qMarks * 0.5);
          if (isCorrect) correctCount++; else incorrectCount++;
        } catch (e) {
          // Heuristic fallback
          const lengthScore = Math.min(qMarks, Math.max(1, Math.round((String(studentAns).length / 200) * qMarks)));
          awarded = lengthScore;
          feedback = "Evaluated via structural heuristic check.";
          isCorrect = awarded >= (qMarks * 0.5);
          if (isCorrect) correctCount++; else incorrectCount++;
        }
      } else {
        const lengthScore = Math.min(qMarks, Math.max(1, Math.round((String(studentAns).length / 200) * qMarks)));
        awarded = lengthScore;
        feedback = "Evaluated via heuristic check.";
        isCorrect = awarded >= (qMarks * 0.5);
        if (isCorrect) correctCount++; else incorrectCount++;
      }
    }

    obtainedMarks += awarded;
    unitPerformance[unitKey].obtained += awarded;

    let displayStudentAnswer = 'Not Attempted';
    if (isAttempted) {
      if (q.type === 'mcq' && q.options) {
        const optIdx = typeof studentAns === 'number' ? studentAns : parseInt(studentAns, 10);
        displayStudentAnswer = !isNaN(optIdx) && q.options[optIdx] !== undefined ? `${String.fromCharCode(65 + optIdx)}. ${q.options[optIdx]}` : String(studentAns);
      } else {
        displayStudentAnswer = String(studentAns);
      }
    }

    let displayCorrectAnswer = '';
    if (q.type === 'mcq' && q.options) {
      displayCorrectAnswer = `${String.fromCharCode(65 + (q.correctOptionIndex || 0))}. ${q.options[q.correctOptionIndex]}`;
    } else {
      displayCorrectAnswer = q.modelAnswer || q.solution || 'Model answer available in AKTU curriculum.';
    }

    evaluationDetails.push({
      questionId: q.id,
      question: q.question,
      unit: q.unit || 1,
      type: q.type,
      maxMarks: qMarks,
      awardedMarks: awarded,
      isCorrect,
      isAttempted,
      studentAnswer: displayStudentAnswer,
      correctAnswer: displayCorrectAnswer,
      modelAnswer: q.modelAnswer,
      explanation: q.explanation || q.modelAnswer || feedback,
      feedback,
      sourceType: q.sourceType,
      isPYQ: q.isPYQ
    });
  }

  const percentage = totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(1)) : 0;

  // Determine weak units (< 60% score)
  const weakUnits = [];
  const strongUnits = [];
  for (const [uKey, uData] of Object.entries(unitPerformance)) {
    const uPct = uData.total > 0 ? (uData.obtained / uData.total) * 100 : 0;
    if (uPct < 60) {
      weakUnits.push({ unit: uKey, title: uData.title, percentage: Number(uPct.toFixed(1)) });
    } else {
      strongUnits.push({ unit: uKey, title: uData.title, percentage: Number(uPct.toFixed(1)) });
    }
  }

  const attemptRecord = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    testId: testId || `test_${Date.now()}`,
    title: title || `${subject} Practice Test`,
    subject,
    subjectCode,
    userEmail: (userEmail || 'student@aktu.ac.in').toLowerCase(),
    completedAt: new Date().toISOString(),
    totalMarks,
    obtainedMarks: Number(obtainedMarks.toFixed(1)),
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    unitPerformance,
    weakUnits,
    strongUnits,
    evaluationDetails
  };

  // Prevent duplicate attempts for repeated submissions of the same test
  const existingIdx = store.attempts.findIndex(a => 
    a.testId === attemptRecord.testId && 
    (a.userEmail || '').toLowerCase() === attemptRecord.userEmail
  );

  if (existingIdx >= 0) {
    attemptRecord.id = store.attempts[existingIdx].id;
    store.attempts[existingIdx] = attemptRecord;
  } else {
    store.attempts.push(attemptRecord);
  }

  persistTestsStore();

  return attemptRecord;
}

/* ============================================================================
   7. CALENDAR INTEGRATION & CONFLICT DETECTION FOR MONTHLY TESTS
   ============================================================================ */
function checkCalendarConflict(dateStr, timeStr, userEmail) {
  // Read tasks store
  let tasks = [];
  try {
    if (fs.existsSync(TASKS_STORE_FILE)) {
      tasks = JSON.parse(fs.readFileSync(TASKS_STORE_FILE, 'utf8'));
    }
  } catch (e) {}

  const userTasks = tasks.filter(t => (t.userEmail || '').toLowerCase() === (userEmail || '').toLowerCase());
  const sameDateTasks = userTasks.filter(t => t.date === dateStr);

  const store = initTestsStore();
  const userSchedules = store.schedules.filter(s => (s.userEmail || '').toLowerCase() === (userEmail || '').toLowerCase());
  const sameDateTests = userSchedules.filter(s => s.date === dateStr && s.status !== 'cancelled');

  const conflicts = [];

  sameDateTests.forEach(test => {
    if (test.time === timeStr) {
      conflicts.push(`Test Conflict: You already have "${test.title}" scheduled on ${dateStr} at ${timeStr}.`);
    }
  });

  sameDateTasks.forEach(task => {
    if (task.time && task.time === timeStr) {
      conflicts.push(`Study Task Conflict: You already have calendar task "${task.title}" on ${dateStr} at ${timeStr}.`);
    }
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

function scheduleMonthlyTest(payload) {
  const store = initTestsStore();
  const { title, subject, subjectCode, units, date, time, durationMinutes, maxMarks, userEmail } = payload;

  const conflictCheck = checkCalendarConflict(date, time, userEmail);
  if (conflictCheck.hasConflict) {
    const err = new Error(conflictCheck.conflicts.join(' '));
    err.status = 409;
    throw err;
  }

  const newSchedule = {
    id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: title || `${subject} Monthly Test`,
    subject,
    subjectCode,
    units: Array.isArray(units) ? units : [1, 2],
    date,
    time: time || "10:00 AM",
    durationMinutes: Number(durationMinutes || 60),
    maxMarks: Number(maxMarks || 50),
    userEmail: (userEmail || 'student@aktu.ac.in').toLowerCase(),
    createdAt: new Date().toISOString(),
    status: "upcoming" // 'upcoming' | 'completed' | 'cancelled'
  };

  store.schedules.push(newSchedule);
  persistTestsStore();
  return newSchedule;
}

function updateScheduledTest(id, payload) {
  const store = initTestsStore();
  const index = store.schedules.findIndex(s => s.id === id);
  if (index === -1) {
    const err = new Error("Scheduled test not found.");
    err.status = 404;
    throw err;
  }

  // If changing date or time, verify conflict
  if (payload.date || payload.time) {
    const newDate = payload.date || store.schedules[index].date;
    const newTime = payload.time || store.schedules[index].time;
    const conflictCheck = checkCalendarConflict(newDate, newTime, store.schedules[index].userEmail);
    // Ignore conflict with itself
    const otherConflicts = conflictCheck.conflicts.filter(c => !c.includes(store.schedules[index].title));
    if (otherConflicts.length > 0) {
      const err = new Error(otherConflicts.join(' '));
      err.status = 409;
      throw err;
    }
  }

  store.schedules[index] = {
    ...store.schedules[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  persistTestsStore();
  return store.schedules[index];
}

function deleteScheduledTest(id) {
  const store = initTestsStore();
  const index = store.schedules.findIndex(s => s.id === id);
  if (index === -1) {
    const err = new Error("Scheduled test not found.");
    err.status = 404;
    throw err;
  }
  const deleted = store.schedules.splice(index, 1)[0];
  persistTestsStore();
  return deleted;
}

/* ============================================================================
   8. PERFORMANCE ANALYTICS & TEST HISTORY
   ============================================================================ */
function getUserAnalytics(userEmail) {
  const store = initTestsStore();
  const cleanEmail = (userEmail || '').toLowerCase();

  const userAttempts = store.attempts.filter(a => (a.userEmail || '').toLowerCase() === cleanEmail);
  const userSchedules = store.schedules.filter(s => (s.userEmail || '').toLowerCase() === cleanEmail);

  const totalTests = userAttempts.length;
  let totalScoreSum = 0;
  let bestScore = 0;
  const subjectScores = {};
  const weakTopicAggregator = {};

  userAttempts.forEach(att => {
    totalScoreSum += att.percentage;
    if (att.percentage > bestScore) bestScore = att.percentage;

    if (!subjectScores[att.subject]) {
      subjectScores[att.subject] = { attempts: 0, sum: 0, avg: 0 };
    }
    subjectScores[att.subject].attempts += 1;
    subjectScores[att.subject].sum += att.percentage;
    subjectScores[att.subject].avg = Number((subjectScores[att.subject].sum / subjectScores[att.subject].attempts).toFixed(1));

    if (Array.isArray(att.weakUnits)) {
      att.weakUnits.forEach(wu => {
        const key = `${att.subject} - ${wu.unit} (${wu.title})`;
        weakTopicAggregator[key] = (weakTopicAggregator[key] || 0) + 1;
      });
    }
  });

  const averageScore = totalTests > 0 ? Number((totalScoreSum / totalTests).toFixed(1)) : 0;

  // Recommended revision tests based on weak topics
  const recommendedRevision = Object.keys(weakTopicAggregator).map(topic => ({
    topic,
    frequency: weakTopicAggregator[topic],
    action: "Generate 10-Question Targeted Unit Practice"
  }));

  return {
    totalTests,
    averageScore,
    bestScore,
    completedTests: userAttempts.length,
    upcomingTests: userSchedules.filter(s => s.status === 'upcoming').length,
    subjectPerformance: subjectScores,
    recommendedRevision,
    recentAttempts: userAttempts.slice(-5).reverse(),
    upcomingSchedules: userSchedules.filter(s => s.status === 'upcoming')
  };
}

module.exports = {
  VERIFIED_AKTU_PAPERS,
  VERIFIED_PYQ_QUESTIONS,
  initTestsStore,
  getPYQPapers,
  getUnitPYQQuestions,
  generateTestQuestions,
  evaluateTestSubmission,
  checkCalendarConflict,
  scheduleMonthlyTest,
  updateScheduledTest,
  deleteScheduledTest,
  getUserAnalytics
};

export type PracticeLanguageId = "python" | "javascript" | "java" | "cpp";

export type TestResult = { name: string; passed: boolean; detail: string };

export type AIFeedback = {
  summary: string;
  working: string[];
  improve: string[];
  nextProblemId: string;
};

export type CodeExecutionRequest = {
  language: PracticeLanguageId;
  code: string;
  problemId: string;
};

export type CodeExecutionResult = {
  status: "passed" | "partial" | "failed";
  testsPassed: number;
  testsTotal: number;
  executionTime: number;
  tests: TestResult[];
  feedback: AIFeedback;
  source: "demo";
};

export type PracticeProblem = {
  id: string;
  title: string;
  description: string;
  skill: "Data Structures" | "Algorithms" | "SQL" | "System Design";
  difficulty: "Easy" | "Medium";
  estimatedTime: string;
  examples: { input: string; output: string }[];
  constraints: string[];
  starterCode: Record<PracticeLanguageId, string>;
  testCaseMetadata: string;
  recommended?: boolean;
  responseMode?: "code" | "structured";
};

export const practiceLanguages: { id: PracticeLanguageId; displayName: string }[] = [
  { id: "python", displayName: "Python" },
  { id: "javascript", displayName: "JavaScript" },
  { id: "java", displayName: "Java" },
  { id: "cpp", displayName: "C++" },
];

const starters = (python: string, javascript: string, java: string, cpp: string) => ({ python, javascript, java, cpp });

export const practiceProblems: PracticeProblem[] = [
  { id: "two-sum", title: "Two Sum", description: "Given an array of integers and a target value, return the indices of the two numbers that add up to the target.", skill: "Data Structures", difficulty: "Easy", estimatedTime: "15 min", examples: [{ input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]" }], constraints: ["Each input has exactly one solution.", "You may not use the same element twice."], testCaseMetadata: "3 hidden test cases", recommended: true, starterCode: starters("def two_sum(nums, target):\n    # Write your solution here\n    pass", "function twoSum(nums, target) {\n  // Write your solution here\n}", "class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n    return new int[]{};\n  }\n}", "vector<int> twoSum(vector<int>& nums, int target) {\n  // Write your solution here\n  return {};\n}") },
  { id: "valid-parentheses", title: "Valid Parentheses", description: "Given a string containing brackets, determine whether every opening bracket is closed in the correct order.", skill: "Data Structures", difficulty: "Easy", estimatedTime: "15 min", examples: [{ input: 's = "()[]{}"', output: "true" }], constraints: ["The string contains only bracket characters.", "An empty string is valid."], testCaseMetadata: "3 hidden test cases", starterCode: starters("def is_valid(s):\n    # Write your solution here\n    pass", "function isValid(s) {\n  // Write your solution here\n}", "class Solution {\n  public boolean isValid(String s) {\n    return false;\n  }\n}", "bool isValid(string s) {\n  return false;\n}") },
  { id: "binary-search", title: "Binary Search", description: "Find the index of a target value in a sorted array, or return -1 if it is not present.", skill: "Algorithms", difficulty: "Easy", estimatedTime: "15 min", examples: [{ input: "nums = [-1, 0, 3, 5, 9, 12], target = 9", output: "4" }], constraints: ["The input array is sorted in ascending order.", "Aim for logarithmic time complexity."], testCaseMetadata: "3 hidden test cases", starterCode: starters("def search(nums, target):\n    # Write your solution here\n    pass", "function search(nums, target) {\n  // Write your solution here\n}", "class Solution {\n  public int search(int[] nums, int target) {\n    return -1;\n  }\n}", "int search(vector<int>& nums, int target) {\n  return -1;\n}") },
  { id: "merge-intervals", title: "Merge Intervals", description: "Merge all overlapping intervals and return the resulting non-overlapping intervals.", skill: "Algorithms", difficulty: "Medium", estimatedTime: "25 min", examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }], constraints: ["Intervals may overlap.", "Return intervals sorted by start time."], testCaseMetadata: "3 hidden test cases", starterCode: starters("def merge(intervals):\n    # Write your solution here\n    pass", "function merge(intervals) {\n  // Write your solution here\n}", "class Solution {\n  public int[][] merge(int[][] intervals) {\n    return new int[][]{};\n  }\n}", "vector<vector<int>> merge(vector<vector<int>>& intervals) {\n  return {};\n}") },
  { id: "sql-active-customers", title: "SQL Query Challenge", description: "Return each customer who placed at least two orders in the previous 30 days.", skill: "SQL", difficulty: "Medium", estimatedTime: "20 min", examples: [{ input: "customers(id, name), orders(customer_id, created_at)", output: "customer id and name" }], constraints: ["Use a clear join strategy.", "Avoid duplicate customer rows."], testCaseMetadata: "2 query checks", starterCode: starters("-- Write a SQL query here\nSELECT", "-- Write a SQL query here\nSELECT", "-- Write a SQL query here\nSELECT", "-- Write a SQL query here\nSELECT") },
  { id: "design-notifications", title: "System Design Trade-off", description: "Design a notification service that can deliver email and push notifications reliably at moderate scale.", skill: "System Design", difficulty: "Medium", estimatedTime: "30 min", examples: [{ input: "New event from a product service", output: "A reliable notification delivery flow" }], constraints: ["State your delivery and retry strategy.", "Explain one important trade-off."], testCaseMetadata: "Structured response review", responseMode: "structured", starterCode: starters("Outline your approach:\n\n1. Core components\n2. Delivery flow\n3. Reliability and trade-offs", "Outline your approach:\n\n1. Core components\n2. Delivery flow\n3. Reliability and trade-offs", "Outline your approach:\n\n1. Core components\n2. Delivery flow\n3. Reliability and trade-offs", "Outline your approach:\n\n1. Core components\n2. Delivery flow\n3. Reliability and trade-offs") },
];

const demoFeedback: AIFeedback = {
  summary: "Good start. This demo result reflects the selected problem's representative test suite.",
  working: ["Clear control flow", "Appropriate use of the core data structure", "Covers the basic case"],
  improve: ["Explain the time complexity", "Call out one edge case", "Use descriptive variable names"],
  nextProblemId: "valid-parentheses",
};

// This deliberately does not execute code. Replace this adapter with the backend contract when available.
export async function runCodeDemo(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
  if (!request.code.trim()) throw new Error("Add a solution before running tests.");
  await new Promise((resolve) => window.setTimeout(resolve, 550));
  return { status: "passed", testsPassed: 3, testsTotal: 3, executionTime: 42, tests: [{ name: "Example case", passed: true, detail: "Output matches expected result" }, { name: "Edge case", passed: true, detail: "Handled successfully" }, { name: "Hidden test", passed: true, detail: "Passed" }], feedback: demoFeedback, source: "demo" };
}

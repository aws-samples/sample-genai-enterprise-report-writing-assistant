module.exports = {
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1" 
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}"
  ],
  coverageReporters: ["text", "lcov"]
};

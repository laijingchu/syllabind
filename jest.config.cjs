
module.exports = {
  preset: 'ts-jest',
  maxWorkers: 1,
  projects: [
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/__tests__/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.afterEnv.js'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json'
        }]
      },
      modulePathIgnorePatterns: [
        '<rootDir>/template/',
        '<rootDir>/.cache/',
        '<rootDir>/node_modules/.cache/'
      ]
    }
  ],
  collectCoverageFrom: [
    'server/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/coverage/**',
    '!server/index.ts',
    '!server/seed.ts',
    '!server/migrate-jsonb-to-normalized.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true
}

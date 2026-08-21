/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  passWithNoTests: true,
  // Бэкенд-тесты на TypeScript. Фронтенд использует свой раннер (apps/frontend: npm test).
  roots: ['<rootDir>/apps/backend'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};

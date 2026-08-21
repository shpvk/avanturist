/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  passWithNoTests: true,
  // Бэкенд-тесты на TypeScript. Фронтенд использует свой раннер (npm run frontend:test).
  roots: ['<rootDir>/apps/backend'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          esModuleInterop: true,
          types: ['jest', 'node'],
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};

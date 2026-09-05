/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  passWithNoTests: true,
  // Бэкенд-тесты на TypeScript. Фронтенд использует свой раннер (npm run frontend:test).
  roots: ['<rootDir>/apps/backend'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  // Сгенерированный Prisma-клиент импортирует соседние модули с расширением .js,
  // которого в исходниках нет: снимаем его при резолве под CommonJS.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          esModuleInterop: true,
          types: ['jest', 'node'],
          jsx: 'react-jsx',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};

module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/dist/', '/supabase/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};

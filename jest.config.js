/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/nodes/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				strict: true,
				module: 'commonjs',
				moduleResolution: 'node',
				target: 'es2019',
				lib: ['es2019', 'es2020', 'es2022.error'],
				types: ['node', 'jest'],
				esModuleInterop: true,
				resolveJsonModule: true,
				skipLibCheck: true,
				noUnusedLocals: false,
				noImplicitAny: true,
				strictNullChecks: true,
			},
		}],
	},
};

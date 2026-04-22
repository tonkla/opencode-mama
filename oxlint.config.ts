import { defineConfig } from 'oxlint'

export default defineConfig({
	categories: {
		correctness: 'error',
	},
	rules: {
		'eslint/no-unused-vars': 'error',
	},
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'typescript/no-explicit-any': 'error',
			},
		},
		{
			files: ['*.ts'],
			rules: {
				'typescript/explicit-function-return-type': 'error',
				'typescript/explicit-module-boundary-types': 'error',
			},
		},
	],
})

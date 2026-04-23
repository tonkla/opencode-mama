import { EventEmitter } from 'node:events'
import { describe, expect, test } from 'bun:test'
import { createInteractiveConflictResolver, isDirectRun, main } from './cli.js'

describe('main', () => {
	test('supports explicit local install in the current project', async () => {
		const calls = []
		const stdout = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'install'],
			cwd: () => '/workspace/app',
			install: async (options) => {
				calls.push(options)
				return {
					surfaceRoot: '/workspace/app/.opencode',
				}
			},
			stderr: { write() {} },
			stdout: {
				write(chunk) {
					stdout.push(chunk)
				},
			},
		})

		expect(exitCode).toBe(0)
		expect(calls).toEqual([
			{
				options: {
					onConflict: expect.any(Function),
				},
				projectDir: '/workspace/app',
			},
		])
		expect(stdout.join('')).toContain('/workspace/app/.opencode')
	})

	test('supports the short install alias', async () => {
		const calls = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'i'],
			cwd: () => '/workspace/app',
			install: async (options) => {
				calls.push(options)
				return {
					surfaceRoot: '/workspace/app/.opencode',
				}
			},
			stderr: { write() {} },
			stdout: { write() {} },
		})

		expect(exitCode).toBe(0)
		expect(calls).toEqual([
			{
				options: {
					onConflict: expect.any(Function),
				},
				projectDir: '/workspace/app',
			},
		])
	})

	test('supports local uninstall', async () => {
		const calls = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'uninstall'],
			cwd: () => '/workspace/app',
			uninstall: async (options) => {
				calls.push(options)
				return {
					surfaceRoot: '/workspace/app/.opencode',
				}
			},
			stderr: { write() {} },
			stdout: { write() {} },
		})

		expect(exitCode).toBe(0)
		expect(calls).toEqual([
			{
				options: {},
				projectDir: '/workspace/app',
			},
		])
	})

	test('supports the short uninstall alias', async () => {
		const calls = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'u'],
			cwd: () => '/workspace/app',
			uninstall: async (options) => {
				calls.push(options)
				return {
					surfaceRoot: '/workspace/app/.opencode',
				}
			},
			stderr: { write() {} },
			stdout: { write() {} },
		})

		expect(exitCode).toBe(0)
		expect(calls).toEqual([
			{
				options: {},
				projectDir: '/workspace/app',
			},
		])
	})

	test('prints usage with no command', async () => {
		const stderr = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama'],
			install: async () => {
				throw new Error('should not install')
			},
			stderr: {
				write(chunk) {
					stderr.push(chunk)
				},
			},
			stdout: { write() {} },
		})

		expect(exitCode).toBe(1)
		expect(stderr.join('')).toContain('Usage:')
	})

	test('prints usage for unsupported commands', async () => {
		const stderr = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'wat'],
			install: async () => {
				throw new Error('should not install')
			},
			uninstall: async () => {
				throw new Error('should not uninstall')
			},
			stderr: {
				write(chunk) {
					stderr.push(chunk)
				},
			},
			stdout: { write() {} },
		})

		expect(exitCode).toBe(1)
		expect(stderr.join('')).toContain('Usage:')
	})

	test('prints usage for removed global flags', async () => {
		const stderr = []

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'install', '-g'],
			stderr: {
				write(chunk) {
					stderr.push(chunk)
				},
			},
			stdout: { write() {} },
		})

		expect(exitCode).toBe(1)
		expect(stderr.join('')).toContain('Usage:')
	})

	test('handles Ctrl+C during install prompts without throwing', async () => {
		const stderr = []
		const closeCalls = []
		const abortError = new Error('Aborted with Ctrl+C')
		abortError.name = 'AbortError'

		const exitCode = await main({
			argv: ['node', 'opencode-mama', 'install'],
			cwd: () => '/workspace/app',
			createConflictResolver: () => {
				const resolver = async () => {
					throw abortError
				}

				resolver.close = async () => {
					closeCalls.push('closed')
				}
				return resolver
			},
			install: async ({ options }) => {
				await options.onConflict({
					targetPath: '/workspace/app/config.toml',
				})
				throw new Error('should not reach install completion')
			},
			stderr: {
				write(chunk) {
					stderr.push(chunk)
				},
			},
			stdout: { write() {} },
		})

		expect(exitCode).toBe(130)
		expect(stderr.join('')).toContain('Aborted.')
		expect(closeCalls).toEqual(['closed'])
	})
})

describe('isDirectRun', () => {
	test('treats symlinked bin paths as direct execution of the same file', () => {
		const result = isDirectRun({
			argv: ['/usr/bin/node', '/Users/ss/.bun/bin/opencode-mama'],
			modulePath:
				'/Users/ss/.bun/install/global/node_modules/opencode-mama/packages/installer/src/cli.js',
			realpath: (path) => {
				if (path === '/Users/ss/.bun/bin/opencode-mama') {
					return '/Users/ss/.bun/install/global/node_modules/opencode-mama/packages/installer/src/cli.js'
				}

				return path
			},
		})

		expect(result).toBe(true)
	})
})

describe('createInteractiveConflictResolver', () => {
	test('overwrites immediately on y without waiting for Enter', async () => {
		const input = createFakeTtyInput()
		const output = createFakeTtyOutput()
		const resolver = createInteractiveConflictResolver({ input, output })

		const pending = resolver({ targetPath: '/workspace/app/config.toml' })
		input.emit('keypress', 'y', { name: 'y' })

		await expect(pending).resolves.toBe('overwrite')
		expect(output.chunks.join('')).toContain('Overwrite? [y/N] ')
		expect(input.rawModeCalls).toEqual([true, false])
	})

	test('skips immediately on N without waiting for Enter', async () => {
		const input = createFakeTtyInput()
		const output = createFakeTtyOutput()
		const resolver = createInteractiveConflictResolver({ input, output })

		const pending = resolver({ targetPath: '/workspace/app/config.toml' })
		input.emit('keypress', 'N', { name: 'N' })

		await expect(pending).resolves.toBe('skip')
		expect(input.rawModeCalls).toEqual([true, false])
	})

	test('uses N as the default when Enter is pressed', async () => {
		const input = createFakeTtyInput()
		const output = createFakeTtyOutput()
		const resolver = createInteractiveConflictResolver({ input, output })

		const pending = resolver({ targetPath: '/workspace/app/config.toml' })
		input.emit('keypress', '\r', { name: 'return' })

		await expect(pending).resolves.toBe('skip')
	})
})

function createFakeTtyInput() {
	const input = new EventEmitter()
	input.isTTY = true
	input.rawModeCalls = []
	input.setRawMode = (value) => {
		input.rawModeCalls.push(value)
	}
	return input
}

function createFakeTtyOutput() {
	return {
		chunks: [],
		isTTY: true,
		write(chunk) {
			this.chunks.push(chunk)
		},
	}
}

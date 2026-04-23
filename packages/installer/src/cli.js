#!/usr/bin/env node

import { realpathSync } from 'node:fs'
import process from 'node:process'
import { emitKeypressEvents } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { installPlugin, uninstallPlugin } from './installer.js'

const USAGE = `Usage:
  opencode-mama install | i
  opencode-mama uninstall | u
  opencode-mama help
`

export async function main({
	argv = process.argv,
	cwd = process.cwd,
	createConflictResolver = createInteractiveConflictResolver,
	install = installPlugin,
	input = process.stdin,
	uninstall = uninstallPlugin,
	stderr = process.stderr,
	stdout = process.stdout,
} = {}) {
	const args = argv.slice(2)

	if (args.length === 0) {
		stderr.write(`${USAGE}\n`)
		return 1
	}

	if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
		stdout.write(`${USAGE}\n`)
		return 0
	}

	const command = normalizeCommand(args[0])

	if (!command) {
		stderr.write(`${USAGE}\n`)
		return 1
	}

	const flags = new Set(args.slice(1))

	if (flags.has('--help') || flags.has('-h')) {
		stdout.write(`${USAGE}\n`)
		return 0
	}

	if (flags.size > 0) {
		stderr.write(`${USAGE}\n`)
		return 1
	}

	try {
		return await runCommand({
			command,
			cwd,
			createConflictResolver,
			input,
			install,
			stderr,
			stdout,
			uninstall,
		})
	} catch (error) {
		if (isAbortError(error)) {
			stderr.write('Aborted.\n')
			return 130
		}

		throw error
	}
}

async function runCommand({
	command,
	cwd,
	createConflictResolver,
	input,
	install,
	stderr,
	stdout,
	uninstall,
}) {
	const projectDir = cwd()
	const action = command === 'install' ? install : uninstall
	const options =
		command === 'install'
			? {
					onConflict: createConflictResolver({
						input,
						output: stderr,
					}),
				}
			: {}

	try {
		const result = await action({
			options,
			projectDir,
		})

		stdout.write(`${formatSuccessMessage({ command, projectDir, result })}\n`)
		return 0
	} finally {
		await options.onConflict?.close?.()
	}
}

function formatSuccessMessage({ command, projectDir, result }) {
	if (command === 'install') {
		return [
			`Installed opencode-mama into ${projectDir}.`,
			`Created or updated the project-local OpenCode surface under ${result.surfaceRoot}.`,
		].join('\n')
	}

	return `Removed opencode-mama from ${projectDir}.`
}

export function createInteractiveConflictResolver({ input, output }) {
	if (!input?.isTTY || !output?.isTTY) {
		return async () => 'skip'
	}

	let closed = false
	const activeCleanups = new Set()

	emitKeypressEvents(input)

	const close = async () => {
		if (closed) {
			return
		}

		closed = true
		process.off('exit', close)

		for (const cleanup of activeCleanups) {
			cleanup()
		}

		activeCleanups.clear()
	}

	process.once('exit', close)

	const resolver = ({ targetPath }) =>
		new Promise((resolve, reject) => {
			if (closed) {
				resolve('skip')
				return
			}

			let restoredRawMode = false

			const cleanup = () => {
				input.off('keypress', onKeypress)
				activeCleanups.delete(cleanup)

				if (restoredRawMode) {
					input.setRawMode(false)
					restoredRawMode = false
				}
			}

			const finish = (decision) => {
				cleanup()
				output.write('\n')
				resolve(decision)
			}

			const abort = () => {
				cleanup()
				output.write('\n')
				reject(createAbortError())
			}

			const onKeypress = (_, key = {}) => {
				if (key.ctrl && key.name === 'c') {
					abort()
					return
				}

				if (key.name === 'return' || key.name === 'enter') {
					finish('skip')
					return
				}

				if (key.name === 'y' || key.name === 'Y') {
					finish('overwrite')
					return
				}

				if (key.name === 'n' || key.name === 'N') {
					finish('skip')
				}
			}

			if (typeof input.setRawMode === 'function') {
				input.setRawMode(true)
				restoredRawMode = true
			}

			activeCleanups.add(cleanup)
			input.on('keypress', onKeypress)
			output.write(`${targetPath} exists. Overwrite? [y/N] `)
		})

	resolver.close = close
	return resolver
}

function normalizeCommand(command) {
	if (command === 'install' || command === 'i') {
		return 'install'
	}

	if (command === 'uninstall' || command === 'u') {
		return 'uninstall'
	}

	return null
}

function isAbortError(error) {
	return (
		error instanceof Error &&
		(error.name === 'AbortError' ||
			// Node/Bun may surface the cancel reason on `code`.
			('code' in error && error.code === 'ABORT_ERR'))
	)
}

function createAbortError() {
	const error = new Error('Aborted with Ctrl+C')
	error.name = 'AbortError'
	error.code = 'ABORT_ERR'
	return error
}

export function isDirectRun({
	argv = process.argv,
	modulePath = fileURLToPath(import.meta.url),
	realpath = realpathSync,
} = {}) {
	const argvPath = argv[1]

	if (!argvPath) {
		return false
	}

	try {
		return realpath(argvPath) === realpath(modulePath)
	} catch {
		return false
	}
}

if (isDirectRun()) {
	const exitCode = await main()
	process.exit(exitCode)
}

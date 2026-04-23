import { dirname, join } from 'node:path'
import { mkdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises'

const ROLE_NAMES = [
	'architect',
	'coder',
	'committer',
	'designer',
	'manager',
	'researcher',
	'reviewer',
	'tester',
]

export async function ensureProjectSurface(projectDir, templateRoot, options = {}) {
	const files = getProjectSurfaceFiles(projectDir, templateRoot)
	const onConflict = options.onConflict ?? defaultConflictResolver
	const result = {
		overwritten: [],
		skipped: [],
		written: [],
	}

	for (const file of files) {
		const status = await writeTemplateFile(file.source, file.target, onConflict)
		result[status].push(file.target)
	}

	return result
}

export async function uninstallProjectSurface(projectDir, templateRoot) {
	const files = getProjectSurfaceFiles(projectDir, templateRoot)

	for (const file of files) {
		await removeTemplateIfUnmodified(file.source, file.target)
	}

	await removeEmptyDir(join(projectDir, '.opencode', 'skills', 'git-commit'))
	await removeEmptyDir(join(projectDir, '.opencode', 'skills', 'test-driven-development'))
	await removeEmptyDir(join(projectDir, '.opencode', 'skills'))
	await removeEmptyDir(join(projectDir, '.opencode', 'commands'))
	await removeEmptyDir(join(projectDir, '.opencode', 'agents'))
	await removeEmptyDir(join(projectDir, '.opencode'))
}

export function getProjectSurfaceFiles(projectDir, templateRoot) {
	return [
		{
			source: join(templateRoot, '_config.toml'),
			target: join(projectDir, 'config.toml'),
		},
		{
			source: join(templateRoot, '_opencode', 'commands', 'm.md'),
			target: join(projectDir, '.opencode', 'commands', 'm.md'),
		},
		...ROLE_NAMES.map((role) => ({
			source: join(templateRoot, '_opencode', 'agents', `${role}.md`),
			target: join(projectDir, '.opencode', 'agents', `${role}.md`),
		})),
		{
			source: join(templateRoot, '_skills', 'git-commit', 'SKILL.md'),
			target: join(projectDir, '.opencode', 'skills', 'git-commit', 'SKILL.md'),
		},
		{
			source: join(templateRoot, '_skills', 'test-driven-development', 'SKILL.md'),
			target: join(projectDir, '.opencode', 'skills', 'test-driven-development', 'SKILL.md'),
		},
		{
			source: join(templateRoot, '_skills', 'test-driven-development', 'testing-anti-patterns.md'),
			target: join(
				projectDir,
				'.opencode',
				'skills',
				'test-driven-development',
				'testing-anti-patterns.md'
			),
		},
	]
}

async function writeTemplateFile(sourcePath, targetPath, onConflict) {
	const contents = await readFile(sourcePath, 'utf8')

	try {
		await readFile(targetPath, 'utf8')
	} catch {}

	let existingContents

	try {
		existingContents = await readFile(targetPath, 'utf8')
	} catch {
		await mkdir(dirname(targetPath), { recursive: true })
		await writeFile(targetPath, contents, { flag: 'wx' })
		return 'written'
	}

	const decision = await onConflict({
		existingContents,
		sourcePath,
		targetPath,
		templateContents: contents,
	})

	if (decision === 'overwrite') {
		await writeFile(targetPath, contents)
		return 'overwritten'
	}

	return 'skipped'
}

async function removeTemplateIfUnmodified(sourcePath, targetPath) {
	let targetContents

	try {
		targetContents = await readFile(targetPath, 'utf8')
	} catch {
		return
	}

	const sourceContents = await readFile(sourcePath, 'utf8')

	if (targetContents !== sourceContents) {
		return
	}

	await rm(targetPath, { force: true })
	await removeEmptyDir(dirname(targetPath))
}

async function removeEmptyDir(path) {
	try {
		await rmdir(path)
	} catch {}
}

export async function defaultConflictResolver() {
	return 'skip'
}

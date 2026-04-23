import { dirname, join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

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

export async function ensureProjectSurface(projectDir, templateRoot) {
	const files = [
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
	]

	for (const file of files) {
		await writeTemplateIfMissing(file.source, file.target)
	}
}

async function writeTemplateIfMissing(sourcePath, targetPath) {
	try {
		await readFile(targetPath, 'utf8')
		return
	} catch {}

	const contents = await readFile(sourcePath, 'utf8')
	await mkdir(dirname(targetPath), { recursive: true })
	await writeFile(targetPath, contents, { flag: 'wx' })
}

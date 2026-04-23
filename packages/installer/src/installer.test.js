import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'bun:test'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { ensureProjectSurface, installPlugin, uninstallPlugin } from './installer.js'

const tempDirs = []

async function makeTempDir(prefix) {
	const dir = await mkdtemp(join(tmpdir(), prefix))
	tempDirs.push(dir)
	return dir
}

async function expectFile(path) {
	await access(path)
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
})

describe('installPlugin', () => {
	test('installs config, agents, commands, and skills into the local project surface', async () => {
		const projectDir = await makeTempDir('opencode-mama-local-')

		await installPlugin({
			projectDir,
		})

		await expectFile(join(projectDir, '.opencode/agents/manager.md'))
		await expectFile(join(projectDir, '.opencode/commands/m.md'))
		await expectFile(join(projectDir, '.opencode/skills/git-commit/SKILL.md'))
		await expectFile(join(projectDir, '.opencode/skills/test-driven-development/SKILL.md'))
		await expectFile(join(projectDir, 'config.toml'))
		await expect(access(join(projectDir, '.opencode/plugins/opencode-mama.js'))).rejects.toThrow()
	})
})

describe('uninstallPlugin', () => {
	test('removes the local plugin payload and generated project surface', async () => {
		const projectDir = await makeTempDir('opencode-mama-uninstall-local-')

		await installPlugin({
			projectDir,
		})

		await uninstallPlugin({
			projectDir,
		})

		await expect(access(join(projectDir, '.opencode/agents/manager.md'))).rejects.toThrow()
		await expect(access(join(projectDir, '.opencode/commands/m.md'))).rejects.toThrow()
		await expect(access(join(projectDir, '.opencode/skills/git-commit/SKILL.md'))).rejects.toThrow()
		await expect(access(join(projectDir, 'config.toml'))).rejects.toThrow()
	})

	test('preserves customized project files during local uninstall', async () => {
		const projectDir = await makeTempDir('opencode-mama-uninstall-custom-')
		const managerPath = join(projectDir, '.opencode/agents/manager.md')

		await installPlugin({
			projectDir,
		})

		await writeFile(managerPath, 'custom manager\n')

		await uninstallPlugin({
			projectDir,
		})

		expect(await readFile(managerPath, 'utf8')).toBe('custom manager\n')
	})
})

describe('ensureProjectSurface', () => {
	test('skips existing files when the resolver returns skip', async () => {
		const projectDir = await makeTempDir('opencode-mama-surface-')
		const customManagerPath = join(projectDir, '.opencode/agents/manager.md')
		const customConfigPath = join(projectDir, 'config.toml')

		await mkdir(join(projectDir, '.opencode/agents'), { recursive: true })
		await writeFile(customManagerPath, 'custom manager\n')
		await writeFile(customConfigPath, 'title = "Custom"\n')

		const result = await ensureProjectSurface(projectDir, {
			onConflict: async () => 'skip',
		})

		expect(await readFile(customManagerPath, 'utf8')).toBe('custom manager\n')
		expect(await readFile(customConfigPath, 'utf8')).toBe('title = "Custom"\n')
		await expectFile(join(projectDir, '.opencode/agents/coder.md'))
		await expectFile(join(projectDir, '.opencode/commands/m.md'))
		await expectFile(join(projectDir, '.opencode/skills/git-commit/SKILL.md'))
		expect(result.skipped).toContain(customManagerPath)
	})

	test('overwrites existing files when the resolver returns overwrite', async () => {
		const projectDir = await makeTempDir('opencode-mama-surface-overwrite-')
		const customManagerPath = join(projectDir, '.opencode/agents/manager.md')

		await mkdir(join(projectDir, '.opencode/agents'), { recursive: true })
		await writeFile(customManagerPath, 'custom manager\n')

		const result = await ensureProjectSurface(projectDir, {
			onConflict: async ({ targetPath }) =>
				targetPath === customManagerPath ? 'overwrite' : 'skip',
		})

		expect(await readFile(customManagerPath, 'utf8')).not.toBe('custom manager\n')
		expect(result.overwritten).toContain(customManagerPath)
	})
})

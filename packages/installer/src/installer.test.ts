import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'bun:test'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { ensureProjectSurface, installPlugin } from './installer.js'

const tempDirs: string[] = []

async function makeTempDir(prefix: string): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), prefix))
	tempDirs.push(dir)
	return dir
}

async function expectFile(path: string): Promise<void> {
	await access(path)
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
})

describe('installPlugin', () => {
	test('installs the plugin payload into the local OpenCode plugin directory and scaffolds the manager surface', async () => {
		const projectDir = await makeTempDir('opencode-mama-local-')

		await installPlugin({
			homeDir: join(projectDir, 'home'),
			mode: 'local',
			projectDir,
		})

		await expectFile(join(projectDir, '.opencode/plugins/opencode-mama.js'))
		await expectFile(join(projectDir, '.opencode/plugins/opencode-mama/templates/_config.toml'))
		await expectFile(join(projectDir, '.opencode/agents/manager.md'))
		await expectFile(join(projectDir, '.opencode/commands/m.md'))
		await expectFile(join(projectDir, 'config.toml'))
	})

	test('installs the plugin payload into the global OpenCode plugin directory without mutating the current project', async () => {
		const homeDir = await makeTempDir('opencode-mama-home-')
		const projectDir = await makeTempDir('opencode-mama-project-')

		await installPlugin({
			homeDir,
			mode: 'global',
			projectDir,
		})

		await expectFile(join(homeDir, '.config/opencode/plugins/opencode-mama.js'))
		await expectFile(join(homeDir, '.config/opencode/plugins/opencode-mama/templates/_config.toml'))

		await expect(access(join(projectDir, '.opencode/agents/manager.md'))).rejects.toThrow()
	})
})

describe('ensureProjectSurface', () => {
	test('preserves customized files while filling in missing manager files', async () => {
		const projectDir = await makeTempDir('opencode-mama-surface-')
		const customManagerPath = join(projectDir, '.opencode/agents/manager.md')
		const customConfigPath = join(projectDir, 'config.toml')

		await mkdir(join(projectDir, '.opencode/agents'), { recursive: true })
		await writeFile(customManagerPath, 'custom manager\n')
		await writeFile(customConfigPath, 'title = "Custom"\n')

		await ensureProjectSurface(projectDir)

		expect(await readFile(customManagerPath, 'utf8')).toBe('custom manager\n')
		expect(await readFile(customConfigPath, 'utf8')).toBe('title = "Custom"\n')
		await expectFile(join(projectDir, '.opencode/agents/coder.md'))
		await expectFile(join(projectDir, '.opencode/commands/m.md'))
	})
})

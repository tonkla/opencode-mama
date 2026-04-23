import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, mkdir } from 'node:fs/promises'
import { ensureProjectSurface as scaffoldProjectSurface } from './project-surface.js'

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const REPO_ROOT = dirname(dirname(PACKAGE_ROOT))
const TEMPLATE_SOURCE_DIR = join(REPO_ROOT, 'templates')
const PLUGIN_ENTRY_SOURCE_PATH = join(PACKAGE_ROOT, 'src', 'opencode-mama.plugin.js')
const PLUGIN_ENTRY_FILENAME = 'opencode-mama.js'
const PLUGIN_ASSET_DIRNAME = 'opencode-mama'

export function detectInstallMode(env = process.env) {
	if (env.npm_config_global === 'true' || env.npm_config_location === 'global') {
		return 'global'
	}

	return 'local'
}

export function resolveInstallOptions({
	env = process.env,
	homeDir = env.HOME,
	projectDir = env.INIT_CWD ?? process.cwd(),
} = {}) {
	if (!homeDir) {
		throw new Error('HOME is required to install opencode-mama')
	}

	return {
		homeDir,
		mode: detectInstallMode(env),
		projectDir,
	}
}

export async function installPlugin({ homeDir, mode, projectDir }) {
	const pluginDir =
		mode === 'global'
			? join(homeDir, '.config', 'opencode', 'plugins')
			: join(projectDir, '.opencode', 'plugins')

	const pluginEntryTargetPath = join(pluginDir, PLUGIN_ENTRY_FILENAME)
	const pluginAssetTargetDir = join(pluginDir, PLUGIN_ASSET_DIRNAME)

	await mkdir(pluginDir, { recursive: true })
	await cp(PLUGIN_ENTRY_SOURCE_PATH, pluginEntryTargetPath, { force: true })
	await cp(TEMPLATE_SOURCE_DIR, join(pluginAssetTargetDir, 'templates'), {
		force: true,
		recursive: true,
	})

	if (mode === 'local') {
		await ensureProjectSurface(projectDir)
	}

	return {
		pluginAssetDir: pluginAssetTargetDir,
		pluginDir,
		pluginEntryPath: pluginEntryTargetPath,
	}
}

export async function installFromEnv(options = {}) {
	return installPlugin(resolveInstallOptions(options))
}

export async function ensureProjectSurface(projectDir) {
	await scaffoldProjectSurface(projectDir, TEMPLATE_SOURCE_DIR)
}

export {
	PLUGIN_ASSET_DIRNAME,
	PLUGIN_ENTRY_FILENAME,
	PLUGIN_ENTRY_SOURCE_PATH,
	TEMPLATE_SOURCE_DIR,
}

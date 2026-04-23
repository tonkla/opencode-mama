import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	ensureProjectSurface as scaffoldProjectSurface,
	uninstallProjectSurface,
} from './project-surface.js'

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const TEMPLATE_SOURCE_DIR = join(PACKAGE_ROOT, 'templates')

export async function installPlugin({ projectDir, options = {} }) {
	const surface = await ensureProjectSurface(projectDir, options)

	return {
		projectDir,
		surface,
		surfaceRoot: join(projectDir, '.opencode'),
	}
}

export async function ensureProjectSurface(projectDir, options = {}) {
	return scaffoldProjectSurface(projectDir, TEMPLATE_SOURCE_DIR, options)
}

export async function uninstallPlugin({ projectDir }) {
	await uninstallProjectSurface(projectDir, TEMPLATE_SOURCE_DIR)

	return {
		projectDir,
		surfaceRoot: join(projectDir, '.opencode'),
	}
}

export { TEMPLATE_SOURCE_DIR }

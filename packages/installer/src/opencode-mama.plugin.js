import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureProjectSurface as scaffoldProjectSurface } from './project-surface.js'

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_ROOT = join(PLUGIN_DIR, 'opencode-mama', 'templates')

export default async function opencodeMamaPlugin(context = {}) {
	if (typeof context.directory === 'string' && context.directory.length > 0) {
		await ensureProjectSurface(context.directory)
	}

	return {}
}

export async function ensureProjectSurface(projectDir) {
	await scaffoldProjectSurface(projectDir, TEMPLATE_ROOT)
}

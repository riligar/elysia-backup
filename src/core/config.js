import { readFileSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

/**
 * Load configuration from a JSON file
 * @param {string} configPath - Path to the config file
 * @returns {Object} Loaded configuration or empty object
 */
export const loadConfig = configPath => {
    if (!existsSync(configPath)) {
        return {}
    }

    try {
        const fileContent = readFileSync(configPath, 'utf-8')
        const config = JSON.parse(fileContent)
        console.log('Loaded backup config from', configPath)
        return config
    } catch (e) {
        console.error('Failed to load backup config:', e)
        return {}
    }
}

/**
 * Save configuration to a JSON file
 * @param {string} configPath - Path to save the config
 * @param {Object} config - Configuration object to save
 */
export const saveConfig = async (configPath, config) => {
    try {
        await writeFile(configPath, JSON.stringify(config, null, 2))
        return true
    } catch (e) {
        console.error('Failed to save config:', e)
        return false
    }
}

/**
 * Create a configuration manager
 * @param {Object} initialConfig - Initial configuration from code
 * @returns {Object} Configuration manager with get/set/save methods
 */
export const createConfigManager = initialConfig => {
    const configPath = initialConfig.configPath || './config.json'
    const savedConfig = loadConfig(configPath)

    let config = { ...initialConfig, ...savedConfig }

    return {
        get: () => config,
        getPath: () => configPath,

        set: newConfig => {
            config = { ...config, ...newConfig }
            return config
        },

        save: async () => {
            return saveConfig(configPath, config)
        },

        update: async newConfig => {
            config = { ...config, ...newConfig }
            await saveConfig(configPath, config)
            return config
        },
    }
}

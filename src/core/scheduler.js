import { CronJob } from 'cron'

/**
 * Create a backup scheduler
 * @param {Function} onBackup - Callback to execute on scheduled backup
 * @returns {Object} Scheduler with setup/stop/getStatus methods
 */
export const createScheduler = onBackup => {
    let backupJob = null

    return {
        /**
         * Setup or restart the cron scheduler
         * @param {string} cronSchedule - Cron expression
         * @param {boolean} enabled - Whether scheduling is enabled
         */
        setup: (cronSchedule, enabled = true) => {
            // Stop existing job if any
            if (backupJob) {
                backupJob.stop()
                backupJob = null
            }

            if (!cronSchedule || enabled === false) {
                return
            }

            console.log(`Setting up backup cron: ${cronSchedule}`)

            try {
                backupJob = new CronJob(
                    cronSchedule,
                    async () => {
                        console.log('Running scheduled backup...')
                        try {
                            // Generate timestamp for the backup
                            const now = new Date()
                            const timestamp =
                                now.getFullYear() +
                                '-' +
                                String(now.getMonth() + 1).padStart(2, '0') +
                                '-' +
                                String(now.getDate()).padStart(2, '0') +
                                '_' +
                                String(now.getHours()).padStart(2, '0') +
                                '-' +
                                String(now.getMinutes()).padStart(2, '0') +
                                '-' +
                                String(now.getSeconds()).padStart(2, '0')

                            await onBackup(timestamp)
                            console.log('Scheduled backup completed')
                        } catch (e) {
                            console.error('Scheduled backup failed:', e)
                        }
                    },
                    null,
                    true // start immediately
                )
            } catch (e) {
                console.error('Invalid cron schedule:', e.message)
            }
        },

        /**
         * Stop the scheduler
         */
        stop: () => {
            if (backupJob) {
                backupJob.stop()
                backupJob = null
            }
        },

        /**
         * Get current scheduler status
         * @param {boolean} cronEnabled - Whether cron is enabled in config
         * @returns {Object} Status with isRunning and nextRun
         */
        getStatus: cronEnabled => {
            const isRunning = !!backupJob && cronEnabled !== false
            let nextRun = null

            if (isRunning && backupJob) {
                try {
                    const nextDate = backupJob.nextDate()
                    if (nextDate) {
                        // cron returns Luxon DateTime, convert to JS Date
                        nextRun = nextDate.toJSDate().toISOString()
                    }
                } catch (e) {
                    console.error('Error getting next date', e)
                }
            }

            return { isRunning, nextRun }
        },
    }
}

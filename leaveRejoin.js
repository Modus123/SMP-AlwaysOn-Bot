function setupLeaveRejoin(bot, createBot) {
    // Timers
    let leaveTimer = null
    let reconnectTimer = null
    let jumpInterval = null

    // State
    let stopped = false

    function cleanup() {
        stopped = true

        if (leaveTimer) clearTimeout(leaveTimer)
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (jumpInterval) clearInterval(jumpInterval)

        leaveTimer = null
        reconnectTimer = null
        jumpInterval = null
    }

    bot.once('spawn', () => {
        cleanup() // clear any previous timers
        stopped = false

        console.log('[AFK] Bot connected. Will leave in 2 minutes.')

        // OPTIONAL: Anti-AFK jumping every 30 seconds
        jumpInterval = setInterval(() => {
            if (bot.entity && !stopped) {
                bot.setControlState('jump', true)
                setTimeout(() => {
                    bot.setControlState('jump', false)
                }, 300)
            }
        }, 30000)

        // Stay connected for 2 minutes
        leaveTimer = setTimeout(() => {
            if (stopped) return

            console.log('[AFK] Leaving server...')
            cleanup()

            try {
                bot.quit()
            } catch (e) {
                console.log('[AFK] Quit error:', e?.message || e)
            }

            // Reconnect after 1 minute
            reconnectTimer = setTimeout(() => {
                if (stopped) return

                console.log('[AFK] Reconnecting...')
                try {
                    if (typeof createBot === 'function') {
                        createBot()
                    }
                } catch (e) {
                    console.log('[AFK] createBot error:', e?.message || e)
                }
            }, 60000) // 1 minute

        }, 120000) // 2 minutes
    })

    // Cleanup on any disconnect event
    bot.on('end', cleanup)
    bot.on('kicked', cleanup)
    bot.on('error', cleanup)
}

module.exports = setupLeaveRejoin

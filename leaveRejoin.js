function setupLeaveRejoin(bot, createBot) {
    // Timers
    let leaveTimer = null
    let reconnectTimer = null
    let jumpInterval = null

    // State
    let stopped = false
    let reconnectScheduled = false

    function cleanup() {
        stopped = true

        if (leaveTimer) clearTimeout(leaveTimer)
        if (jumpInterval) clearInterval(jumpInterval)

        leaveTimer = null
        jumpInterval = null
    }

    function scheduleReconnect(reason = 'unknown') {
        if (reconnectScheduled) return // prevent duplicates
        reconnectScheduled = true

        console.log(`[AFK] Reconnecting in 1 minute... (reason: ${reason})`)

        reconnectTimer = setTimeout(() => {
            reconnectScheduled = false
            stopped = false

            try {
                if (typeof createBot === 'function') {
                    createBot()
                }
            } catch (e) {
                console.log('[AFK] createBot error:', e?.message || e)

                // retry again if failed
                reconnectScheduled = false
                scheduleReconnect('retry-error')
            }
        }, 60000) // 1 minute
    }

    bot.once('spawn', () => {
        cleanup()
        stopped = false
        reconnectScheduled = false

        console.log('[AFK] Bot connected. Will leave in 2 minutes.')

        // Anti-AFK jump every 30s
        jumpInterval = setInterval(() => {
            if (bot.entity && !stopped) {
                bot.setControlState('jump', true)
                setTimeout(() => {
                    bot.setControlState('jump', false)
                }, 300)
            }
        }, 30000)

        // Stay for 2 minutes
        leaveTimer = setTimeout(() => {
            if (stopped) return

            console.log('[AFK] Leaving server (timer)...')
            cleanup()

            try {
                bot.quit()
            } catch (e) {}

            scheduleReconnect('cycle-leave')
        }, 120000) // 2 minutes
    })

    // 🔥 AUTO RECONNECT HANDLERS
    bot.on('end', () => {
        console.log('[AFK] Disconnected from server.')
        cleanup()
        scheduleReconnect('end')
    })

    bot.on('kicked', (reason) => {
        console.log('[AFK] Kicked from server:', reason)
        cleanup()
        scheduleReconnect('kicked')
    })

    bot.on('error', (err) => {
        console.log('[AFK] Error:', err?.message || err)
        cleanup()
        scheduleReconnect('error')
    })
}

module.exports = setupLeaveRejoin

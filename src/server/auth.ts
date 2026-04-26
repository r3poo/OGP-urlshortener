const sessions = new Map<string, number>()

export function NewSession(): string {
    const token = crypto.randomUUID()
    sessions.set(token, Date.now())
    return token
}


export function ValidateSession(token: string): boolean {
    return token==Bun.env.PRIV_TOKEN || sessions.has(token)
}


// remove all sessions older than 5 minutes
function CleanSessions() {
    const now = Date.now()
    for (const [token, time] of sessions) {
        if (now-time>300000) {
            sessions.delete(token)
        }
    }
}

// clean every 30 seconds
const cleanupSchedule = setInterval(CleanSessions, 30000)
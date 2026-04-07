const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(userId)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userRequests.count >= maxRequests) {
    return false
  }

  userRequests.count++
  return true
}

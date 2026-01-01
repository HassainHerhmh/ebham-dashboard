import { useEffect, useRef } from 'react'

interface UsePollingOptions {
  interval?: number
  enabled?: boolean
}

export const usePolling = (
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
) => {
  const { interval = 10000, enabled = true } = options
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const tick = async () => {
      await savedCallback.current()
    }

    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}

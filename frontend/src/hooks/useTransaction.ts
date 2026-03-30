import { useState, useEffect } from 'react'
import { stellarService } from '../services/stellar'

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'failed'

export interface UseTransactionResult {
  status: TransactionStatus
  data: Record<string, unknown> | null
  error: string | null
}

const POLL_INTERVAL_MS = 3_000
const TIMEOUT_MS = 60_000

export function useTransaction(transactionHash: string | null): UseTransactionResult {
  const [status, setStatus] = useState<TransactionStatus>('idle')
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transactionHash) return

    setStatus('pending')
    setData(null)
    setError(null)

    const startTime = Date.now()

    const intervalId = setInterval(async () => {
      if (Date.now() - startTime >= TIMEOUT_MS) {
        clearInterval(intervalId)
        setStatus('failed')
        setError('Timeout')
        return
      }

      try {
        const result = await stellarService.getTransaction(transactionHash)
        const txStatus = (result?.status as string | undefined)?.toUpperCase()

        if (txStatus === 'SUCCESS') {
          clearInterval(intervalId)
          setData(result)
          setStatus('success')
        } else if (txStatus === 'FAILED') {
          clearInterval(intervalId)
          setData(result)
          setError((result?.result_xdr as string) ?? 'Transaction failed')
          setStatus('failed')
        }
        // any other status (e.g. pending / not found) → keep polling
      } catch {
        // transient network error — keep polling until timeout
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [transactionHash])

  return { status, data, error }
}

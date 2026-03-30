import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { TransactionStatus } from './TransactionStatus'
import { stellarService } from '../services/stellar'

vi.mock('../services/stellar', () => ({
  stellarService: { getTransaction: vi.fn() },
}))

vi.mock('../context/NetworkContext', () => ({
  useNetwork: vi.fn(() => ({ network: 'testnet' })),
}))

import { useNetwork } from '../context/NetworkContext'

describe('TransactionStatus Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    ;(useNetwork as Mock).mockReturnValue({ network: 'testnet' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders pending state initially', () => {
    ;(stellarService.getTransaction as Mock).mockResolvedValue({ status: 'pending' })
    render(<TransactionStatus txHash="test-hash" />)
    expect(screen.getByText('Transaction pending...')).toBeInTheDocument()
  })

  test('shows success state with explorer link', async () => {
    const onSuccess = vi.fn()
    ;(stellarService.getTransaction as Mock).mockResolvedValue({ status: 'SUCCESS' })

    render(<TransactionStatus txHash="test-hash" onSuccess={onSuccess} />)

    await vi.waitFor(() => {
      expect(screen.getByText('Transaction Successful')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /view on stellar expert/i })
    expect(link).toHaveAttribute('href', 'https://stellar.expert/explorer/testnet/tx/test-hash')
    expect(onSuccess).toHaveBeenCalled()
  })

  test('shows failed state with error message and explorer link', async () => {
    const onError = vi.fn()
    ;(stellarService.getTransaction as Mock).mockResolvedValue({
      status: 'FAILED',
      result_xdr: 'Insufficient funds',
    })

    render(<TransactionStatus txHash="test-hash" onError={onError} />)

    await vi.waitFor(() => {
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Insufficient funds')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view on stellar expert/i })
    expect(link).toHaveAttribute('href', 'https://stellar.expert/explorer/testnet/tx/test-hash')
    expect(onError).toHaveBeenCalledWith('Insufficient funds')
  })

  test('uses mainnet explorer URL when on mainnet', async () => {
    ;(useNetwork as Mock).mockReturnValue({ network: 'mainnet' })
    ;(stellarService.getTransaction as Mock).mockResolvedValue({ status: 'SUCCESS' })

    render(<TransactionStatus txHash="test-hash" />)

    await vi.waitFor(() => {
      expect(screen.getByText('Transaction Successful')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /view on stellar expert/i })
    expect(link).toHaveAttribute('href', 'https://stellar.expert/explorer/public/tx/test-hash')
  })

  test('shows timeout error after 60 seconds', async () => {
    const onError = vi.fn()
    ;(stellarService.getTransaction as Mock).mockResolvedValue({ status: 'pending' })

    render(<TransactionStatus txHash="test-hash" onError={onError} />)

    await vi.waitFor(
      () => {
        vi.advanceTimersByTime(60000)
        expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(onError).toHaveBeenCalledWith('Timeout')
  })
})

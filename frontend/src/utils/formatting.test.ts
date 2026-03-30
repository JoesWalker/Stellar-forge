import { describe, it, expect } from 'vitest'
import {
  truncateAddress,
  formatAddress,
  stroopsToXLM,
  xlmToStroops,
  ipfsToGatewayUrl,
  stellarExplorerUrl,
} from './formatting'

describe('truncateAddress', () => {
  const ADDR = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  it('truncates a long address with defaults', () => {
    expect(truncateAddress(ADDR)).toBe('GABCDE...WXYZ')
  })

  it('returns address unchanged when shorter than prefix + suffix', () => {
    expect(truncateAddress('GABCD', 6, 4)).toBe('GABCD')
  })

  it('respects custom startChars and endChars', () => {
    expect(truncateAddress('GABCDEFGHIJ', 3, 3)).toBe('GAB...HIJ')
  })
})

describe('formatAddress', () => {
  const ADDR = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'

  it('truncates with default prefix/suffix', () => {
    expect(formatAddress(ADDR)).toBe('GAAZI4...CCWN')
  })

  it('returns empty string for empty input', () => {
    expect(formatAddress('')).toBe('')
  })

  it('returns address unchanged when shorter than prefix + suffix', () => {
    expect(formatAddress('GABCD', 6, 4)).toBe('GABCD')
  })

  it('respects custom prefixLen and suffixLen', () => {
    expect(formatAddress(ADDR, 4, 4)).toBe('GAAZ...CCWN')
  })
})

describe('stroopsToXLM', () => {
  it('converts 10000000 stroops to 1 XLM', () => {
    expect(stroopsToXLM(10000000)).toBe(1)
  })

  it('handles string input', () => {
    expect(stroopsToXLM('5000000')).toBe(0.5)
  })

  it('handles zero', () => {
    expect(stroopsToXLM(0)).toBe(0)
  })
})

describe('xlmToStroops', () => {
  it('converts 1 XLM to 10000000 stroops', () => {
    expect(xlmToStroops(1)).toBe(10000000)
  })

  it('floors fractional stroops', () => {
    expect(xlmToStroops('0.00000001')).toBe(0)
  })

  it('handles zero', () => {
    expect(xlmToStroops(0)).toBe(0)
  })
})

describe('ipfsToGatewayUrl', () => {
  it('converts ipfs:// URI to pinata gateway URL', () => {
    expect(ipfsToGatewayUrl('ipfs://QmXxx')).toBe('https://gateway.pinata.cloud/ipfs/QmXxx')
  })

  it('returns non-IPFS URIs unchanged', () => {
    expect(ipfsToGatewayUrl('https://example.com/file.json')).toBe('https://example.com/file.json')
  })
})

describe('stellarExplorerUrl', () => {
  it('builds a testnet tx link', () => {
    expect(stellarExplorerUrl('tx', 'abc123', 'testnet')).toBe(
      'https://stellar.expert/explorer/testnet/tx/abc123',
    )
  })

  it('builds a mainnet account link', () => {
    expect(stellarExplorerUrl('account', 'GABC', 'mainnet')).toBe(
      'https://stellar.expert/explorer/public/account/GABC',
    )
  })

  it('builds a contract link', () => {
    expect(stellarExplorerUrl('contract', 'CABC', 'testnet')).toBe(
      'https://stellar.expert/explorer/testnet/contract/CABC',
    )
  })

  it('defaults to testnet', () => {
    expect(stellarExplorerUrl('tx', 'xyz')).toContain('testnet')
  })
})

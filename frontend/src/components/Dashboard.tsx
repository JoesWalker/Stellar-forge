import { useState, useMemo, useCallback, memo } from 'react'
import type { SortOrder } from '../types'
import { applyFilters } from '../utils/tokenFilters'
import { useDebounce } from '../hooks/useDebounce'
import { useTokenDashboard } from '../hooks/useTokenDashboard'
import { Input } from './UI/Input'
import { Card } from './UI/Card'
import { TokenCardSkeleton } from './UI/Skeleton'
import { TokenCard } from './TokenCard'
import { PaginationControls } from './UI/PaginationControls'

interface DashboardProps {
  tokens?: never // legacy prop — data is now fetched internally
}

/**
 * Memoized with React.memo — re-renders only when the tokens prop changes.
 * Internal filter/sort state changes are isolated here and don't propagate upward.
 *
 * filteredTokens is wrapped in useMemo so the applyFilters computation only
 * re-runs when tokens, search, creator, or sort actually change.
 *
 * Event handlers are wrapped in useCallback so their references stay stable
 * across renders, which is important if they are ever passed to memoized children.
 */
const Dashboard: React.FC<DashboardProps> = memo(() => {
  const { rows, isLoading, error, page, totalPages, setPage, refresh } = useTokenDashboard()

  const [searchQuery, setSearchQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const debouncedSearch = useDebounce(searchQuery, 300)
  const debouncedCreator = useDebounce(creatorFilter, 300)

  // Expensive filter + sort — only recomputes when inputs change
  const filteredTokens = useMemo(
    () => applyFilters(rows, debouncedSearch, debouncedCreator, sortOrder),
    [rows, debouncedSearch, debouncedCreator, sortOrder],
  )

  const isFilterActive = debouncedSearch !== '' || debouncedCreator !== ''

  // Stable callback references so child inputs don't re-render unnecessarily
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleCreatorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreatorFilter(e.target.value)
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as SortOrder)
  }, [])

  return (
    <div className="space-y-4">
      {/* FilterBar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Search by name or symbol"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Filter by creator address"
            value={creatorFilter}
            onChange={handleCreatorChange}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort order
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={handleSortChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          aria-label="Refresh token list"
          className="self-end px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
        >
          ↺ Refresh
        </button>
      </div>

      {error && (
        <Card>
          <p role="alert" className="text-red-600 dark:text-red-400 text-sm">{error.message}</p>
        </Card>
      )}

      {isLoading ? (
        <ul className="space-y-3" aria-label="Loading tokens" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </ul>
      ) : filteredTokens.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {isFilterActive
            ? 'No tokens match your search.'
            : 'No tokens have been deployed yet.'}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {filteredTokens.map((token) => (
              <TokenCard key={token.address} token={token} />
            ))}
          </ul>
          {totalPages > 1 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export { Dashboard }

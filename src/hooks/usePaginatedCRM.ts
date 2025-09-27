export const usePaginatedCRM = () => ({
  clients: [],
  loading: false,
  loadingMore: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  hasMore: false,
  loadMore: () => {},
  searchTerm: '',
  setSearchTerm: () => {},
  filters: {},
  setFilters: () => {},
  sortBy: 'name',
  setSortBy: () => {},
  createClient: () => Promise.resolve(),
  activeClients: [],
  newLeads: []
})
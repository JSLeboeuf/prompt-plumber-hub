import { useState, useMemo } from "react";

interface FilterConfig<T> {
  searchFields: (keyof T)[];
  defaultFilter?: string;
}

export function useFilters<T extends Record<string, unknown>>(
  items: T[],
  config: FilterConfig<T>
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(config.defaultFilter || "tous");

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = config.searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });

      // Status filter
      const matchesStatus = statusFilter === "tous" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter, config.searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredItems
  };
}
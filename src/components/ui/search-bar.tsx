import { useState, useCallback, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchFilter {
  key: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
}

interface AdvancedSearchBarProps {
  placeholder?: string;
  onSearch: (query: string, filters: Record<string, string[]>) => void;
  filters?: SearchFilter[];
  className?: string;
}

export function AdvancedSearchBar({
  placeholder = "Rechercher...",
  onSearch,
  filters = [],
  className = ""
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Trigger search when query or filters change
  const triggerSearch = useCallback(() => {
    onSearch(debouncedQuery, selectedFilters);
  }, [debouncedQuery, selectedFilters, onSearch]);

  // Update search when debounced query changes
  useEffect(() => {
    triggerSearch();
  }, [triggerSearch]);

  const clearSearch = () => {
    setQuery("");
    setSelectedFilters({});
  };

  const toggleFilter = (filterKey: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[filterKey] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return updated.length > 0
        ? { ...prev, [filterKey]: updated }
        : { ...prev, [filterKey]: [] };
    });
  };

  const removeFilter = (filterKey: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: (prev[filterKey] || []).filter(v => v !== value)
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).flat().length;
  };

  const getActiveFilterBadges = () => {
    const badges = [] as Array<{ filterKey: string; value: string; label: string }>;
    
    Object.entries(selectedFilters).forEach(([filterKey, values]) => {
      const filter = filters.find(f => f.key === filterKey);
      if (filter) {
        values.forEach(value => {
          const option = filter.options.find(o => o.value === value);
          if (option) {
            badges.push({
              filterKey,
              value,
              label: `${filter.label}: ${option.label}`
            });
          }
        });
      }
    });
    
    return badges;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {(query || getActiveFiltersCount() > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {filters.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 relative"
                >
                  <Filter className="h-3 w-3" />
                  {getActiveFiltersCount() > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtres</h4>
                  
                  {filters.map(filter => (
                    <div key={filter.key} className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        {filter.label}
                      </h5>
                      <div className="space-y-2">
                        {filter.options.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${filter.key}-${option.value}`}
                              checked={(selectedFilters[filter.key] || []).includes(option.value)}
                              onCheckedChange={() => toggleFilter(filter.key, option.value)}
                            />
                            <label
                              htmlFor={`${filter.key}-${option.value}`}
                              className="text-sm flex-1 cursor-pointer"
                            >
                              {option.label}
                              {option.count !== undefined && (
                                <span className="text-muted-foreground ml-1">
                                  ({option.count})
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {getActiveFilterBadges().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilterBadges().map(({ filterKey, value, label }) => (
            <Badge
              key={`${filterKey}-${value}`}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filterKey, value)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
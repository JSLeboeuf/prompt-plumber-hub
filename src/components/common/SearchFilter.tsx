import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchFilter = ({
  searchTerm,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  placeholder = "Rechercher...",
  className = ""
}: SearchFilterProps) => {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {filters && onFilterChange && (
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <Button 
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
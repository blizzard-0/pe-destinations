type FilterName = "region" | "costLevel";

// An empty value means the API default (name, A–Z), which keeps the URL clean.
const SORT_OPTIONS = [
  { value: "", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "budget-asc", label: "Daily budget (low to high)" },
  { value: "budget-desc", label: "Daily budget (high to low)" },
  { value: "costLevel-asc", label: "Cost level (low to high)" },
  { value: "costLevel-desc", label: "Cost level (high to low)" },
  { value: "visitors-desc", label: "Most visited" },
  { value: "visitors-asc", label: "Least visited" },
];

type DestinationFiltersProps = {
  searchTerm: string;
  region: string;
  costLevel: string;
  sort: string;
  regions: string[];
  costLevels: readonly string[];
  onSearchChange: (value: string) => void;
  onFilterChange: (name: FilterName, value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
};

const labelClass = "text-sm font-medium text-gray-700";
const controlClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

const DestinationFilters = ({
  searchTerm,
  region,
  costLevel,
  sort,
  regions,
  costLevels,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onReset,
}: DestinationFiltersProps) => (
  <form
    role="search"
    className="flex flex-wrap items-end gap-4"
    onSubmit={(e) => e.preventDefault()}
  >
    <div className="flex flex-col gap-1">
      <label htmlFor="search" className={labelClass}>
        Search
      </label>
      <input
        id="search"
        type="search"
        placeholder="Name, country, region or activity"
        className={`w-72 ${controlClass}`}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>

    <div className="flex flex-col gap-1">
      <label htmlFor="region" className={labelClass}>
        Region
      </label>
      <select
        id="region"
        className={controlClass}
        value={region}
        onChange={(e) => onFilterChange("region", e.target.value)}
      >
        <option value="">All regions</option>
        {regions.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1">
      <label htmlFor="cost-level" className={labelClass}>
        Cost level
      </label>
      <select
        id="cost-level"
        className={controlClass}
        value={costLevel}
        onChange={(e) => onFilterChange("costLevel", e.target.value)}
      >
        <option value="">Any cost level</option>
        {costLevels.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1">
      <label htmlFor="sort" className={labelClass}>
        Sort by
      </label>
      <select
        id="sort"
        className={controlClass}
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>

    <button
      type="button"
      onClick={onReset}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
    >
      Clear filters
    </button>
  </form>
);

export { DestinationFilters };

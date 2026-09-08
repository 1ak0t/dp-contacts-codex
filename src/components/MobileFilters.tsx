import type { ColumnKey,SortConfig } from "../types";
import { columns,filterColumns } from "../employeeConfig";
type Props={
  sortConfig: SortConfig;
  setSortConfig: (value: SortConfig) => void;
  filters: Record<ColumnKey,string>;
  updateFilter: (key: ColumnKey,value: string) => void;
  filterOptions: Record<ColumnKey,string[]>;
};

export default function MobileFilters({ sortConfig,setSortConfig,filters,updateFilter,filterOptions }: Props) {
  return (
    <div className="mobileControls" aria-label="Фильтры и сортировка">
      <label className="mobileControl">
        <span>Сортировка</span>
        <select
          value={`${sortConfig.key}:${sortConfig.direction}`}
          onChange={(event) => {
            const [key,direction]=event.target.value.split(":") as [ColumnKey,SortConfig["direction"]];
            setSortConfig({ key,direction });
          }}
        >
          {columns.flatMap((column) => [
            <option value={`${column.key}:asc`} key={`${column.key}:asc`}>
              {column.label}: А-Я
            </option>,
            <option value={`${column.key}:desc`} key={`${column.key}:desc`}>
              {column.label}: Я-А
            </option>,
          ])}
        </select>
      </label>

      {filterColumns.map((column) => (
        <label className="mobileControl" key={column.key}>
          <span>{column.label}</span>
          <select value={filters[column.key]} onChange={(event) => updateFilter(column.key,event.target.value)}>
            <option value="">Все</option>
            {filterOptions[column.key].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

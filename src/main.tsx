import React from "react";
import { createRoot } from "react-dom/client";
import csvText from "../дп-данные.csv?raw";
import "./styles.css";

type Employee = Record<string, string>;

type ColumnKey = "op" | "fio" | "phoneNumber" | "email";

type SortConfig = {
  key: ColumnKey;
  direction: "asc" | "desc";
};

const columns: Array<{ key: ColumnKey; label: string }> = [
  { key: "op", label: "ОП" },
  { key: "fio", label: "ФИО" },
  { key: "phoneNumber", label: "Телефон" },
  { key: "email", label: "E-Mail" },
];

const detailLabels: Record<string, string> = {
  fio: "ФИО",
  op: "ОП",
  orgUnit: "Подразделение",
  jobTitle: "Должность",
  phoneNumber: "Телефон",
  persEmail: "Личный E-Mail",
  jobType: "Форма занятости",
  email: "E-Mail",
};

function getEmployeeEmail(employee: Employee): string {
  return employee.email || employee.persEmail || "";
}

function getColumnValue(employee: Employee, key: ColumnKey): string {
  return key === "email" ? getEmployeeEmail(employee) : employee[key] || "";
}

function parseCsv(text: string): Employee[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    headers.reduce<Employee>((employee, header, index) => {
      employee[header] = dataRow[index] ?? "";
      return employee;
    }, {}),
  );
}

const employees = parseCsv(csvText);

function uniqueValues(data: Employee[], key: ColumnKey): string[] {
  return Array.from(new Set(data.map((item) => getColumnValue(item, key)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru", { sensitivity: "base" }),
  );
}

function App() {
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<ColumnKey, string>>({
    op: "",
    fio: "",
    phoneNumber: "",
    email: "",
  });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: "fio", direction: "asc" });
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [copiedEmail, setCopiedEmail] = React.useState("");
  const [copiedPhone, setCopiedPhone] = React.useState("");

  const filterOptions = React.useMemo(
    () =>
      columns.reduce<Record<ColumnKey, string[]>>((options, column) => {
        options[column.key] = uniqueValues(employees, column.key);
        return options;
      }, {} as Record<ColumnKey, string[]>),
    [],
  );

  const visibleEmployees = React.useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ru");

    return employees
      .filter((employee) =>
        columns.every((column) => !filters[column.key] || getColumnValue(employee, column.key) === filters[column.key]),
      )
      .filter((employee) => {
        if (!normalizedSearch) {
          return true;
        }

        return columns.some((column) =>
          getColumnValue(employee, column.key).toLocaleLowerCase("ru").includes(normalizedSearch),
        );
      })
      .sort((first, second) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;
        return (
          direction *
          getColumnValue(first, sortConfig.key).localeCompare(getColumnValue(second, sortConfig.key), "ru", {
            numeric: true,
            sensitivity: "base",
          })
        );
      });
  }, [filters, search, sortConfig]);

  const copyEmail = async (email: string) => {
    if (!email) {
      return;
    }

    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    window.setTimeout(() => setCopiedEmail((current) => (current === email ? "" : current)), 1600);
  };

  const copyPhone = async (phone: string) => {
    if (!phone) {
      return;
    }

    await navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    window.setTimeout(() => setCopiedPhone((current) => (current === phone ? "" : current)), 1600);
  };

  const handleSort = (key: ColumnKey) => {
    setSortConfig((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const updateFilter = (key: ColumnKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="page">
      <section className="tablePane" aria-label="Контакты сотрудников">
        <div className="tableToolbar">
          <input
            className="searchInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по таблице"
            type="search"
          />
          <span className="resultCount">{visibleEmployees.length} из {employees.length}</span>
        </div>

        <div className="mobileControls" aria-label="Фильтры и сортировка">
          <label className="mobileControl">
            <span>Сортировка</span>
            <select
              value={`${sortConfig.key}:${sortConfig.direction}`}
              onChange={(event) => {
                const [key, direction] = event.target.value.split(":") as [ColumnKey, SortConfig["direction"]];
                setSortConfig({ key, direction });
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

          {columns.map((column) => (
            <label className="mobileControl" key={column.key}>
              <span>{column.label}</span>
              <select value={filters[column.key]} onChange={(event) => updateFilter(column.key, event.target.value)}>
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

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    <button className="sortButton" type="button" onClick={() => handleSort(column.key)}>
                      <span>{column.label}</span>
                      <span className="sortIndicator">
                        {sortConfig.key === column.key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                    <select
                      aria-label={`Фильтр: ${column.label}`}
                      value={filters[column.key]}
                      onChange={(event) => updateFilter(column.key, event.target.value)}
                    >
                      <option value="">Все</option>
                      {filterOptions[column.key].map((value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((employee, index) => {
                const isSelected = selectedEmployee === employee;
                return (
                  <tr
                    className={isSelected ? "selected" : undefined}
                    key={`${employee.fio}-${employee.phoneNumber}-${index}`}
                    onClick={() => setSelectedEmployee(employee)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedEmployee(employee);
                      }
                    }}
                  >
                    {columns.map((column) => {
                      const value = getColumnValue(employee, column.key);
                      return (
                        <td data-label={column.label} key={column.key}>
                          {column.key === "email" && value ? (
                            <div className="emailCell">
                              <a
                                aria-label={`Написать на ${value}`}
                                className="writeLink"
                                href={`mailto:${value}`}
                                onClick={(event) => event.stopPropagation()}
                                title="Написать"
                              >
                                <svg aria-hidden="true" viewBox="0 0 24 24">
                                  <path d="M4.75 6.75h14.5v10.5H4.75V6.75Z" />
                                  <path d="m5.25 7.25 5.97 5.22a1.2 1.2 0 0 0 1.56 0l5.97-5.22" />
                                </svg>
                              </a>
                              <button
                                className="emailCopyButton"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void copyEmail(value);
                                }}
                              >
                                {value}
                              </button>
                              {copiedEmail === value && <span className="copyStatus">Скопировано</span>}
                            </div>
                          ) : column.key === "phoneNumber" && value ? (
                            <div className="copyCell">
                              <button
                                className="inlineCopyButton"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void copyPhone(value);
                                }}
                              >
                                {value}
                              </button>
                              {copiedPhone === value && <span className="copyStatus">Скопировано</span>}
                            </div>
                          ) : (
                            value || "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="detailsPane" aria-label="Детальная информация">
        <h2>Детальная информация</h2>
        {selectedEmployee ? (
          <dl>
            {Object.entries(selectedEmployee).map(([key, value]) => (
              <div className="detailRow" key={key}>
                <dt>{detailLabels[key] ?? key}</dt>
                <dd>{value || "-"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="emptyDetails">Нажмите на сотрудника для получения подробной информации</p>
        )}
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

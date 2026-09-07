import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Employee = Record<string, string>;

type ColumnKey = "op" | "fio" | "phoneNumber" | "email";

type SortConfig = {
  key: ColumnKey;
  direction: "asc" | "desc";
};

type AuthUser = {
  id: string;
  login: string;
};

type EmployeeForm = {
  fio: string;
  op: string;
  orgUnit: string;
  jobTitle: string;
  phoneNumber: string;
  persEmail: string;
  jobType: string;
  email: string;
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

const employeeFormLabels: Record<keyof EmployeeForm, string> = {
  fio: "ФИО",
  op: "ОП",
  orgUnit: "Подразделение",
  jobTitle: "Должность",
  phoneNumber: "Телефон",
  persEmail: "Личный E-Mail",
  jobType: "Форма занятости",
  email: "E-Mail",
};

const employeeFormFields: Array<keyof EmployeeForm> = [
  "fio",
  "op",
  "orgUnit",
  "jobTitle",
  "phoneNumber",
  "persEmail",
  "jobType",
  "email",
];
const requiredEmployeeFields: Array<keyof EmployeeForm> = ["fio", "op", "orgUnit", "jobTitle", "phoneNumber", "jobType"];
const emptyEmployeeForm: EmployeeForm = {
  fio: "",
  op: "",
  orgUnit: "",
  jobTitle: "",
  phoneNumber: "",
  persEmail: "",
  jobType: "",
  email: "",
};
const phoneRegex = /^\+7\d{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";
const authTokenKey = "dp_contacts_auth_token";

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits[0] === "8" ? `7${digits.slice(1)}` : digits;
  const withoutCountry = normalizedDigits.startsWith("7") ? normalizedDigits.slice(1, 11) : normalizedDigits.slice(0, 10);

  return `+7${withoutCountry}`;
}

function formatPhone(value: string): string {
  const normalizedPhone = normalizePhone(value);
  const digits = normalizedPhone.slice(2);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);

  return parts.length > 0 ? `+7-${parts.join("-")}` : normalizedPhone;
}

function getEmployeeForm(employee: Employee): EmployeeForm {
  return employeeFormFields.reduce<EmployeeForm>((form, field) => {
    form[field] = field === "phoneNumber" ? formatPhone(employee[field] || "") : employee[field] || "";
    return form;
  }, { ...emptyEmployeeForm });
}

function getEmployeeEmail(employee: Employee): string {
  return employee.email || employee.persEmail || "";
}

function getColumnValue(employee: Employee, key: ColumnKey): string {
  return key === "email" ? getEmployeeEmail(employee) : employee[key] || "";
}

function uniqueValues(data: Employee[], key: ColumnKey): string[] {
  return Array.from(new Set(data.map((item) => getColumnValue(item, key)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru", { sensitivity: "base" }),
  );
}

function App() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = React.useState(true);
  const [employeesError, setEmployeesError] = React.useState("");
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
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = React.useState(() => localStorage.getItem(authTokenKey) ?? "");
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [authLogin, setAuthLogin] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = React.useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = React.useState<EmployeeForm>(emptyEmployeeForm);
  const [employeeFormError, setEmployeeFormError] = React.useState("");
  const [isEmployeeSaving, setIsEmployeeSaving] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");
  const [isEmployeeDeleting, setIsEmployeeDeleting] = React.useState(false);

  const employeeFieldErrors = React.useMemo<Partial<Record<keyof EmployeeForm, string>>>(() => {
    const errors: Partial<Record<keyof EmployeeForm, string>> = {};
    const phone = normalizePhone(employeeForm.phoneNumber);

    if (employeeForm.phoneNumber && !phoneRegex.test(phone)) {
      errors.phoneNumber = "Формат: +7-xxx-xxx-xx-xx";
    }

    if (employeeForm.email && !emailRegex.test(employeeForm.email.trim())) {
      errors.email = "Некорректный E-Mail";
    }

    if (employeeForm.persEmail && !emailRegex.test(employeeForm.persEmail.trim())) {
      errors.persEmail = "Некорректный E-Mail";
    }

    return errors;
  }, [employeeForm]);

  const filterOptions = React.useMemo(
    () =>
      columns.reduce<Record<ColumnKey, string[]>>((options, column) => {
        options[column.key] = uniqueValues(employees, column.key);
        return options;
      }, {} as Record<ColumnKey, string[]>),
    [employees],
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
  }, [employees, filters, search, sortConfig]);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      setEmployeesError("");
      setIsEmployeesLoading(true);

      try {
        const response = await fetch(`${apiUrl}/contacts`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { employees?: Employee[]; message?: string };

        if (!response.ok || !Array.isArray(data.employees)) {
          throw new Error(data.message || "Не удалось загрузить контакты");
        }

        setEmployees(data.employees);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setEmployeesError(error instanceof Error ? error.message : "Не удалось загрузить контакты");
        setEmployees([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsEmployeesLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!authToken) {
      return;
    }

    const controller = new AbortController();

    fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Сессия истекла");
        }

        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then((data) => setAuthUser(data.user))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        localStorage.removeItem(authTokenKey);
        setAuthToken("");
        setAuthUser(null);
      });

    return () => controller.abort();
  }, [authToken]);

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

  const updateEmployeeForm = (key: keyof EmployeeForm, value: string) => {
    setEmployeeForm((current) => ({
      ...current,
      [key]: key === "phoneNumber" ? formatPhone(value) : value,
    }));
    setEmployeeFormError("");
  };

  const resetEmployeeForm = () => {
    setEmployeeForm(emptyEmployeeForm);
    setEmployeeFormError("");
    setIsEmployeeSaving(false);
  };

  const openAddEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeForm(emptyEmployeeForm);
    setEmployeeFormError("");
    setIsAddEmployeeOpen(true);
  };

  const openEditEmployeeModal = (employee: Employee) => {
    setIsAddEmployeeOpen(false);
    setEditingEmployee(employee);
    setEmployeeForm(getEmployeeForm(employee));
    setEmployeeFormError("");
  };

  const closeEmployeeModal = () => {
    setIsAddEmployeeOpen(false);
    setEditingEmployee(null);
    resetEmployeeForm();
  };

  const openDeleteEmployeeModal = (employee: Employee) => {
    setDeletingEmployee(employee);
    setDeleteError("");
  };

  const closeDeleteEmployeeModal = () => {
    setDeletingEmployee(null);
    setDeleteError("");
    setIsEmployeeDeleting(false);
  };

  const validateEmployeeForm = (): string => {
    for (const field of requiredEmployeeFields) {
      if (!employeeForm[field].trim()) {
        return `Поле "${employeeFormLabels[field]}" обязательно`;
      }
    }

    if (!phoneRegex.test(normalizePhone(employeeForm.phoneNumber))) {
      return "Телефон должен быть в формате +7-xxx-xxx-xx-xx";
    }

    if (employeeForm.email.trim() && !emailRegex.test(employeeForm.email.trim())) {
      return "E-Mail указан некорректно";
    }

    if (employeeForm.persEmail.trim() && !emailRegex.test(employeeForm.persEmail.trim())) {
      return "Личный E-Mail указан некорректно";
    }

    return "";
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: authLogin,
          password: authPassword,
        }),
      });
      const data = (await response.json()) as { token?: string; user?: AuthUser; message?: string };

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.message || "Не удалось авторизоваться");
      }

      localStorage.setItem(authTokenKey, data.token);
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthLogin("");
      setAuthPassword("");
      setIsAuthOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Не удалось авторизоваться");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).catch(() => undefined);
    }

    localStorage.removeItem(authTokenKey);
    setAuthToken("");
    setAuthUser(null);
  };

  const handleSaveEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateEmployeeForm();

    if (validationError) {
      setEmployeeFormError(validationError);
      return;
    }

    setEmployeeFormError("");
    setIsEmployeeSaving(true);

    try {
      const isEditMode = Boolean(editingEmployee);
      const response = await fetch(`${apiUrl}/contacts${isEditMode ? `/${editingEmployee?.id}` : ""}`, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          employeeFormFields.reduce<EmployeeForm>((payload, field) => {
            payload[field] = field === "phoneNumber" ? normalizePhone(employeeForm.phoneNumber) : employeeForm[field].trim();
            return payload;
          }, {} as EmployeeForm),
        ),
      });
      const data = (await response.json()) as { employee?: Employee; message?: string; errors?: string[] };

      if (!response.ok || !data.employee) {
        throw new Error(data.errors?.[0] || data.message || "Не удалось сохранить сотрудника");
      }

      if (isEditMode) {
        setEmployees((current) => current.map((employee) => (employee.id === data.employee!.id ? data.employee! : employee)));
      } else {
        setEmployees((current) => [...current, data.employee!]);
      }

      setSelectedEmployee(data.employee);
      closeEmployeeModal();
    } catch (error) {
      setEmployeeFormError(error instanceof Error ? error.message : "Не удалось сохранить сотрудника");
    } finally {
      setIsEmployeeSaving(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee?.id) {
      setDeleteError("Не удалось определить сотрудника");
      return;
    }

    setDeleteError("");
    setIsEmployeeDeleting(true);

    try {
      const response = await fetch(`${apiUrl}/contacts/${deletingEmployee.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Не удалось удалить сотрудника");
      }

      setEmployees((current) => current.filter((employee) => employee.id !== deletingEmployee.id));
      setSelectedEmployee((current) => (current?.id === deletingEmployee.id ? null : current));
      closeDeleteEmployeeModal();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Не удалось удалить сотрудника");
    } finally {
      setIsEmployeeDeleting(false);
    }
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
          <span className="resultCount">
            {isEmployeesLoading ? "Загрузка..." : `${visibleEmployees.length} из ${employees.length}`}
          </span>
          <div className="authArea">
            {authUser ? (
              <>
                <button className="authButton" type="button" onClick={openAddEmployeeModal}>
                  Добавить сотрудника
                </button>
                <span className="authUser">{authUser.login}</span>
                <button className="authButton authButtonSecondary" type="button" onClick={() => void handleLogout()}>
                  Выйти
                </button>
              </>
            ) : (
              <button className="authButton" type="button" onClick={() => setIsAuthOpen(true)}>
                Авторизоваться
              </button>
            )}
          </div>
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
              {employeesError && (
                <tr>
                  <td className="stateCell" colSpan={columns.length}>
                    {employeesError}
                  </td>
                </tr>
              )}
              {!employeesError && isEmployeesLoading && (
                <tr>
                  <td className="stateCell" colSpan={columns.length}>
                    Загрузка контактов...
                  </td>
                </tr>
              )}
              {!employeesError && !isEmployeesLoading && visibleEmployees.length === 0 && (
                <tr>
                  <td className="stateCell" colSpan={columns.length}>
                    Контакты не найдены
                  </td>
                </tr>
              )}
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
          <>
            <dl>
              {Object.entries(selectedEmployee)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => (
                  <div className="detailRow" key={key}>
                    <dt>{detailLabels[key] ?? key}</dt>
                    <dd>{value || "-"}</dd>
                  </div>
                ))}
            </dl>
            {authUser && (
              <div className="detailsActions">
                <button className="authButton" type="button" onClick={() => openEditEmployeeModal(selectedEmployee)}>
                  Редактировать
                </button>
                <button className="dangerButton" type="button" onClick={() => openDeleteEmployeeModal(selectedEmployee)}>
                  Удалить
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="emptyDetails">Нажмите на сотрудника для получения подробной информации</p>
        )}
      </aside>

      {isAuthOpen && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setIsAuthOpen(false)}>
          <form className="authModal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleLogin}>
            <div className="modalHeader">
              <h2>Авторизация</h2>
              <button
                aria-label="Закрыть форму авторизации"
                className="closeButton"
                type="button"
                onClick={() => setIsAuthOpen(false)}
              >
                ×
              </button>
            </div>

            <label className="authField">
              <span>Логин</span>
              <input
                autoComplete="username"
                autoFocus
                value={authLogin}
                onChange={(event) => setAuthLogin(event.target.value)}
                required
                type="text"
              />
            </label>

            <label className="authField">
              <span>Пароль</span>
              <input
                autoComplete="current-password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                required
                type="password"
              />
            </label>

            {authError && <p className="authError">{authError}</p>}

            <button className="submitButton" disabled={isAuthLoading} type="submit">
              {isAuthLoading ? "Проверка..." : "Войти"}
            </button>
          </form>
        </div>
      )}

      {(isAddEmployeeOpen || editingEmployee) && (
        <div className="modalBackdrop" role="presentation" onMouseDown={closeEmployeeModal}>
          <form className="authModal employeeModal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSaveEmployee}>
            <div className="modalHeader">
              <h2>{editingEmployee ? "Редактировать сотрудника" : "Добавить сотрудника"}</h2>
              <button
                aria-label="Закрыть форму сотрудника"
                className="closeButton"
                type="button"
                onClick={closeEmployeeModal}
              >
                ×
              </button>
            </div>

            <div className="employeeFormGrid">
              {employeeFormFields.map((field) => (
                <label className="authField" key={field}>
                  <span>
                    {employeeFormLabels[field]}
                    {requiredEmployeeFields.includes(field) && <strong className="requiredMark">*</strong>}
                  </span>
                  {field === "op" ? (
                    <select
                      value={employeeForm.op}
                      onChange={(event) => updateEmployeeForm("op", event.target.value)}
                      required
                    >
                      <option value="">Выберите ОП</option>
                      {filterOptions.op.map((value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-invalid={Boolean(employeeFieldErrors[field])}
                      inputMode={field === "phoneNumber" ? "tel" : undefined}
                      onChange={(event) => updateEmployeeForm(field, event.target.value)}
                      pattern={field === "phoneNumber" ? "\\+7-\\d{3}-\\d{3}-\\d{2}-\\d{2}" : undefined}
                      placeholder={
                        field === "phoneNumber"
                          ? "+71234567891"
                          : field === "email" || field === "persEmail"
                            ? "example@mail.ru"
                            : undefined
                      }
                      required={requiredEmployeeFields.includes(field)}
                      type={field === "email" || field === "persEmail" ? "email" : "text"}
                      value={employeeForm[field]}
                    />
                  )}
                  {employeeFieldErrors[field] && <em className="fieldError">{employeeFieldErrors[field]}</em>}
                </label>
              ))}
            </div>

            {employeeFormError && <p className="authError">{employeeFormError}</p>}

            <button className="submitButton" disabled={isEmployeeSaving} type="submit">
              {isEmployeeSaving ? "Сохранение..." : editingEmployee ? "Сохранить" : "Добавить"}
            </button>
          </form>
        </div>
      )}

      {deletingEmployee && (
        <div className="modalBackdrop" role="presentation" onMouseDown={closeDeleteEmployeeModal}>
          <div className="authModal confirmModal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <h2>Удалить сотрудника</h2>
              <button
                aria-label="Закрыть подтверждение удаления"
                className="closeButton"
                type="button"
                onClick={closeDeleteEmployeeModal}
              >
                ×
              </button>
            </div>

            <p className="confirmText">
              Вы действительно хотите удалить сотрудника {deletingEmployee.fio || "без имени"}?
            </p>

            {deleteError && <p className="authError">{deleteError}</p>}

            <div className="confirmActions">
              <button className="authButton authButtonSecondary" disabled={isEmployeeDeleting} type="button" onClick={closeDeleteEmployeeModal}>
                Отмена
              </button>
              <button className="dangerButton" disabled={isEmployeeDeleting} type="button" onClick={() => void handleDeleteEmployee()}>
                {isEmployeeDeleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

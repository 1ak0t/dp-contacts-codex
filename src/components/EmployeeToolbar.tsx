import React from "react";
import type { Employee,AuthUser } from "../types";

type Props={
  search: string;
  setSearch: (value: string) => void;
  onlyOfficeEmployees: boolean;
  setOnlyOfficeEmployees: (value: boolean) => void;
  isEmployeesLoading: boolean;
  visibleEmployees: Employee[];
  employees: Employee[];
  authUser: AuthUser|null;
  openAddEmployeeModal: () => void;
  handleLogout: () => Promise<void>;
  setIsAuthOpen: (value: boolean) => void;
};

export default function EmployeeToolbar({ search,setSearch,onlyOfficeEmployees,setOnlyOfficeEmployees,isEmployeesLoading,visibleEmployees,employees,authUser,openAddEmployeeModal,handleLogout,setIsAuthOpen }: Props) {
  React.useEffect(() => {
    const handleEscape=(event: KeyboardEvent) => {
      if(event.key==="Escape"&&search) {
        setSearch("");
      }
    };

    window.addEventListener("keydown",handleEscape);
    return () => window.removeEventListener("keydown",handleEscape);
  },[search,setSearch]);

  return (
    <div className="tableToolbar">
      <div className="searchField">
        <input
          className="searchInput"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по ФИО, Телефону, E-Mail"
          type="text"
        />
        {search&&(
          <button
            aria-label="Очистить поиск"
            className="clearSearchButton"
            type="button"
            onClick={() => setSearch("")}
            title="Очистить поиск"
          >
            ×
          </button>
        )}
      </div>
      <label className="officeFilter">
        <input
          type="checkbox"
          checked={onlyOfficeEmployees}
          onChange={(event) => setOnlyOfficeEmployees(event.target.checked)}
        />
        <span>Только офисные сотрудники</span>
      </label>
      <span className="resultCount">
        {isEmployeesLoading? "Загрузка...":`${visibleEmployees.length} из ${employees.length}`}
      </span>
      <div className="authArea">
        {authUser? (
          <>
            <button className="authButton" type="button" onClick={openAddEmployeeModal}>
              Добавить сотрудника
            </button>
            <span className="authUser">{authUser.login}</span>
            <button className="authButton authButtonSecondary" type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </>
        ):(
          <button className="authButton" type="button" onClick={() => setIsAuthOpen(true)}>
            Авторизоваться
          </button>
        )}
      </div>
    </div>
  );
}

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
  return (
    <div className="tableToolbar">
      <input
        className="searchInput"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск по ФИО, Телефону, E-Mail"
        type="search"
      />
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

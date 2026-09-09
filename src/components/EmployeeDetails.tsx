import type { Employee,AuthUser } from "../types";
import { employeeFormFields,employeeFormLabels } from "../employeeConfig";
type Props={
  selectedEmployee: Employee|null;
  authUser: AuthUser|null;
  openEditEmployeeModal: (employee: Employee) => void;
  openDeleteEmployeeModal: (employee: Employee) => void;
  openAdminModal: (employee: Employee, action: "grant"|"reset"|"revoke") => void;
};

export default function EmployeeDetails({ selectedEmployee,authUser,openEditEmployeeModal,openDeleteEmployeeModal,openAdminModal }: Props) {
  return (
    <aside className="detailsPane" aria-label="Детальная информация">
      <h2>Детальная информация</h2>
      {selectedEmployee? (
        <>
          {selectedEmployee.isAdmin&&<span className="adminBadge detailsAdminBadge">Администратор</span>}
          <dl>
            {employeeFormFields.map((key) => (
              <div className="detailRow" key={key}>
                <dt>{employeeFormLabels[key]}</dt>
                <dd>{selectedEmployee[key]||"-"}</dd>
              </div>
            ))}
          </dl>
          {authUser&&(
            <>
              <div className="detailsActions">
                <button className="authButton" type="button" onClick={() => openEditEmployeeModal(selectedEmployee)}>
                  Редактировать
                </button>
                <button className="dangerButton" type="button" onClick={() => openDeleteEmployeeModal(selectedEmployee)}>
                  Удалить
                </button>
              </div>
              <div className="adminActions">
                {selectedEmployee.isAdmin? (
                  <>
                    <button className="authButton authButtonSecondary" type="button" onClick={() => openAdminModal(selectedEmployee,"reset")}>
                      Сбросить пароль
                    </button>
                    <button className="dangerButton" type="button" onClick={() => openAdminModal(selectedEmployee,"revoke")}>
                      Забрать права администратора
                    </button>
                  </>
                ):(
                  <button className="authButton" type="button" onClick={() => openAdminModal(selectedEmployee,"grant")}>
                    Сделать администратором
                  </button>
                )}
              </div>
            </>
          )}
        </>
      ):(
        <p className="emptyDetails">Выберите сотрудника для получения подробной информации</p>
      )}
    </aside>
  );
}

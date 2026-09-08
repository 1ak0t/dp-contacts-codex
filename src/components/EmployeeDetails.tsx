import type { Employee,AuthUser } from "../types";
import { employeeFormFields,employeeFormLabels } from "../employeeConfig";
type Props={
  selectedEmployee: Employee|null;
  authUser: AuthUser|null;
  openEditEmployeeModal: (employee: Employee) => void;
  openDeleteEmployeeModal: (employee: Employee) => void;
};

export default function EmployeeDetails({ selectedEmployee,authUser,openEditEmployeeModal,openDeleteEmployeeModal }: Props) {
  return (
    <aside className="detailsPane" aria-label="Детальная информация">
      <h2>Детальная информация</h2>
      {selectedEmployee? (
        <>
          <dl>
            {employeeFormFields.map((key) => (
              <div className="detailRow" key={key}>
                <dt>{employeeFormLabels[key]}</dt>
                <dd>{selectedEmployee[key]||"-"}</dd>
              </div>
            ))}
          </dl>
          {authUser&&(
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
      ):(
        <p className="emptyDetails">Нажмите на сотрудника для получения подробной информации</p>
      )}
    </aside>
  );
}

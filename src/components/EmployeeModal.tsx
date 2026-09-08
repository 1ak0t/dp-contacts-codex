import type { Employee,EmployeeForm,ColumnKey } from "../types";
import type { FormEvent } from "react";
import { employeeFormFields,employeeFormLabels,requiredEmployeeFields } from "../employeeConfig";
type Props={
  closeEmployeeModal: () => void;
  handleSaveEmployee: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  editingEmployee: Employee|null;
  employeeForm: EmployeeForm;
  updateEmployeeForm: (key: keyof EmployeeForm,value: string) => void;
  filterOptions: Record<ColumnKey,string[]>;
  employeeFieldErrors: Partial<Record<keyof EmployeeForm,string>>;
  employeeFormError: string;
  isEmployeeSaving: boolean;
};

export default function EmployeeModal({ closeEmployeeModal,handleSaveEmployee,editingEmployee,employeeForm,updateEmployeeForm,filterOptions,employeeFieldErrors,employeeFormError,isEmployeeSaving }: Props) {
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={closeEmployeeModal}>
      <form className="authModal employeeModal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSaveEmployee}>
        <div className="modalHeader">
          <h2>{editingEmployee? "Редактировать сотрудника":"Добавить сотрудника"}</h2>
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
                {requiredEmployeeFields.includes(field)&&<strong className="requiredMark">*</strong>}
              </span>
              {field==="op"? (
                <select
                  value={employeeForm.op}
                  onChange={(event) => updateEmployeeForm("op",event.target.value)}
                  required
                >
                  <option value="">Выберите ОП</option>
                  {filterOptions.op.map((value) => (
                    <option value={value} key={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ):(
                <input
                  aria-invalid={Boolean(employeeFieldErrors[field])}
                  inputMode={field==="phoneNumber"||field==="innerPhone"? "tel":undefined}
                  onChange={(event) => updateEmployeeForm(field,event.target.value)}
                  pattern={field==="phoneNumber"? "\\+7-\\d{3}-\\d{3}-\\d{2}-\\d{2}":undefined}
                  placeholder={
                    field==="phoneNumber"
                      ? "+71234567891"
                      :field==="email"||field==="persEmail"
                        ? "example@mail.ru"
                        :undefined
                  }
                  required={requiredEmployeeFields.includes(field)}
                  type={field==="email"||field==="persEmail"? "email":"text"}
                  value={employeeForm[field]}
                />
              )}
              {employeeFieldErrors[field]&&<em className="fieldError">{employeeFieldErrors[field]}</em>}
            </label>
          ))}
        </div>

        {employeeFormError&&<p className="authError">{employeeFormError}</p>}

        <button className="submitButton" disabled={isEmployeeSaving} type="submit">
          {isEmployeeSaving? "Сохранение...":editingEmployee? "Сохранить":"Добавить"}
        </button>
      </form>
    </div>
  );
}

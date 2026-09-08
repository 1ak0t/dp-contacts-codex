import type { Employee } from "../types";

type Props={
  closeDeleteEmployeeModal: () => void;
  deletingEmployee: Employee;
  deleteError: string;
  isEmployeeDeleting: boolean;
  handleDeleteEmployee: () => Promise<void>;
};

export default function DeleteEmployeeModal({ closeDeleteEmployeeModal,deletingEmployee,deleteError,isEmployeeDeleting,handleDeleteEmployee }: Props) {
  return (
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
          Вы действительно хотите удалить сотрудника {deletingEmployee.fio||"без имени"}?
        </p>

        {deleteError&&<p className="authError">{deleteError}</p>}

        <div className="confirmActions">
          <button className="authButton authButtonSecondary" disabled={isEmployeeDeleting} type="button" onClick={closeDeleteEmployeeModal}>
            Отмена
          </button>
          <button className="dangerButton" disabled={isEmployeeDeleting} type="button" onClick={() => void handleDeleteEmployee()}>
            {isEmployeeDeleting? "Удаление...":"Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

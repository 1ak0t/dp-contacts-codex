import type { Employee } from "../types";

type AdminAction = "grant" | "reset" | "revoke";

type Props = {
  employee: Employee;
  action: AdminAction;
  password: string;
  error: string;
  isSaving: boolean;
  closeAdminModal: () => void;
  handleConfirm: () => Promise<void>;
};

const titles: Record<AdminAction, string> = {
  grant: "Сделать администратором",
  reset: "Сбросить пароль",
  revoke: "Забрать права администратора",
};

export default function AdminEmployeeModal({ employee,action,password,error,isSaving,closeAdminModal,handleConfirm }: Props) {
  const isRevoke = action === "revoke";

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={closeAdminModal}>
      <div className="authModal confirmModal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <h2>{titles[action]}</h2>
          <button
            aria-label="Закрыть окно управления администратором"
            className="closeButton"
            type="button"
            onClick={closeAdminModal}
          >
            ×
          </button>
        </div>

        <p className="confirmText">
          {isRevoke
            ? `Забрать права администратора у сотрудника ${employee.fio || "без имени"}?`
            : `${action === "grant" ? "Сделать" : "Сбросить пароль для"} сотрудника ${employee.fio || "без имени"} администратором?`}
        </p>

        {!isRevoke&&(
          <div className="generatedPassword">
            <span>Пароль</span>
            <strong>{password}</strong>
          </div>
        )}

        {error&&<p className="authError">{error}</p>}

        <div className="confirmActions">
          <button className="authButton authButtonSecondary" disabled={isSaving} type="button" onClick={closeAdminModal}>
            Отмена
          </button>
          <button className={isRevoke? "dangerButton":"authButton"} disabled={isSaving} type="button" onClick={() => void handleConfirm()}>
            {isSaving? "Сохранение...":"Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );
}

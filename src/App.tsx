import React from "react";
import { copyText } from "./clipboard";
import type { Employee,EmployeeForm,ColumnKey,SortConfig,AuthUser } from "./types";
import { columns,filterColumns,employeeFormFields,employeeFormLabels,requiredEmployeeFields,emptyEmployeeForm,phoneRegex,emailRegex } from "./employeeConfig";
import { normalizePhone,formatPhone,getEmployeeForm,getColumnValue,uniqueValues } from "./employeeUtils";
import SiteHeader from "./components/SiteHeader";
import EmployeeToolbar from "./components/EmployeeToolbar";
import MobileFilters from "./components/MobileFilters";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeDetails from "./components/EmployeeDetails";
import AuthModal from "./components/AuthModal";
import EmployeeModal from "./components/EmployeeModal";
import DeleteEmployeeModal from "./components/DeleteEmployeeModal";
import AdminEmployeeModal from "./components/AdminEmployeeModal";

const apiUrl=import.meta.env.VITE_API_URL??"http://127.0.0.1:4000";
const authTokenKey="dp_contacts_auth_token";
type AdminAction="grant"|"reset"|"revoke";

function generatePassword(): string {
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values=new Uint32Array(14);
  crypto.getRandomValues(values);
  return Array.from(values,(value) => alphabet[value%alphabet.length]).join("");
}

export default function App() {
  const [employees,setEmployees]=React.useState<Employee[]>([]);
  const [isEmployeesLoading,setIsEmployeesLoading]=React.useState(true);
  const [employeesError,setEmployeesError]=React.useState("");
  const [search,setSearch]=React.useState("");
  const [filters,setFilters]=React.useState<Record<ColumnKey,string>>({
    op: "",
    fio: "",
    jobTitle: "",
    phoneNumber: "",
    email: "",
  });
  const [sortConfig,setSortConfig]=React.useState<SortConfig>({ key: "fio",direction: "asc" });
  const [selectedEmployee,setSelectedEmployee]=React.useState<Employee|null>(null);
  const [onlyOfficeEmployees,setOnlyOfficeEmployees]=React.useState(true);
  const [copiedEmail,setCopiedEmail]=React.useState("");
  const [copiedPhone,setCopiedPhone]=React.useState("");
  const [copyError,setCopyError]=React.useState("");
  const [authUser,setAuthUser]=React.useState<AuthUser|null>(null);
  const [authToken,setAuthToken]=React.useState(() => localStorage.getItem(authTokenKey)??"");
  const [isAuthOpen,setIsAuthOpen]=React.useState(false);
  const [authLogin,setAuthLogin]=React.useState("");
  const [authPassword,setAuthPassword]=React.useState("");
  const [authError,setAuthError]=React.useState("");
  const [isAuthLoading,setIsAuthLoading]=React.useState(false);
  const [isAddEmployeeOpen,setIsAddEmployeeOpen]=React.useState(false);
  const [editingEmployee,setEditingEmployee]=React.useState<Employee|null>(null);
  const [deletingEmployee,setDeletingEmployee]=React.useState<Employee|null>(null);
  const [employeeForm,setEmployeeForm]=React.useState<EmployeeForm>(emptyEmployeeForm);
  const [employeeFormError,setEmployeeFormError]=React.useState("");
  const [isEmployeeSaving,setIsEmployeeSaving]=React.useState(false);
  const [deleteError,setDeleteError]=React.useState("");
  const [isEmployeeDeleting,setIsEmployeeDeleting]=React.useState(false);
  const [adminModal,setAdminModal]=React.useState<{ employee: Employee; action: AdminAction; password: string }|null>(null);
  const [adminError,setAdminError]=React.useState("");
  const [isAdminSaving,setIsAdminSaving]=React.useState(false);

  const employeeFieldErrors=React.useMemo<Partial<Record<keyof EmployeeForm,string>>>(() => {
    const errors: Partial<Record<keyof EmployeeForm,string>>={};
    const phone=normalizePhone(employeeForm.phoneNumber);

    if(employeeForm.phoneNumber&&!phoneRegex.test(phone)) {
      errors.phoneNumber="Формат: +7-xxx-xxx-xx-xx";
    }

    if(employeeForm.email&&!emailRegex.test(employeeForm.email.trim())) {
      errors.email="Некорректный E-Mail";
    }

    if(employeeForm.persEmail&&!emailRegex.test(employeeForm.persEmail.trim())) {
      errors.persEmail="Некорректный E-Mail";
    }

    return errors;
  },[employeeForm]);

  const filterOptions=React.useMemo(
    () =>
      columns.reduce<Record<ColumnKey,string[]>>((options,column) => {
        options[column.key]=uniqueValues(employees,column.key);
        return options;
      },{} as Record<ColumnKey,string[]>),
    [employees],
  );

  const visibleEmployees=React.useMemo(() => {
    const normalizedSearch=search.trim().toLocaleLowerCase("ru");

    return employees
      .filter((employee) => !onlyOfficeEmployees||Boolean(employee.email?.trim()))
      .filter((employee) =>
        filterColumns.every((column) => !filters[column.key]||getColumnValue(employee,column.key)===filters[column.key]),
      )
      .filter((employee) => {
        if(!normalizedSearch) {
          return true;
        }

        return columns.some((column) =>
          getColumnValue(employee,column.key).toLocaleLowerCase("ru").includes(normalizedSearch),
        );
      })
      .sort((first,second) => {
        const direction=sortConfig.direction==="asc"? 1:-1;
        return (
          direction*
          getColumnValue(first,sortConfig.key).localeCompare(getColumnValue(second,sortConfig.key),"ru",{
            numeric: true,
            sensitivity: "base",
          })
        );
      });
  },[employees,filters,search,sortConfig,onlyOfficeEmployees]);

  React.useEffect(() => {
    setSelectedEmployee((current) => {
      if(search.trim()) {
        return visibleEmployees[0]??null;
      }

      return current&&visibleEmployees.includes(current)? current:null;
    });
  },[search,visibleEmployees]);

  React.useEffect(() => {
    const controller=new AbortController();

    async function loadEmployees() {
      setEmployeesError("");
      setIsEmployeesLoading(true);

      try {
        const response=await fetch(`${apiUrl}`,{
          signal: controller.signal,
        });
        const data=(await response.json()) as { employees?: Employee[]; message?: string };

        if(!response.ok||!Array.isArray(data.employees)) {
          throw new Error(data.message||"Не удалось загрузить контакты");
        }

        setEmployees(data.employees);
      } catch(error) {
        if(error instanceof DOMException&&error.name==="AbortError") {
          return;
        }

        setEmployeesError(error instanceof Error? error.message:"Не удалось загрузить контакты");
        setEmployees([]);
      } finally {
        if(!controller.signal.aborted) {
          setIsEmployeesLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => controller.abort();
  },[]);

  React.useEffect(() => {
    if(!authToken) {
      return;
    }

    const controller=new AbortController();

    fetch(`${apiUrl}/auth/me`,{
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if(!response.ok) {
          throw new Error("Сессия истекла");
        }

        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then((data) => setAuthUser(data.user))
      .catch((error: unknown) => {
        if(error instanceof DOMException&&error.name==="AbortError") {
          return;
        }

        localStorage.removeItem(authTokenKey);
        setAuthToken("");
        setAuthUser(null);
      });

    return () => controller.abort();
  },[authToken]);

  const copyEmail=async (email: string) => {
    if(!email) {
      return;
    }

    setCopyError("");
    setCopiedEmail("");
    try {
      await copyText(email);
      setCopiedEmail(email);
      window.setTimeout(() => setCopiedEmail((current) => (current===email? "":current)),1600);
    } catch {
      setCopyError("Не удалось скопировать почту. Выделите адрес и скопируйте его вручную.");
    }
  };

  const copyPhone=async (phone: string) => {
    if(!phone) {
      return;
    }

    setCopyError("");
    setCopiedPhone("");
    try {
      await copyText(phone);
      setCopiedPhone(phone);
      window.setTimeout(() => setCopiedPhone((current) => (current===phone? "":current)),1600);
    } catch {
      setCopyError("Не удалось скопировать телефон. Выделите номер и скопируйте его вручную.");
    }
  };

  const handleSort=(key: ColumnKey) => {
    setSortConfig((current) =>
      current.key===key
        ? { key,direction: current.direction==="asc"? "desc":"asc" }
        :{ key,direction: "asc" },
    );
  };

  const updateFilter=(key: ColumnKey,value: string) => {
    setFilters((current) => ({ ...current,[key]: value }));
  };

  const updateEmployeeForm=(key: keyof EmployeeForm,value: string) => {
    setEmployeeForm((current) => ({
      ...current,
      [key]: key==="phoneNumber"? formatPhone(value):value,
    }));
    setEmployeeFormError("");
  };

  const resetEmployeeForm=() => {
    setEmployeeForm(emptyEmployeeForm);
    setEmployeeFormError("");
    setIsEmployeeSaving(false);
  };

  const openAddEmployeeModal=() => {
    setEditingEmployee(null);
    setEmployeeForm(emptyEmployeeForm);
    setEmployeeFormError("");
    setIsAddEmployeeOpen(true);
  };

  const openEditEmployeeModal=(employee: Employee) => {
    setIsAddEmployeeOpen(false);
    setEditingEmployee(employee);
    setEmployeeForm(getEmployeeForm(employee));
    setEmployeeFormError("");
  };

  const closeEmployeeModal=() => {
    setIsAddEmployeeOpen(false);
    setEditingEmployee(null);
    resetEmployeeForm();
  };

  const openDeleteEmployeeModal=(employee: Employee) => {
    setDeletingEmployee(employee);
    setDeleteError("");
  };

  const closeDeleteEmployeeModal=() => {
    setDeletingEmployee(null);
    setDeleteError("");
    setIsEmployeeDeleting(false);
  };

  const openAdminModal=(employee: Employee,action: AdminAction) => {
    setAdminModal({
      employee,
      action,
      password: action==="revoke"? "":generatePassword(),
    });
    setAdminError("");
  };

  const closeAdminModal=() => {
    setAdminModal(null);
    setAdminError("");
    setIsAdminSaving(false);
  };

  const replaceEmployee=(updatedEmployee: Employee) => {
    setEmployees((current) => current.map((employee) => (employee.id===updatedEmployee.id? updatedEmployee:employee)));
    setSelectedEmployee((current) => (current?.id===updatedEmployee.id? updatedEmployee:current));
  };

  const validateEmployeeForm=(): string => {
    for(const field of requiredEmployeeFields) {
      if(!employeeForm[field].trim()) {
        return `Поле "${employeeFormLabels[field]}" обязательно`;
      }
    }

    if(!phoneRegex.test(normalizePhone(employeeForm.phoneNumber))) {
      return "Телефон должен быть в формате +7-xxx-xxx-xx-xx";
    }

    if(employeeForm.email.trim()&&!emailRegex.test(employeeForm.email.trim())) {
      return "E-Mail указан некорректно";
    }

    if(employeeForm.persEmail.trim()&&!emailRegex.test(employeeForm.persEmail.trim())) {
      return "Личный E-Mail указан некорректно";
    }

    return "";
  };

  const handleLogin=async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      const response=await fetch(`${apiUrl}/auth/login`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: authLogin,
          password: authPassword,
        }),
      });
      const data=(await response.json()) as { token?: string; user?: AuthUser; message?: string };

      if(!response.ok||!data.token||!data.user) {
        throw new Error(data.message||"Не удалось авторизоваться");
      }

      localStorage.setItem(authTokenKey,data.token);
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthLogin("");
      setAuthPassword("");
      setIsAuthOpen(false);
    } catch(error) {
      setAuthError(error instanceof Error? error.message:"Не удалось авторизоваться");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout=async () => {
    if(authToken) {
      await fetch(`${apiUrl}/auth/logout`,{
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

  const handleSaveEmployee=async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError=validateEmployeeForm();

    if(validationError) {
      setEmployeeFormError(validationError);
      return;
    }

    setEmployeeFormError("");
    setIsEmployeeSaving(true);

    try {
      const isEditMode=Boolean(editingEmployee);
      const response=await fetch(`${apiUrl}${isEditMode? `/${editingEmployee?.id}`:""}`,{
        method: isEditMode? "PUT":"POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          employeeFormFields.reduce<EmployeeForm>((payload,field) => {
            payload[field]=field==="phoneNumber"? normalizePhone(employeeForm.phoneNumber):employeeForm[field].trim();
            return payload;
          },{} as EmployeeForm),
        ),
      });
      const data=(await response.json()) as { employee?: Employee; message?: string; errors?: string[] };

      if(!response.ok||!data.employee) {
        throw new Error(data.errors?.[0]||data.message||"Не удалось сохранить сотрудника");
      }

      if(isEditMode) {
        setEmployees((current) => current.map((employee) => (employee.id===data.employee!.id? data.employee!:employee)));
      } else {
        setEmployees((current) => [...current,data.employee!]);
      }

      setSelectedEmployee(data.employee);
      closeEmployeeModal();
    } catch(error) {
      setEmployeeFormError(error instanceof Error? error.message:"Не удалось сохранить сотрудника");
    } finally {
      setIsEmployeeSaving(false);
    }
  };

  const handleDeleteEmployee=async () => {
    if(!deletingEmployee?.id) {
      setDeleteError("Не удалось определить сотрудника");
      return;
    }

    setDeleteError("");
    setIsEmployeeDeleting(true);

    try {
      const response=await fetch(`${apiUrl}/${deletingEmployee.id}`,{
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if(!response.ok) {
        const data=(await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message||"Не удалось удалить сотрудника");
      }

      setEmployees((current) => current.filter((employee) => employee.id!==deletingEmployee.id));
      setSelectedEmployee((current) => (current?.id===deletingEmployee.id? null:current));
      closeDeleteEmployeeModal();
    } catch(error) {
      setDeleteError(error instanceof Error? error.message:"Не удалось удалить сотрудника");
    } finally {
      setIsEmployeeDeleting(false);
    }
  };

  const handleAdminAction=async () => {
    if(!adminModal?.employee.id) {
      setAdminError("Не удалось определить сотрудника");
      return;
    }

    setAdminError("");
    setIsAdminSaving(true);

    const path =
      adminModal.action==="reset"
        ? `${apiUrl}/${adminModal.employee.id}/admin/reset-password`
        :`${apiUrl}/${adminModal.employee.id}/admin`;
    const options: RequestInit =
      adminModal.action==="revoke"
        ? {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
        : {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: adminModal.password }),
        };

    try {
      const response=await fetch(path,options);
      const data=(await response.json().catch(() => ({}))) as { employee?: Employee; message?: string };

      if(!response.ok||!data.employee) {
        throw new Error(data.message||"Не удалось обновить права администратора");
      }

      replaceEmployee(data.employee);
      closeAdminModal();
    } catch(error) {
      setAdminError(error instanceof Error? error.message:"Не удалось обновить права администратора");
    } finally {
      setIsAdminSaving(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="page">
        <section className="tablePane" aria-label="Контакты сотрудников">
          <EmployeeToolbar
            search={search}
            setSearch={setSearch}
            onlyOfficeEmployees={onlyOfficeEmployees}
            setOnlyOfficeEmployees={setOnlyOfficeEmployees}
            isEmployeesLoading={isEmployeesLoading}
            visibleEmployees={visibleEmployees}
            employees={employees}
            authUser={authUser}
            openAddEmployeeModal={openAddEmployeeModal}
            handleLogout={handleLogout}
            setIsAuthOpen={setIsAuthOpen}
          />

          <MobileFilters
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            filters={filters}
            updateFilter={updateFilter}
            filterOptions={filterOptions}
          />

          {copyError&&<p className="authError" role="alert">{copyError}</p>}
          <EmployeeTable
            sortConfig={sortConfig}
            handleSort={handleSort}
            filters={filters}
            updateFilter={updateFilter}
            filterOptions={filterOptions}
            employeesError={employeesError}
            isEmployeesLoading={isEmployeesLoading}
            visibleEmployees={visibleEmployees}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            copyEmail={copyEmail}
            copyPhone={copyPhone}
            copiedEmail={copiedEmail}
            copiedPhone={copiedPhone}
          />
        </section>

        <EmployeeDetails
          selectedEmployee={selectedEmployee}
          authUser={authUser}
          openEditEmployeeModal={openEditEmployeeModal}
          openDeleteEmployeeModal={openDeleteEmployeeModal}
          openAdminModal={openAdminModal}
        />

        {isAuthOpen&&(
          <AuthModal
            setIsAuthOpen={setIsAuthOpen}
            handleLogin={handleLogin}
            authLogin={authLogin}
            setAuthLogin={setAuthLogin}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            isAuthLoading={isAuthLoading}
          />
        )}

        {(isAddEmployeeOpen||editingEmployee)&&(
          <EmployeeModal
            closeEmployeeModal={closeEmployeeModal}
            handleSaveEmployee={handleSaveEmployee}
            editingEmployee={editingEmployee}
            employeeForm={employeeForm}
            updateEmployeeForm={updateEmployeeForm}
            filterOptions={filterOptions}
            employeeFieldErrors={employeeFieldErrors}
            employeeFormError={employeeFormError}
            isEmployeeSaving={isEmployeeSaving}
          />
        )}

        {deletingEmployee&&(
          <DeleteEmployeeModal
            closeDeleteEmployeeModal={closeDeleteEmployeeModal}
            deletingEmployee={deletingEmployee}
            deleteError={deleteError}
            isEmployeeDeleting={isEmployeeDeleting}
            handleDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {adminModal&&(
          <AdminEmployeeModal
            employee={adminModal.employee}
            action={adminModal.action}
            password={adminModal.password}
            error={adminError}
            isSaving={isAdminSaving}
            closeAdminModal={closeAdminModal}
            handleConfirm={handleAdminAction}
          />
        )}
      </main>
    </>
  );
}

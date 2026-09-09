import type { Employee,ColumnKey,SortConfig } from "../types";
import { columns,filterColumns } from "../employeeConfig";
import { getColumnValue } from "../employeeUtils";
import CopyButton from "./CopyButton";
type Props={
  sortConfig: SortConfig;
  handleSort: (key: ColumnKey) => void;
  filters: Record<ColumnKey,string>;
  updateFilter: (key: ColumnKey,value: string) => void;
  filterOptions: Record<ColumnKey,string[]>;
  employeesError: string;
  isEmployeesLoading: boolean;
  visibleEmployees: Employee[];
  selectedEmployee: Employee|null;
  setSelectedEmployee: (employee: Employee) => void;
  copyEmail: (value: string) => Promise<void>;
  copyPhone: (value: string) => Promise<void>;
  copiedEmail: string;
  copiedPhone: string;
};

export default function EmployeeTable({ sortConfig,handleSort,filters,updateFilter,filterOptions,employeesError,isEmployeesLoading,visibleEmployees,selectedEmployee,setSelectedEmployee,copyEmail,copyPhone,copiedEmail,copiedPhone }: Props) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                <div className={column.key==="op"? "columnHeading columnHeadingInline":"columnHeading"}>
                  <button className="sortButton" type="button" onClick={() => handleSort(column.key)}>
                    <span>{column.label}</span>
                    <span className="sortIndicator">
                      {sortConfig.key===column.key? (sortConfig.direction==="asc"? "▲":"▼"):""}
                    </span>
                  </button>
                  {filterColumns.includes(column)&&<select
                    aria-label={`Фильтр: ${column.label}`}
                    value={filters[column.key]}
                    onChange={(event) => updateFilter(column.key,event.target.value)}
                  >
                    <option value="">Все</option>
                    {filterOptions[column.key].map((value) => (
                      <option value={value} key={value}>
                        {value}
                      </option>
                    ))}
                  </select>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employeesError&&(
            <tr>
              <td className="stateCell" colSpan={columns.length}>
                {employeesError}
              </td>
            </tr>
          )}
          {!employeesError&&isEmployeesLoading&&(
            <tr>
              <td className="stateCell" colSpan={columns.length}>
                Загрузка контактов...
              </td>
            </tr>
          )}
          {!employeesError&&!isEmployeesLoading&&visibleEmployees.length===0&&(
            <tr>
              <td className="stateCell" colSpan={columns.length}>
                Контакты не найдены
              </td>
            </tr>
          )}
          {visibleEmployees.map((employee,index) => {
            const isSelected=selectedEmployee===employee;
            return (
              <tr
                className={isSelected? "selected":undefined}
                key={`${employee.fio}-${employee.phoneNumber}-${index}`}
                onClick={() => setSelectedEmployee(employee)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if(event.key==="Enter"||event.key===" ") {
                    setSelectedEmployee(employee);
                  }
                }}
              >
                {columns.map((column) => {
                  const value=getColumnValue(employee,column.key);
                  return (
                    <td data-label={column.label} key={column.key}>
                      {column.key==="fio"? (
                        <div className="fioCell">
                          {employee.isAdmin&&<span className="adminBadge">Администратор</span>}
                          <span>{value||"-"}</span>
                        </div>
                      ):column.key==="email"&&value? (
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
                          <CopyButton label={`Скопировать почту ${value}`} onCopy={() => void copyEmail(value)} />
                          {copiedEmail===value&&<span className="copyStatus" role="status">Скопировано</span>}
                        </div>
                      ):column.key==="phoneNumber"&&value? (
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
                          <CopyButton label={`Скопировать мобильный телефон ${value}`} onCopy={() => void copyPhone(value)} />
                          {copiedPhone===value&&<span className="copyStatus" role="status">Скопировано</span>}
                        </div>
                      ):(
                        value||"-"
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
  );
}

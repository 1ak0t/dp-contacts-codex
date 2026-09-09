import type { FormEvent } from "react";

type Props={
  setIsAuthOpen: (value: boolean) => void;
  handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  authLogin: string;
  setAuthLogin: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authError: string;
  isAuthLoading: boolean;
};

export default function AuthModal({ setIsAuthOpen,handleLogin,authLogin,setAuthLogin,authPassword,setAuthPassword,authError,isAuthLoading }: Props) {
  return (
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
          <span>E-Mail или admin</span>
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

        {authError&&<p className="authError">{authError}</p>}

        <button className="submitButton" disabled={isAuthLoading} type="submit">
          {isAuthLoading? "Проверка...":"Войти"}
        </button>
      </form>
    </div>
  );
}

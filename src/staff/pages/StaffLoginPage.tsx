import { type FormEvent, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { AuthError } from '../../services';
import logo from '../../shared/assets/logo-login.svg';
import { ROUTES } from '../../shared/constants/routes';
import styles from './StaffLoginPage.module.css';

type LoginLocationState = {
  from?: { pathname?: string; search?: string; hash?: string };
};

export function StaffLoginPage() {
  const { user, isInitializing, login: authenticate } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const from = (location.state as LoginLocationState | null)?.from;
  const redirectTo = from?.pathname
    ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    : ROUTES.staff;
  const isSubmitDisabled = isInitializing || isLoading || login.trim() === '' || password === '';

  if (!isInitializing && user) return <Navigate replace to={redirectTo} />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    setError(null);
    setIsLoading(true);
    try {
      await authenticate(login, password);
      navigate(redirectTo, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof AuthError
        ? caughtError
        : new AuthError('api_error', 'Не удалось войти. Попробуйте ещё раз.'));
    } finally {
      setIsLoading(false);
    }
  };

  const invalidCredentials = error?.code === 'invalid_credentials';

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="Вход в панель управления">
        <img className={styles.logo} src={logo} alt="Мультимедиа ПРО" />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formContent}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Логин<span className={styles.required}>*</span></span>
                <span className={styles.inputContainer}>
                  <input className={styles.input} name="login" autoComplete="username" value={login} onChange={(event) => { setLogin(event.target.value); setError(null); }} aria-invalid={invalidCredentials} disabled={isLoading} />
                  {invalidCredentials && <span className={styles.fieldError}>Неверный логин</span>}
                </span>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Пароль<span className={styles.required}>*</span></span>
                <span className={styles.inputContainer}>
                  <input className={styles.input} type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} aria-invalid={invalidCredentials} disabled={isLoading} />
                  <button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} disabled={isLoading}>
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  {invalidCredentials && <span className={styles.fieldError}>Неверный пароль</span>}
                </span>
              </label>
            </div>
            <label className={styles.remember}>
              <input className={styles.checkboxInput} type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={isLoading} />
              <span className={styles.checkbox} aria-hidden="true">{rememberMe && <Check size={12} strokeWidth={3} />}</span>
              <span>Запомнить меня</span>
            </label>
            {error?.code === 'api_error' && <p className={styles.apiError} role="alert">{error.message}</p>}
          </div>
          <button className={styles.submit} type="submit" disabled={isSubmitDisabled}>{isLoading ? 'Вход…' : 'Войти'}</button>
        </form>
      </section>
    </main>
  );
}

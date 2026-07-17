type LoginScreenProps = {
  error?: string;
};

const errorMessages: Record<string, string> = {
  invalid: "El passcode no es correcto.",
  "rate-limit": "Demasiados intentos. Espera unos minutos antes de probar otra vez.",
  config: "Falta configurar el acceso en el servidor.",
};

export function LoginScreen({ error }: LoginScreenProps) {
  return (
    <main className="auth-shell">
      <form className="auth-panel" action="/login" method="post">
        <p className="auth-kicker">Irati</p>
        <h1>Acceso privado</h1>
        <label>
          Passcode
          <input
            autoComplete="current-password"
            inputMode="numeric"
            name="passcode"
            required
            type="password"
          />
        </label>
        {error ? (
          <p className="auth-error">{errorMessages[error] ?? errorMessages.invalid}</p>
        ) : null}
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}

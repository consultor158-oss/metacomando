import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Lock, LogIn, AlertCircle, LogOut } from "lucide-react";

const STORAGE_KEY = "meta_dash_auth_v1";
const VALID_EMAIL = "admin@admin.com";
const VALID_PASSWORD = "097806";

export function LoginGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage.getItem(STORAGE_KEY) === "1") {
        setAuthed(true);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
        try {
          window.sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // ignore
        }
        setAuthed(true);
      } else {
        setError("Credenciais inválidas. Verifique o e-mail e senha.");
      }
      setLoading(false);
    }, 350);
  };

  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
    setEmail("");
    setPassword("");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (authed) {
    return (
      <>
        {children}
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.22_260/0.25),transparent_55%),radial-gradient(circle_at_75%_80%,oklch(0.65_0.2_320/0.18),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Meta Ads — Dashboard Ultra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito. Faça login para continuar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@admin.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Sessão protegida · Meta Ads Manager
        </p>
      </div>
    </div>
  );
}

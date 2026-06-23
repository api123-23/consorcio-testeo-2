import { useState } from 'react';
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={28} />
            <h1>Concorcio</h1>
          </div>
          <p className="login-subtitle">
            {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá una cuenta para empezar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <Mail size={15} className="input-icon" />
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={15} className="input-icon" />
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary login-btn" type="submit" disabled={submitting}>
            {submitting ? (
              'Un momento...'
            ) : (
              <>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          {mode === 'login' ? (
            <p>
              ¿No tenés cuenta?{' '}
              <button className="link-btn" onClick={() => { setMode('register'); setError(''); }}>
                Registrarse
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tenés cuenta?{' '}
              <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>
                Iniciar sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

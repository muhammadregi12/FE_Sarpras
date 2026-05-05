import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService";
import { useLoginForm } from "../../hooks/useLoginForm";
import { DecorativePanel, FormPanel } from "../../components/feature/LoginComponent";

export default function Login() {
  const navigate = useNavigate();
  const formState = useLoginForm(navigate);

  return (
    <div className="auth-root">
      <DecorativePanel />
      <FormPanel formState={formState} onSubmit={login} />
    </div>
  );
}
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
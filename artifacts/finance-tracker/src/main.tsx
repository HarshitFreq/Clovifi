import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupLocalLedgerInterceptor } from "./lib/local-ledger";

// Install client-side ledger interceptor for seamless offline & static hosting functionality
setupLocalLedgerInterceptor();

createRoot(document.getElementById("root")!).render(<App />);

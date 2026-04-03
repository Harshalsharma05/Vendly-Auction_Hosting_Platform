// File: src/main.jsx  — standard Vite entry, no changes needed if already present
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            // Apply your brand typography
            className: "font-sans text-sm",

            // Default Toast Styling (Matches your Input/Card pattern)
            style: {
              background: "#ffffff",
              color: "#0D0D0D", // brand-dark
              border: "1px solid #E8E8E8", // brand-border
              borderRadius: "16px", // rounded-2xl pattern
              padding: "12px 16px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            },

            // Success Toast Styling
            success: {
              iconTheme: {
                primary: "#7C3A2D", // brand-rust
                secondary: "#ffffff",
              },
            },

            // Error Toast Styling
            error: {
              style: {
                background: "#ffffff",
                color: "#0D0D0D",
                border: "1px solid #7C3A2D", // Uses brand-rust for error emphasis
                borderRadius: "16px",
                padding: "12px 16px",
                boxShadow: "0 4px 6px -1px rgba(124, 58, 45, 0.1)", // subtle rust shadow
              },
              iconTheme: {
                primary: "#7C3A2D", // brand-rust
                secondary: "#ffffff",
              },
            },

            // Loading Toast Styling
            loading: {
              iconTheme: {
                primary: "#6B6B6B", // brand-muted
                secondary: "#E8E8E8", // brand-border
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

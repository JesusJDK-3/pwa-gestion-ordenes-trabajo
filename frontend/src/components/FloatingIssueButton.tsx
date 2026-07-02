import { Bug } from "lucide-react"; // si no usas lucide-react, reemplaza por un ícono/emoji

const ISSUES_URL = "https://github.com/JesusJDK-3/pwa-gestion-ordenes-trabajo/issues";

export default function FloatingIssueButton() {
  return (
    <a
      href={ISSUES_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Reportar un problema"
      title="Reportar un problema"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#f97316", // naranja
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
        zIndex: 9999, // siempre por encima de todo
        cursor: "pointer",
        transition: "transform 0.15s ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <Bug color="white" size={24} />
    </a>
  );
}
// utils/swalConfig.js
import Swal from "sweetalert2";

export const confirmAction = async (title, text, icon = "question", confirmText = "Confirm") => {
  const isDark = (localStorage.getItem("theme") || "dark") === "dark";
  
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: icon === "warning" ? "#F88379" : "#2ecc71",
    cancelButtonColor: "#95a5a6",
    background: isDark ? "#2D3944" : "#fff",
    color: isDark ? "#fff" : "#000",
    confirmButtonText: confirmText,
  });
};
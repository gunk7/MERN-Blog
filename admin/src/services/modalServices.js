// utils/swalConfig.js
import Swal from "sweetalert2";

/* export const confirmAction = async (title, text, icon = "question", confirmText = "Confirm") => {
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
}; */

export const confirmAction = async (title, text, icon = "question", confirmText = "Confirm") => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: icon === "warning" ? "#F88379" : "#2ecc71",
    cancelButtonColor: "#95a5a6",
    confirmButtonText: confirmText,
  });
};

export const confirmExit = async () => {
  return Swal.fire({
    title: "Unsaved Changes",
    text: "You have progress on this post. Would you like to save before leaving?",
    icon: "warning",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Save & Exit",
    denyButtonText: "Discard",
    cancelButtonText: "Stay",
    confirmButtonColor: "#2ecc71", // Green for Save
    denyButtonColor: "#F88379",    // Coral/Rose for Discard
    cancelButtonColor: "#95a5a6",
    customClass: {
      popup: 'rounded-3xl', // Matches your "Studio" card style
    }
  });
};
import { clearAuthSession } from "./authSession";

export default function LogoutButton() {
  function handleLogout() {
    clearAuthSession();
    window.location.href = "/";
  }

  return (
    <button type="button" onClick={handleLogout}>
      Logout
    </button>
  );
}

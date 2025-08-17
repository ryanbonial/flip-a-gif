export function showError(message) {
  const errorMessageElement = document.getElementById("errorMessage");
  if (!errorMessageElement) return;
  errorMessageElement.textContent = message;
  errorMessageElement.style.display = "block";
}

export function hideError() {
  const errorMessageElement = document.getElementById("errorMessage");
  if (!errorMessageElement) return;
  errorMessageElement.style.display = "none";
}

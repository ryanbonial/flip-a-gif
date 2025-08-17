// Terms and Conditions Modal
const termsBtn = document.getElementById("termsBtn");
const termsModal = document.getElementById("termsModal");
const closeTerms = document.getElementById("closeTerms");

termsBtn.addEventListener("click", () => {
  termsModal.showModal();
});

closeTerms.addEventListener("click", () => {
  termsModal.close();
});

// Close modal when clicking outside
termsModal.addEventListener("click", (e) => {
  if (e.target === termsModal) {
    termsModal.close();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && termsModal.open) {
    termsModal.close();
  }
});

//Events
const form = document.getElementById("form");


form.addEventListener("submit", (e) => {
  e.preventDefault();
  loginExistingUser(db);
});

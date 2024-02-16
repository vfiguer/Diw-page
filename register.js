//Events
const form = document.getElementById("form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addUser(db);
  // var password = document.getElementById("password").value;
  // var decrypted = CryptoJS.AES.decrypt(encrypted, cryptoKey);
  // const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
  // console.log(decryptedString);
});

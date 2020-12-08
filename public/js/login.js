const form = document.getElementById("login-in");
const email = document.getElementById("email");
const password = document.getElementById("password");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  checkInputs();
});

function checkInputs() {
  // trim to remove the whitespaces
  const emailValue = email.value.trim();
  const passwordValue = password.value.trim();

  if (emailValue === "") {
    setErrorFor(email, "Email is required!");
  } else if (!isEmail(emailValue)) {
    setErrorFor(email, "Invalid email!");
  } else {
    setSuccessFor(email);
  }

  if (passwordValue === "") {
    setErrorFor(password, "Password is required!");
  } else if (passwordValue.length <= 7) {
    setErrorFor(password, "Password must be atleast 8 characters");
  } else {
    setSuccessFor(password);
  }
}

function setErrorFor(input, message) {
  const formControl = input.parentElement;
  const small = formControl.querySelector("small");
  formControl.className = "form-control error";
  small.innerText = message;
}

function setSuccessFor(input) {
  const formControl = input.parentElement;
  formControl.className = "form-control success";
}

function isEmail(email) {
  const validate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return validate.test(String(email).toLowerCase());
}

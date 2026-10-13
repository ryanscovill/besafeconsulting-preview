// Booking form: no server, so build a pre-filled email instead.
const form = document.getElementById("contact-form");
const errorBox = document.getElementById("form-error");
const BOOKING_EMAIL = "info@besafeconsulting.ca";

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const required = [...form.querySelectorAll("[required]")];
  required.forEach((el) => el.removeAttribute("aria-invalid"));
  const missing = required.filter((el) => !el.value.trim() || !el.checkValidity());

  if (missing.length) {
    missing.forEach((el) => el.setAttribute("aria-invalid", "true"));
    const names = missing.map((el) => el.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
    errorBox.textContent = `Add your ${list} so Dean can reply.`;
    errorBox.hidden = false;
    missing[0].focus();
    return;
  }
  errorBox.hidden = true;

  const data = new FormData(form);
  const subject = `Course booking request: ${data.get("course")}`;
  const lines = [`Name: ${data.get("name")}`, `Email: ${data.get("email")}`];
  if (data.get("organization")) lines.push(`Organization: ${data.get("organization")}`);
  lines.push(`Course: ${data.get("course")}`);
  if (data.get("size")) lines.push(`Number of people: ${data.get("size")}`);
  if (data.get("message")) lines.push("", data.get("message"));
  const body = lines.join("\n");

  window.location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.getElementById("year").textContent = new Date().getFullYear();

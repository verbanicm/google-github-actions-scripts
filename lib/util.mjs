export function getDate() {
  const d = new Date();
  return (
    d.getFullYear() +
    `${d.getMonth()}`.padStart(2, "0") +
    `${d.getDate()}`.padStart(2, "0") +
    `${d.getHours()}`.padStart(2, "0") +
    `${d.getMinutes()}`.padStart(2, "0") +
    `${d.getSeconds()}`.padStart(2, "0")
  );
}

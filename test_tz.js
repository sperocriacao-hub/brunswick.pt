const date = new Date('2026-04-08T12:45:13Z'); // 12:45 UTC

const isoString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
}).format(date);

console.log("En-CA is:", isoString);
// Format is usually "2026-04-08, 13:45:13"
const cleanStr = isoString.replace(', ', 'T');
console.log("Clean is:", cleanStr);

const offset = new Date(`${cleanStr}Z`).getTime() - date.getTime();
console.log("Offset in mins:", offset / 60000);

// Pure Node.js script to fetch the local API
fetch('http://localhost:3000/api/qa-tv')
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error("Local fetch failed:", err);
  });

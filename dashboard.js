function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Fetch profile
async function loadProfile() {
  const res = await fetch('/api/user/profile');
  const user = await res.json();
  document.getElementById('username').textContent = user.username;
  document.getElementById('profile').innerHTML = `
    <p>Email: ${user.email}</p>
    <p>Role: ${user.role}</p>
  `;
}
loadProfile();


// Report Lost Item
document.getElementById("reportForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;
  const date = document.getElementById("date").value;
  const contact = document.getElementById("contact").value; // ✅ new field

  fetch("http://localhost:5000/api/user/report", {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, location, date, contact }) // ✅ include contact
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("reportMessage").innerText = "✅" + data.message;
    document.getElementById("reportForm").reset();
  })
  .catch(err => {
    console.error("Error:", err);
    document.getElementById("reportMessage").innerText = "❌ Failed to submit report.";
  });
});



// Search Items
async function searchItems() {
  const query = document.getElementById('searchQuery').value;
  const res = await fetch(`/api/user/search?query=${query}`);
  const items = await res.json();
  document.getElementById('results').innerHTML = items.map(i => `<p>${i.title} - ${i.description}</p>`).join('');
}

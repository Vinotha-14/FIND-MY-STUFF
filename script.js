// ==========================
// Handle Lost Item Submission
// ==========================
if (document.getElementById("lostForm")) {
  document.getElementById("lostForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const item = {
      name: document.getElementById("name").value,
      description: document.getElementById("description").value,
      location: document.getElementById("location").value,
      date: document.getElementById("date").value,
      contact: document.getElementById("contact").value,
    };

    try {
      const res = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      const data = await res.json();
      alert(data.message || "Item reported successfully!");
      document.getElementById("lostForm").reset();
    } catch (err) {
      console.error(err);
      alert("❌ Error saving item. Please try again.");
    }
  });
}

// ==========================
// Display Items on Found Page
// ==========================
if (document.getElementById("itemsList")) {
  async function loadItems() {
    try {
      const res = await fetch("http://localhost:5000/api/items");
      const items = await res.json();

      let listDiv = document.getElementById("itemsList");
      listDiv.innerHTML = items.map(item => 
        `<div class="item-card">
            <h3>${item.name}</h3>
            <p><b>Description:</b> ${item.description}</p>
            <p><b>Location:</b> ${item.location}</p>
            <p><b>Date:</b> ${item.date}</p>
            <p><b>Contact:</b> ${item.contact}</p>
            <p class="${item.status === 'Lost' ? 'status-lost' : 'status-returned'}">
               Status: ${item.status}
            </p>
         </div>`
      ).join("");
    } catch (err) {
      console.error(err);
      document.getElementById("itemsList").innerHTML = "<p>❌ Error loading items.</p>";
    }
  }

  loadItems();
}

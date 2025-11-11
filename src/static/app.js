document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Inject styles to hide bullets for participant lists and style delete button
  const style = document.createElement('style');
  style.innerHTML = `
    .participants-list { list-style-type: none; padding: 0; margin: 0; }
    .participant-item { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; }
    .participant-email { margin-right: 8px; }
    .delete-participant { background: transparent; border: none; color: #c00; cursor: pointer; font-size: 0.9em; }
    .delete-participant:hover { opacity: 0.8; }
  `;
  document.head.appendChild(style);

  // Function to fetch activities from API and render them
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear content
      activitiesList.innerHTML = "";

      // Reset select
      activitySelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '-- Select an activity --';
      activitySelect.appendChild(placeholder);

      // Populate activities
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsListItems = details.participants.length > 0
          ? details.participants.map(p => `
              <li class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}">
                <span class="participant-email">${p}</span>
                <button class="delete-participant" title="Unregister" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}">❌</button>
              </li>
            `).join("")
          : `<li><em>No participants yet</em></li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
            <ul class="participants-list">
              ${participantsListItems}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach delete handlers after DOM insertion
      document.querySelectorAll('.delete-participant').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const activity = decodeURIComponent(btn.dataset.activity);
          const email = decodeURIComponent(btn.dataset.email);
          if (!confirm(`Unregister ${email} from ${activity}?`)) return;
          try {
            const resp = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            const resJson = await resp.json();
            if (resp.ok) {
              messageDiv.textContent = resJson.message;
              messageDiv.className = 'success';
              // refresh activities
              await fetchActivities();
            } else {
              messageDiv.textContent = resJson.detail || 'Failed to unregister';
              messageDiv.className = 'error';
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          } catch (err) {
            console.error('Error unregistering participant:', err);
            messageDiv.textContent = 'Failed to unregister. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          }
        });
      });

    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities(); // Refresh activities list
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

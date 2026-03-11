document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const accountButton = document.getElementById("account-button");
  const accountButtonLabel = document.getElementById("account-button-label");
  const authPanel = document.getElementById("auth-panel");
  const authStatus = document.getElementById("auth-status");
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");
  const loginButton = document.getElementById("login-button");
  const teacherHelper = document.getElementById("teacher-helper");

  let teacherSession = {
    authenticated: false,
    username: null,
  };

  function showMessage(text, tone) {
    messageDiv.textContent = text;
    messageDiv.className = tone;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function updateTeacherUi() {
    const isAuthenticated = teacherSession.authenticated;

    signupForm.querySelectorAll("input, select, button").forEach((element) => {
      element.disabled = !isAuthenticated;
    });

    signupForm.classList.toggle("disabled-form", !isAuthenticated);
    logoutButton.classList.toggle("hidden", !isAuthenticated);
    loginButton.classList.toggle("hidden", isAuthenticated);

    accountButtonLabel.textContent = isAuthenticated
      ? `Teacher: ${teacherSession.username}`
      : "Teacher Login";

    authStatus.textContent = isAuthenticated
      ? `Logged in as ${teacherSession.username}. You can register or remove students.`
      : "Teachers can log in to manage registrations.";

    teacherHelper.textContent = isAuthenticated
      ? "Teacher mode is active. Registrations and removals are enabled."
      : "Log in as a teacher to register or remove students from activities.";
  }

  async function refreshTeacherSession() {
    const response = await fetch("/auth/session");
    teacherSession = await response.json();
    updateTeacherUi();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${teacherSession.authenticated ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Remove</button>` : ""}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (teacherSession.authenticated) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
        if (response.status === 401) {
          await refreshTeacherSession();
        }
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  accountButton.addEventListener("click", () => {
    authPanel.classList.toggle("hidden");
    accountButton.setAttribute(
      "aria-expanded",
      String(!authPanel.classList.contains("hidden"))
    );
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Unable to log in", "error");
        return;
      }

      loginForm.reset();
      await refreshTeacherSession();
      await fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Login failed. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      const result = await response.json();

      teacherSession = {
        authenticated: false,
        username: null,
      };
      updateTeacherUi();
      await fetchActivities();
      showMessage(result.message || "Logged out", response.ok ? "success" : "error");
    } catch (error) {
      showMessage("Logout failed. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
        if (response.status === 401) {
          await refreshTeacherSession();
        }
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  refreshTeacherSession().then(fetchActivities);
});

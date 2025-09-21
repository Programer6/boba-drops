const BASE_DOMAIN = "api2.hackclub.com";
const BATCH_SIZE = 50;

let allSubmissions = [];
let currentIndex = 0;
let submissionStatus = "All";
const urlParams = new URLSearchParams(window.location.search);
const statusQuery = urlParams.get("status");
let eventCode = urlParams.get("eventCode") || "";

document.getElementById("event-input").value = eventCode;

if (["All", "Approved", "Pending", "Rejected"].includes(statusQuery)) {
  submissionStatus = statusQuery;
}

document
  .getElementById(`status-${submissionStatus.toLowerCase()}`)
  .classList.add("active");

async function fetchAllData() {
  const galleryGrid = document.getElementById("grid-gallery");
  galleryGrid.innerHTML = "<h3><i class='fa-solid fa-spinner fa-spin'></i> Loading submissions...</h3>";

  const params = new URLSearchParams();
  let filterFormula = "AND(";
  if (submissionStatus !== "All") {
    filterFormula += `{Status} = '${submissionStatus}'`;
  }
  if (eventCode !== "") {
    if (submissionStatus !== "All") { filterFormula += ","; }
    filterFormula += `{Event Code} = '${eventCode}'`;
  }
  filterFormula += ")";
  
  params.append(
    "select",
    JSON.stringify({ 
      filterByFormula: filterFormula,
      sort: [{ field: "Created At", direction: "desc" }] 
    })
  );
  params.append("cache", true);

  try {
    const response = await fetch(`https://${BASE_DOMAIN}/v0.1/Boba Drops/Websites?${params}`);
    allSubmissions = await response.json();
    
    if (allSubmissions.length === 0) {
      galleryGrid.innerHTML = "<h1 style='text-align: center;'>No submissions found</h1>";
      return;
    }
    
    galleryGrid.innerHTML = "";
    renderMoreSubmissions();
    setupIntersectionObserver();
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    galleryGrid.innerHTML = "<h1 style='text-align: center;'>Failed to load submissions. Please try again.</h1>";
  }
}

function renderMoreSubmissions() {
  const galleryGrid = document.getElementById("grid-gallery");
  const fragment = document.createDocumentFragment();
  const nextIndex = Math.min(currentIndex + BATCH_SIZE, allSubmissions.length);

  for (let i = currentIndex; i < nextIndex; i++) {
    const submission = allSubmissions[i];
    let photoUrl;
    const screenshot = submission.fields.Screenshot?.[0];

    if (screenshot) {
      photoUrl = screenshot.thumbnails?.large?.url || screenshot.url;
    } else {
      photoUrl = "https://hc-cdn.hel1.your-objectstorage.com/s/v3/ee0109f20430335ebb5cd3297a973ce244ed01cf_depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";
    }

    const div = document.createElement('div');
    div.className = 'grid-submission';
    div.innerHTML = `
      <div class="submission-photo" style="background-image: url(${photoUrl});"></div>
      <span class="status ${submission.fields.Status.toLowerCase()}"></span>
      <div class="links">
        <a href="${submission.fields["Code URL"]}" class="github-button" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Github</a>
        <a href="${submission.fields["Playable URL"]}" class="demo-button" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> Demo</a>
      </div>
    `;
    fragment.appendChild(div);
  }

  galleryGrid.appendChild(fragment);
  currentIndex = nextIndex;
}

function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && currentIndex < allSubmissions.length) {
            renderMoreSubmissions();
        }
    }, { rootMargin: "200px" });

    const lastElement = document.querySelector("#grid-gallery > .grid-submission:last-child");
    if (lastElement) {
        observer.observe(lastElement);
    }
}

const form = document.getElementById("event-code-search");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const eventCode = document.getElementById("event-input").value.trim();
  window.location.href = `?eventCode=${eventCode}&status=${submissionStatus}`;
});

fetchAllData();

document.addEventListener('DOMContentLoaded', () => {
  // Get references to DOM elements
  const scheduleResults = document.getElementById('scheduleResults');
  const dateInput = document.getElementById('scheduleDate');
  const countrySelect = document.getElementById('scheduleCountry');

  // Set date input to today by default
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Constants for time window and column width
  const TIME_WINDOW = 6;
  const NETWORK_COL_WIDTH = '200px';

  // Country time offsets and labels
  const countryTimeOffsets = {
    US: { offset: -4, label: 'United States (GMT-4)' },
    GB: { offset: 1, label: 'United Kingdom (GMT+1)' },
    CA: { offset: -4, label: 'Canada (GMT-4)' },
    AU: { offset: 10, label: 'Australia (GMT+10)' }
  };

  // Populate country dropdown with supported countries
  countrySelect.innerHTML = '';
  Object.entries(countryTimeOffsets).forEach(([code, data]) => {
    if (data.label) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = data.label;
      countrySelect.appendChild(option);
    }
  });

  // Set default country
  countrySelect.value = 'US';

  // State variables for visible slots and schedule data
  let visibleStartIndex = 0;
  let currentFilteredSlots = [];
  let currentScheduleData = [];

  // Fetch schedule data from TVMaze API
  function fetchSchedule() {
    const date = dateInput.value;
    const country = countrySelect.value;
    scheduleResults.innerHTML = '<p class="text-center">Loading...</p>';

    fetch(`https://api.tvmaze.com/schedule?country=${country}&date=${date}`)
      .then(res => res.json())
      .then(data => {
        currentScheduleData = data;
        renderScheduleGrid();
      })
      .catch(err => {
        scheduleResults.innerHTML = '<p class="text-danger text-center">Failed to load schedule.</p>';
        console.error(err);
      });
  }

  // Render the schedule grid/table
  function renderScheduleGrid() {
    const data = currentScheduleData;
    if (!data.length) {
      scheduleResults.innerHTML = '<p class="text-center">No shows scheduled for this date.</p>';
      return;
    }

    // Get selected country and its time offset
    const countryCode = countrySelect.value;
    const offset = countryTimeOffsets[countryCode]?.offset ?? 0;

    // Determine if viewing today or another date
    const selectedDate = new Date(dateInput.value);
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const showAll = dateInput.value !== todayDate;

    // Calculate current time in selected country's timezone
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const local = new Date(utc + (3600000 * offset));
    const currentHour = local.getHours();
    const currentMinute = local.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${currentMinute < 30 ? '00' : '30'}`;

    // Build set of unique time slots and map of networks to their shows
    const timeSlots = new Set();
    const networkMap = {};

    data.forEach(entry => {
      const network = entry.show.network?.name;
      const airtime = entry.airtime;
      // Skip shows without network or airtime, or shows before current time (if today)
      if (!network || !airtime || (!showAll && airtime < currentTime)) return;
      if (!networkMap[network]) networkMap[network] = [];
      networkMap[network].push(entry);
      timeSlots.add(airtime);
    });

    // Sort time slots and update state
    const sortedSlots = Array.from(timeSlots).sort();
    currentFilteredSlots = sortedSlots;

    // Determine which slots are visible in the current window
    const totalSlots = sortedSlots.length;
    const visibleSlots = sortedSlots.slice(visibleStartIndex, visibleStartIndex + TIME_WINDOW);

    let html = '';

    // Build table header with navigation buttons and time slots
    html += `<div class=\"table-responsive w-100\">
      <table class=\"table table-bordered align-middle text-center small w-100\" style=\"table-layout: fixed;\">
        <thead>
          <tr>
            <th style=\"min-width: ${NETWORK_COL_WIDTH}; max-width: ${NETWORK_COL_WIDTH}; width: ${NETWORK_COL_WIDTH};\">
              <div class=\"d-flex justify-content-between align-items-center\">
                <button class=\"schedule-nav-btn\" id=\"prevSlots\" ${visibleStartIndex === 0 ? 'disabled' : ''}>&laquo;</button>
                <button class=\"schedule-nav-btn\" id=\"nextSlots\" ${visibleStartIndex + TIME_WINDOW >= totalSlots ? 'disabled' : ''}>&raquo;</button>
              </div>
            </th>`;

    // Add time slot columns, highlight current time if today
    visibleSlots.forEach(time => {
      const isNow = (time === currentTime && !showAll);
      html += `<th class="${isNow ? 'table-warning' : ''}">${time}</th>`;
    });

    html += '</tr></thead><tbody>';

    // Build table rows for each network
    Object.keys(networkMap).sort().forEach(network => {
      const shows = networkMap[network];
      const row = [];
      // For each visible slot, find show or leave cell empty
      visibleSlots.forEach(slot => {
        const show = shows.find(s => s.airtime === slot);
        if (show) {
          // Calculate colspan based on show runtime (default 30 min)
          const span = Math.max(Math.round((show.runtime || 30) / 30), 1);
          row.push({ show, colspan: span });
        } else {
          row.push(null);
        }
      });

      // Render network name cell
      html += `<tr><td style="min-width: ${NETWORK_COL_WIDTH}; max-width: ${NETWORK_COL_WIDTH}; width: ${NETWORK_COL_WIDTH}; white-space: nowrap;"><strong>${network}</strong></td>`;

      // Render show cells or empty cells
      for (let i = 0; i < row.length; i++) {
        const cell = row[i];
        if (cell) {
          html += `<td colspan="${cell.colspan}" style="min-width: 120px;"><a href="show-info.html?id=${cell.show.show.id}" class="text-decoration-none">${cell.show.show.name}: S${cell.show.season}E${cell.show.number}</a></td>`;
          i += cell.colspan - 1;
        } else {
          html += '<td></td>';
        }
      }
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    scheduleResults.innerHTML = html;

    // Add event listeners for navigation buttons
    document.getElementById('prevSlots')?.addEventListener('click', () => {
      visibleStartIndex = Math.max(0, visibleStartIndex - TIME_WINDOW);
      renderScheduleGrid();
    });

    document.getElementById('nextSlots')?.addEventListener('click', () => {
      visibleStartIndex = Math.min(currentFilteredSlots.length - TIME_WINDOW, visibleStartIndex + TIME_WINDOW);
      renderScheduleGrid();
    });
  }

  // Event: Date changed
  dateInput.addEventListener('change', () => {
    visibleStartIndex = 0;
    fetchSchedule();
  });

  // Event: Country changed
  countrySelect.addEventListener('change', () => {
    visibleStartIndex = 0;
    fetchSchedule();
  });

  // Initial fetch on page load
  fetchSchedule();
});

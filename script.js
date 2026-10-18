// Global State
let games = JSON.parse(localStorage.getItem('worldOfGamesData')) || [];
let filteredGames = [...games];
let currentPage = 1;
let currentBacklogPage = 1; 
let currentCompletedPage = 1; 
const rowsPerPage = 25;
let backupCounter = 0;
let sortAsc = true;

// Check if the URL has a filter command when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterTerm = urlParams.get('filter');

    if (filterTerm) {
        document.getElementById('searchInput').value = filterTerm;
        handleSearch(); 
    }
});
// Function to handle the file selection event
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        importCSVData(text);
        event.target.value = ''; // Reset input
    };
    reader.readAsText(file);
}

// Function to safely parse CSV text into your 12-element game array format
function importCSVData(csvText) {
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length === 0) return;

    let importedCount = 0;

    lines.forEach((line, index) => {
        // Skip empty lines or header row
        if (!line.trim() || (index === 0 && line.toLowerCase().includes('name'))) return;

        const cols = parseCSVLine(line);
        if (cols.length < 2 || !cols[1]) return; // Skip invalid rows

        // Map CSV columns strictly to your 12-index array structure:
        // [ID, Name, Year, Publisher, Genre, Series, Launch, Platform, DateDone, AchTotal, AchEarned, Status]
        const newGameRow = [
            (games.length + importedCount + 1).toString(), // 0: ID
            cols[1] || '',                                 // 1: Name
            cols[2] || '',                                 // 2: Year
            cols[3] || '',                                 // 3: Publisher
            cols[4] || '',                                 // 4: Genre
            cols[5] || '',                                 // 5: Series
            cols[6] || '',                                 // 6: Launch
            cols[7] || '',                                 // 7: Platform
            cols[8] || '',                                 // 8: Date Done
            cols[9] || '0',                                // 9: Ach Total
            cols[10] || '0',                               // 10: Ach Earned
            cols[11] || 'Backlog'                          // 11: Status (Defaults to Backlog if missing)
        ];

        games.push(newGameRow);
        importedCount++;
    });

    if (importedCount > 0) {
        // Re-index all games just to be safe
        games.forEach((g, i) => g[0] = (i + 1).toString());
        
        // Save to localStorage
        localStorage.setItem('worldOfGamesData', JSON.stringify(games));

        // Refresh UI
        if (typeof renderTable === 'function') renderTable();
        if (typeof updateSidebarStats === 'function') updateSidebarStats();

        alert(`Successfully imported ${importedCount} games!`);
    } else {
        alert('No valid game rows found in the CSV file.');
    }
}

// Helper function to handle quotes and commas inside cells correctly
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += c;
        }
    }
    result.push(cell.trim());
    return result;
}
function toTitleCase(str) {
    if (!str) return "";
    return str; // Preserves exact casing entered by the user
}

function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').trim();
}

function updateHint() {
    const name = document.getElementById('inName').value;
    const hint = document.getElementById('urlHint');
    if (hint) {
        hint.innerText = name ? `PATH: games/${slugify(name)}.html` : "PATH: games/none.html";
    }
}

function updateSidebarStats() {
    if (!games || games.length === 0) {
        const cachedData = localStorage.getItem('worldOfGamesData');
        if (cachedData) {
            games = JSON.parse(cachedData);
            filteredGames = [...games];
        }
    }

    if (!games || games.length === 0) return;
    
    const total = games.length;
    const completedCount = games.filter(g => g[11] === "Completed").length;
    const backlogCount = games.filter(g => g[11] === "Backlog").length;
    const playingCount = games.filter(g => g[11] === "Playing").length;

    if (document.getElementById('gameCounter')) {
        document.getElementById('gameCounter').innerText = total;
    }
    if (document.getElementById('completedCounter')) document.getElementById('completedCounter').innerText = completedCount;
    if (document.getElementById('completedCount')) document.getElementById('completedCount').innerText = completedCount;
            
    if (document.getElementById('backlogCounter')) document.getElementById('backlogCounter').innerText = backlogCount;
    if (document.getElementById('backlogCount')) document.getElementById('backlogCount').innerText = backlogCount;

    if (document.getElementById('playingCount')) {
        document.getElementById('playingCount').innerText = playingCount;
    }

    const pPercent = document.getElementById('progressPercent');
    const pBar = document.getElementById('overallProgressBar');

    if (total > 0 && pPercent && pBar) {
        const overallPercent = Math.round((completedCount / total) * 100);
        pPercent.innerText = overallPercent + "%";
        pBar.style.width = overallPercent + "%";
    }
}
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return; 
    tableBody.innerHTML = "";

    const total = games.length;
    const completedCount = games.filter(g => g[11] === "Completed").length;
    const backlogCount = games.filter(g => g[11] === "Backlog").length;

    if (document.getElementById('gameCounter')) document.getElementById('gameCounter').innerText = total;
    if (document.getElementById('completedCounter')) document.getElementById('completedCounter').innerText = completedCount;
    if (document.getElementById('backlogCounter')) document.getElementById('backlogCounter').innerText = backlogCount; 

    const pPercent = document.getElementById('progressPercent');
    const pBar = document.getElementById('overallProgressBar');

    if (total > 0 && pPercent && pBar) {
        const overallPercent = Math.round((completedCount / total) * 100);
        pPercent.innerText = overallPercent + "%";
        pBar.style.width = overallPercent + "%";
    }

    let displayList = (document.getElementById('searchInput') && document.getElementById('searchInput').value !== "") 
        ? filteredGames 
        : games;

    displayList.sort((a, b) => {
        let nameA = (a[1] || "").toLowerCase();
        let nameB = (b[1] || "").toLowerCase();
        if (sortAsc) return nameA < nameB ? -1 : 1;
        return nameA > nameB ? -1 : 1;
    });

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = displayList.slice(start, start + rowsPerPage);

    pageItems.forEach((game, i) => {
        const row = document.createElement('tr');

        const realIndex = games.findIndex(g => g === game);
        
        const launchesArray = (game[6] || '').toString().split(',').filter(Boolean);
        const launchesHtml = launchesArray.length > 0
        ? launchesArray.join('<br>')
        : '-';
        

        const platformsArray = (game[7] || '').toString().split(', ').filter(Boolean);
        const platformsHtml = platformsArray.length > 0 
            ? platformsArray.map(p => `<div style="padding: 2px 0;">${p}</div>`).join('') 
            : '';

        const datesArray = (game[8] || '').toString().split(', ').filter(Boolean);
        const datesHtml = datesArray.length > 0 
            ? datesArray.map(d => `<div style="padding: 2px 0;">${d}</div>`).join('') 
            : '';

        const totalAchStr = (game[9] || '0').toString();
        const earnedAchStr = (game[10] || '0').toString();

        const totalsArray = totalAchStr.split(', ');
        const earnedArray = earnedAchStr.split(', ');

        let achievementsHtml = '';
        const maxSets = Math.max(totalsArray.length, earnedArray.length, 1);

        for (let idx = 0; idx < maxSets; idx++) {
            const totalAch = parseInt(totalsArray[idx]) || 0;
            const earnedAch = parseInt(earnedArray[idx]) || 0;

            if (totalAch > 0) {
                const percentage = Math.round((earnedAch / totalAch) * 100);
                achievementsHtml += `
                    <div class="progress-container" style="margin: 3px 0;">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                        <span class="progress-text">${earnedAch}/${totalAch}</span>
                    </div>
                `;
            }
        }

        if (!achievementsHtml) {
            achievementsHtml = `<span style="color: #484f58;">—</span>`;
        }

        const statusClass = game[11] === 'Playing' ? 'btn-status-playing' : game[11] === 'Backlog' ? 'btn-status-backlog' : '';

        row.innerHTML = `
            <td style="color: var(--year-color); vertical-align: middle;">${start + i + 1}</td>
            <td style="font-weight: bold; color: #ffffff;">${game[1]}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[2]}';">${game[2]}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[3]}';">${game[3]}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[4]}';">${game[4]}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[5]}';">${game[5]}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[6]}';">${launchesHtml}</td>
            <td class="clickable-cell" onclick="location.href='WOG.html?filter=${game[7]}';">${platformsHtml}</td>
            <td class="clickable-cell" style="color: #f85149;" onclick="location.href='WOG.html?filter=${game[8]}';">${datesHtml}</td>
            <td>${achievementsHtml}</td>
            <td style="font-weight: bold; color: ${game[11] === 'Completed' ? '#3fb950' : game[11] === 'Playing' ? '#58a6ff' : '#f85149'};">${game[11]}</td>
            <td class="action-buttons-cell">
                <button class="btn-action btn-edit" onclick="prepareEdit(${realIndex})">EDIT</button>
                <button class="btn-action btn-copy" onclick="duplicateGame(${realIndex})">COPY</button>
                
                <button class="btn-action btn-series" onclick="quickFilter('${game[5]}')">+SERIES</button>
                <button class="btn-action btn-del" onclick="deleteGame(${realIndex})">DEL</button>
            </td>
        `;

        tableBody.appendChild(row);
    });   

    setupPagination(displayList.length);
}

function duplicateGame(index) {
    const original = games[index];
    const duplicate = [...original]; 
    duplicate[0] = (games.length + 1).toString(); 
    duplicate[1] = original[1] + " (Copy)"; 
    
    games.push(duplicate);
    saveAndRefresh();
}

function quickFilter(value) {
    document.getElementById('searchInput').value = value;
    handleSearch();
}

function handleSearch() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    filteredGames = games.filter(g => 
        g.some(cell => cell && cell.toString().toLowerCase().includes(term))
    );
    currentPage = 1;
    renderTable();
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    filteredGames = [...games];
    currentPage = 1;
    renderTable();
}

function addGame() {
    const nameInput = document.getElementById('inName').value;
    if (!nameInput || !nameInput.trim()) {
        alert("Game Name Required");
        return;
    }

    const name = nameInput.trim();
    const newId = (games.length + 1).toString();
    const platforms = getPlatformEntriesFromForm();

    const launches = platforms.map(p => p.launch).filter(Boolean).join(', ');
    const platNames = platforms.map(p => p.platform).filter(Boolean).join(', ');
    const dates = platforms.map(p => p.dateFinished).filter(Boolean).join(', ');
    
    const achTotal = platforms.map(p => p.achTotal || 0).join(', ');
    const achEarned = platforms.map(p => p.achEarned || 0).join(', ');

    const newRow = [
        newId,
        name,
        document.getElementById('inYear').value || "",
        document.getElementById('inPub').value || "",
        document.getElementById('inGenre').value || "",
        document.getElementById('inSeries').value || "",
        launches,
        platNames,
        dates,
        achTotal,
        achEarned,
        document.getElementById('inStatus').value || "Backlog"
    ];

    games.push(newRow);
    saveAndRefresh();
}

function prepareEdit(index) {
    const game = games[index];
    if (!game) return;

    document.getElementById('editIndex').value = index;
    document.getElementById('inName').value = game[1] || '';
    document.getElementById('inYear').value = game[2] || '';
    document.getElementById('inPub').value = game[3] || '';
    document.getElementById('inGenre').value = game[4] || '';
    document.getElementById('inSeries').value = game[5] || '';
    document.getElementById('inStatus').value = game[11] || 'Backlog';

    const launches = (game[6] || '').split(/,\s*/);
    const platforms = (game[7] || '').split(/,\s*/);
    const dates = (game[8] || '').split(/,\s*/);
    const totals = (game[9] || '0').toString().split(/,\s*/);
    const earned = (game[10] || '0').toString().split(/,\s*/);

    const container = document.getElementById('platformEntriesContainer');
    if (container) container.innerHTML = ''; 

    const maxRows = Math.max(launches.length, platforms.length, dates.length, totals.length, 1);

    for (let i = 0; i < maxRows; i++) {
        addPlatformRow({
            launch: launches[i] || '',
            platform: platforms[i] || '',
            dateFinished: dates[i] || '',
            achTotal: parseInt(totals[i]) || 0,
            achEarned: parseInt(earned[i]) || 0
        });
    }

    document.getElementById('formTitle').innerText = "Edit: " + (game[1] || 'Game');
    document.getElementById('addBtn').style.display = 'none';
    document.getElementById('updateBtn').style.display = 'block';
    window.scrollTo(0, 0);
}

function deleteGame(index) {
    if(confirm("Delete " + games[index][1] + "?")) {
        games.splice(index, 1);
        games.forEach((g, i) => g[0] = (i + 1).toString());
        saveAndRefresh();
    }
}

function updateGame() {
    const index = document.getElementById('editIndex').value;
    if (index === "" || index === null || index === undefined) {
        alert("Select a game first");
        return;
    }

    const nameInput = document.getElementById('inName').value;
    if (!nameInput.trim()) {
        alert("Game Name Required");
        return;
    }

    const name = nameInput.trim();
    const platforms = getPlatformEntriesFromForm();

    const launches = platforms.map(p => p.launch).filter(Boolean).join(', ');
    const platNames = platforms.map(p => p.platform).filter(Boolean).join(', ');
    const dates = platforms.map(p => p.dateFinished).filter(Boolean).join(', ');

    const achTotal = platforms.map(p => p.achTotal || 0).join(', ');
    const achEarned = platforms.map(p => p.achEarned || 0).join(', ');

    games[index] = [
        (parseInt(index) + 1).toString(),
        name,
        document.getElementById('inYear').value || "",
        document.getElementById('inPub').value || "",
        document.getElementById('inGenre').value || "",
        document.getElementById('inSeries').value || "",
        launches,
        platNames,
        dates,
        achTotal,
        achEarned,
        document.getElementById('inStatus').value || "Backlog"
    ];

    document.getElementById('addBtn').style.display = 'block';
    document.getElementById('updateBtn').style.display = 'none';
    document.getElementById('formTitle').innerText = 'System Entry';

    saveAndRefresh(name);
    clearForm();
}

function resetDatabase() {
    if (confirm("Delete ALL games?")) {
        games = [];
        saveAndRefresh();
    }
}

function saveAndRefresh(targetGameName = null) {
    localStorage.setItem('worldOfGamesData', JSON.stringify(games));

    const nameInput = document.getElementById('inName') ? document.getElementById('inName').value.trim() : '';
    const formattedName = targetGameName || nameInput;

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = ""; 
    filteredGames = [...games]; 
    
    const sortedList = [...games].sort((a, b) => {
        let nameA = (a[1] || "").toLowerCase();
        let nameB = (b[1] || "").toLowerCase();
        return nameA < nameB ? -1 : 1;
    });

    if (formattedName) {
        const gameIndex = sortedList.findIndex(g => g[1] === formattedName);
        if (gameIndex !== -1) {
            currentPage = Math.ceil((gameIndex + 1) / rowsPerPage);
        }
    }

    renderTable();
    updateSidebarStats();

    if (formattedName) {
        triggerFlash(formattedName);
    }

    clearForm();
}

function setupPagination(totalItems) {
    const pageCount = Math.ceil(totalItems / rowsPerPage);
    const wrapper = document.getElementById('pagination');
    if (!wrapper) return;
    wrapper.innerHTML = "";
    
    if (pageCount <= 1) return;

    let prevBtn = document.createElement('button');
    prevBtn.innerText = "« Prev";
    prevBtn.disabled = (currentPage === 1);
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
    wrapper.appendChild(prevBtn);

    for (let i = 1; i <= pageCount; i++) {
        if (i === 1 || i === pageCount || (i >= currentPage - 2 && i <= currentPage + 2)) {
            let btn = document.createElement('button');
            btn.innerText = i;
            if (i === currentPage) btn.classList.add('active');
            btn.onclick = () => { currentPage = i; renderTable(); };
            wrapper.appendChild(btn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            let span = document.createElement('span');
            span.innerText = "...";
            span.style.padding = "0 5px";
            wrapper.appendChild(span);
        }
    } 

    let nextBtn = document.createElement('button');
    nextBtn.innerText = "Next »";
    nextBtn.disabled = (currentPage === pageCount);
    nextBtn.onclick = () => { if (currentPage < pageCount) { currentPage++; renderTable(); } };
    wrapper.appendChild(nextBtn);

    let jumpContainer = document.createElement('div');
    jumpContainer.style.display = "inline-block";
    jumpContainer.style.marginLeft = "20px";
    jumpContainer.innerHTML = `
        <span style="font-size: 12px; color: #8b949e;">Jump to:</span>
        <input type="number" id="jumpPageInput" min="1" max="${pageCount}" 
               style="width: 50px; background: #0d1117; border: 1px solid #30363d; color: white; padding: 2px 5px; border-radius: 4px; margin: 0 5px;" 
               placeholder="${currentPage}">
        <button id="jumpBtn" style="padding: 2px 10px; cursor: pointer; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 4px;">GO</button>
    `;
    wrapper.appendChild(jumpContainer);

    document.getElementById('jumpBtn').onclick = () => {
        const jumpInput = document.getElementById('jumpPageInput');
        let targetPage = parseInt(jumpInput.value);
        if (targetPage >= 1 && targetPage <= pageCount) {
            currentPage = targetPage;
            renderTable();
        } else {
            alert("Please enter a page between 1 and " + pageCount);
        }
    };
}

function clearForm() {
    const fieldsToClear = [
        'inName', 'inYear', 'inPub', 'inGenre', 
        'inSeries', 'editIndex'
    ];

    fieldsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = ""; 
    });
   
    const status = document.getElementById('inStatus');
    if (status) status.value = "Backlog";

    const container = document.getElementById('platformEntriesContainer');
    if (container) {
        container.innerHTML = `
            <div class="platform-entry-block" style="border-bottom: 1px dashed #30363d; padding-bottom: 10px; margin-bottom: 10px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Launch</label>
                        <select class="inLaunch">
                            <option value="">-- Select --</option>
                            <option value="3D Realms">3D Realms</option>
                            <option value="Amazon Games">Amazon Games</option>
                            <option value="EA Play">EA Play</option>
                            <option value="Epic Games">Epic Games</option>
                            <option value="Game Pass">Game Pass</option>
                            <option value="GOG Galaxy">GOG Galaxy</option>
                            <option value="Legacy Games">Legacy Games</option>
                            <option value="Microsoft Store">Microsoft Store</option>
                            <option value="PSN">PSN</option>					
                            <option value="Rockstar Games">Rockstar Games</option>
                            <option value="Steam Games">Steam Games</option>
                            <option value="Ubisoft Connect">Ubisoft Connect</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Platform</label>
                        <select class="inPlat">
                            <option value="">-- Select --</option>
                            <option value="Atari 2600">Atari 2600</option>
                            <option value="Atari 600/800/XL">Atari 600/800/XL</option>
                            <option value="Atari ST/STE">Atari ST/STE</option>
                            <option value="Microsoft Xbox">Microsoft Xbox</option>
                            <option value="Microsoft Xbox 360">Microsoft Xbox 360</option>
                            <option value="Microsoft Xbox One">Microsoft Xbox One</option>
                            <option value="NES">NES</option>
                            <option value="Nintendo 64">Nintendo 64</option>
                            <option value="Nintendo DS">Nintendo DS</option>
                            <option value="Nintendo GameCube">Nintendo GameCube</option>
                            <option value="Nintendo Wii">Nintendo Wii</option>
                            <option value="PSP">PSP</option>
                            <option value="Sega Dreamcast">Sega Dreamcast</option>
                            <option value="Sega Megadrive">Sega Megadrive</option>
                            <option value="Super Nintendo">Super Nintendo</option>
                            <option value="Sony Playstation 1">Sony Playstation 1</option>
                            <option value="Sony Playstation 2">Sony Playstation 2</option>
                            <option value="Sony Playstation 3">Sony Playstation 3</option>
                            <option value="Sony Playstation 4">Sony Playstation 4</option>
                            <option value="Sony Playstation 5">Sony Playstation 5</option>
                            <option value="Windows">Windows</option>
                        </select>
                    </div>
                </div>

                <div class="form-group"><label>Date Finished</label><input type="text" class="inDate"></div>
               
                <div style="display: flex; gap: 10px;">
                    <div class="form-group" style="flex: 1;"><label>Achieve.</label><input type="number" class="inAch"></div>
                    <div class="form-group" style="flex: 1;"><label>Earned</label><input type="number" class="inEarned"></div>
                </div>
            </div>
        `;
    }

    const title = document.getElementById('formTitle');
    if (title) title.innerText = "System Entry";

    if (document.getElementById('addBtn')) document.getElementById('addBtn').style.display = 'block';
    if (document.getElementById('updateBtn')) document.getElementById('updateBtn').style.display = 'none';
}

function exportData() {
    const dataStr = JSON.stringify(games, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'game_archive_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    const now = new Date();
    const timeString = now.toLocaleDateString() + " at " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    localStorage.setItem('lastBackupSavedTime', timeString);
    updateBackupDisplay(timeString);
}

function updateBackupDisplay(timeString) {
    const timeDisplay = document.getElementById('lastBackupTime');
    if (!timeDisplay) return;

    timeDisplay.innerText = timeString;

    const lastBackupDate = new Date(timeString.split(" at ")[0]);
    const today = new Date();
    const diffTime = Math.abs(today - lastBackupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
        timeDisplay.style.color = "#ff4444"; 
        timeDisplay.title = "Warning: Last backup is over a week old!";
    } else {
        timeDisplay.style.color = "#4ade80"; 
    }
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedGames = JSON.parse(e.target.result);
            if (Array.isArray(importedGames)) {
                games = importedGames;
                localStorage.setItem('worldOfGamesData', JSON.stringify(games));
                renderTable();
                alert("Backup restored successfully!");
            }
        } catch (err) {
            alert("Error: This is not a valid backup file.");
        }
    };
    reader.readAsText(event.target.files[0]);
}

function triggerFlash(gameName) {
    setTimeout(() => {
        const rows = document.querySelectorAll('#tableBody tr');
        rows.forEach(row => {
            if (row.cells[1] && row.cells[1].textContent === gameName) {
                row.classList.add('flash-row');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => row.classList.remove('flash-row'), 2000);
            }
        });
    }, 100);
}

function addPlatformRow(data = {}) {
    const container = document.getElementById('platformEntriesContainer');
    if (!container) return;

    const rowDiv = document.createElement('div');
    rowDiv.className = 'platform-entry-block';
    rowDiv.style = "border-bottom: 1px dashed #30363d; padding-bottom: 10px; margin-bottom: 10px; position: relative;";
    
    rowDiv.innerHTML = `
        <button type="button" style="position: absolute; right: 0; top: 0; background: transparent; color: #f85149; border: none; cursor: pointer;" onclick="this.parentElement.remove()">✕ Remove</button>
        <div class="form-row">
            <div class="form-group">
                <label>Launch</label>
                <select class="inLaunch">
                    <option value="">-- Select --</option>
                    <option value="3D Realms" ${data.launch === '3D Realms' ? 'selected' : ''}>3D Realms</option>
                    <option value="Amazon Games" ${data.launch === 'Amazon Games' ? 'selected' : ''}>Amazon Games</option>
                    <option value="EA Play" ${data.launch === 'EA Play' ? 'selected' : ''}>EA Play</option>
                    <option value="Epic Games" ${data.launch && data.launch.includes('Epic') ? 'selected' : ''}>Epic Games</option>
                    <option value="Game Pass" ${data.launch === 'Game Pass' ? 'selected' : ''}>Game Pass</option>
                    <option value="GOG Galaxy" ${data.launch === 'GOG Galaxy' ? 'selected' : ''}>GOG Galaxy</option>
                    <option value="Legacy Games" ${data.launch === 'Legacy Games' ? 'selected' : ''}>Legacy Games</option>
                    <option value="Microsoft Store" ${data.launch === 'Microsoft Store' ? 'selected' : ''}>Microsoft Store</option>
                    <option value="PSN" ${data.launch === 'PSN' ? 'selected' : ''}>PSN</option>
                    <option value="Rockstar Games" ${data.launch === 'Rockstar Games' ? 'selected' : ''}>Rockstar Games</option>
                    <option value="Steam Games" ${data.launch === 'Steam Games' ? 'selected' : ''}>Steam Games</option>
                    <option value="Ubisoft Connect" ${data.launch === 'Ubisoft Connect' ? 'selected' : ''}>Ubisoft Connect</option>
                </select>
            </div>
            <div class="form-group">
                <label>Platform</label>
                <select class="inPlat">
                    <option value="">-- Select --</option>
                    <option value="Atari 2600" ${data.platform === 'Atari 2600' ? 'selected' : ''}>Atari 2600</option>
                    <option value="Atari 600/800/XL" ${data.platform === 'Atari 600/800/XL' ? 'selected' : ''}>Atari 600/800/XL</option>
                    <option value="Atari ST/STE" ${data.platform === 'Atari ST/STE' ? 'selected' : ''}>Atari ST/STE</option>
                    <option value="Microsoft Xbox" ${data.platform === 'Microsoft Xbox' ? 'selected' : ''}>Microsoft Xbox</option>
                    <option value="Microsoft Xbox 360" ${data.platform === 'Microsoft Xbox 360' ? 'selected' : ''}>Microsoft Xbox 360</option>
                    <option value="Microsoft Xbox One" ${data.platform === 'Microsoft Xbox One' ? 'selected' : ''}>Microsoft Xbox One</option>
                    <option value="NES" ${data.platform === 'NES' ? 'selected' : ''}>NES</option>
                    <option value="Nintendo 64" ${data.platform === 'Nintendo 64' ? 'selected' : ''}>Nintendo 64</option>
                    <option value="Nintendo DS" ${data.platform === 'Nintendo DS' ? 'selected' : ''}>Nintendo DS</option>
                    <option value="Nintendo GameCube" ${data.platform === 'Nintendo GameCube' ? 'selected' : ''}>Nintendo GameCube</option>
                    <option value="Nintendo Wii" ${data.platform === 'Nintendo Wii' ? 'selected' : ''}>Nintendo Wii</option>
                    <option value="PSP" ${data.platform === 'PSP' ? 'selected' : ''}>PSP</option>
                    <option value="Sega Dreamcast" ${data.platform === 'Sega Dreamcast' ? 'selected' : ''}>Sega Dreamcast</option>
                    <option value="Sega Megadrive" ${data.platform === 'Sega Megadrive' ? 'selected' : ''}>Sega Megadrive</option>
                    <option value="Super Nintendo" ${data.platform === 'Super Nintendo' ? 'selected' : ''}>Super Nintendo</option>
                    <option value="Sony Playstation 1" ${data.platform === 'Sony Playstation 1' ? 'selected' : ''}>Sony Playstation 1</option>
                    <option value="Sony Playstation 2" ${data.platform === 'Sony Playstation 2' ? 'selected' : ''}>Sony Playstation 2</option>
                    <option value="Sony Playstation 3" ${data.platform === 'Sony Playstation 3' ? 'selected' : ''}>Sony Playstation 3</option>
                    <option value="Sony Playstation 4" ${data.platform === 'Sony Playstation 4' ? 'selected' : ''}>Sony Playstation 4</option>
                    <option value="Sony Playstation 5" ${data.platform === 'Sony Playstation 5' ? 'selected' : ''}>Sony Playstation 5</option>
                    <option value="Windows" ${data.platform === 'Windows' ? 'selected' : ''}>Windows</option>
                </select>
            </div>
        </div>
        <div class="form-group"><label>Date Finished</label><input type="text" class="inDate" value="${data.dateFinished || ''}"></div>
        <div style="display: flex; gap: 10px;">
            <div class="form-group" style="flex: 1;"><label>Achieve.</label><input type="number" class="inAch" value="${data.achTotal || ''}"></div>
            <div class="form-group" style="flex: 1;"><label>Earned</label><input type="number" class="inEarned" value="${data.achEarned || ''}"></div>
        </div>
    `;
    container.appendChild(rowDiv);
}

function getPlatformEntriesFromForm() {
    const blocks = document.querySelectorAll('.platform-entry-block');
    const platforms = [];

    blocks.forEach(block => {
        const launchEl = block.querySelector('.inLaunch');
        const platEl = block.querySelector('.inPlat');
        const dateEl = block.querySelector('.inDate');
        const achEl = block.querySelector('.inAch');
        const earnedEl = block.querySelector('.inEarned');

        const launch = launchEl ? launchEl.value : '';
        const platform = platEl ? platEl.value : '';
        const dateFinished = dateEl ? dateEl.value : '';
        const achTotal = achEl ? (parseInt(achEl.value) || 0) : 0;
        const achEarned = earnedEl ? (parseInt(earnedEl.value) || 0) : 0;

        if (launch || platform || dateFinished) {
            platforms.push({ launch, platform, dateFinished, achTotal, achEarned });
        }
    });

    return platforms;
}

function renderCompleted() {
    const tbody = document.getElementById('completedBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!games || games.length === 0) {
        const cached = localStorage.getItem('worldOfGamesData');
        if (cached) games = JSON.parse(cached);
    }

    const completedGames = (games || []).filter(g => 
        g[11] && g[11].toString().trim().toLowerCase() === 'completed'
    );

    if (document.getElementById('totalCompleted')) {
        document.getElementById('totalCompleted').innerText = completedGames.length;
    }

    if (completedGames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px; color: #8b949e;">No completed games found.</td></tr>`;
        setupSubPagePagination('paginationCompleted', 0, currentCompletedPage, (p) => { currentCompletedPage = p; renderCompleted(); });
        return;
    }

    const start = (currentCompletedPage - 1) * rowsPerPage;
    const pageItems = completedGames.slice(start, start + rowsPerPage);

    pageItems.forEach((game, i) => {
        const row = document.createElement('tr');
        
        const launchesArray = (game[6] || '').toString().split(',').filter(Boolean);
        const launchesHtml = launchesArray.length > 0 ? launchesArray.join('<br>') : '-';

        const platformsArray = (game[7] || '').toString().split(', ').filter(Boolean);
        const platformsHtml = platformsArray.length > 0 ? platformsArray.join('<br>') : '-';

        const datesArray = (game[8] || '').toString().split(', ').filter(Boolean);
        const datesHtml = datesArray.length > 0 ? datesArray.join('<br>') : '-';

        const totalAchStr = (game[9] || '0').toString();
        const earnedAchStr = (game[10] || '0').toString();
        const totalAch = parseInt(totalAchStr) || 0;
        const earnedAch = parseInt(earnedAchStr) || 0;
        
        // Centered fallback dash for the progress column when no achievements exist
        let achHtml = '<div style="text-align: center; color: #484f58;">—</div>';
        if (totalAch > 0) {
            const pct = Math.round((earnedAch / totalAch) * 100);
            achHtml = `
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${pct}%"></div>
                    <span class="progress-text">${earnedAch}/${totalAch}</span>
                </div>`;
        }

        row.innerHTML = `
            <td style="color: var(--year-color);">${start + i + 1}</td>
            <td style="font-weight: bold; color: #ffffff;">${game[1] || ''}</td>
            <td>${game[2] || ''}</td>
            <td>${game[3] || ''}</td>
            <td>${game[4] || ''}</td>
            <td>${game[5] || ''}</td>
            <td>${launchesHtml}</td>
            <td>${platformsHtml}</td>
            <td style="color: #f85149;">${datesHtml}</td>
            <td>${achHtml}</td>
            <td style="font-weight: bold; color: #3fb950;">${game[11] || ''}</td>
        `;
        tbody.appendChild(row);
    });

    setupSubPagePagination('paginationCompleted', completedGames.length, currentCompletedPage, (newPage) => {
        currentCompletedPage = newPage;
        renderCompleted();
    });
}

function renderBacklog() {
    const tbody = document.getElementById('backlogBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!games || games.length === 0) {
        const cached = localStorage.getItem('worldOfGamesData');
        if (cached) games = JSON.parse(cached);
    }

    const backlogGames = (games || []).filter(g => 
        g[11] && g[11].toString().trim().toLowerCase() === 'backlog'
    );

    if (backlogGames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color: #8b949e;">No backlog games found.</td></tr>`;
        setupSubPagePagination('paginationBacklog', 0, currentBacklogPage, (p) => { currentBacklogPage = p; renderBacklog(); });
        return;
    }

    // Pagination calculations
    const start = (currentBacklogPage - 1) * rowsPerPage;
    const pageItems = backlogGames.slice(start, start + rowsPerPage);

    pageItems.forEach((game, i) => {
        const row = document.createElement('tr');

        const launchesArray = (game[6] || '').toString().split(',').filter(Boolean);
        const launchesHtml = launchesArray.length > 0 ? launchesArray.join('<br>') : '-';

        const platformsArray = (game[7] || '').toString().split(', ').filter(Boolean);
        const platformsHtml = platformsArray.length > 0 ? platformsArray.join('<br>') : '-';

        row.innerHTML = `
            <td style="color: var(--year-color);">${start + i + 1}</td>
            <td style="font-weight: bold; color: #ffffff;">${game[1] || ''}</td>
            <td>${game[2] || ''}</td>
            <td>${game[3] || ''}</td>
            <td>${game[4] || ''}</td>
            <td>${game[5] || ''}</td>
            <td>${launchesHtml}</td>
            <td>${platformsHtml}</td>
            <td>0</td>
            <td style="font-weight: bold; color: #f85149;">${game[11] || ''}</td>
        `;
        tbody.appendChild(row);
    });

    setupSubPagePagination('paginationBacklog', backlogGames.length, currentBacklogPage, (newPage) => {
        currentBacklogPage = newPage;
        renderBacklog();
    });
}
function setupSubPagePagination(containerId, totalItems, currentPage, onPageChange) {
    const wrapper = document.getElementById(containerId);
    if (!wrapper) return;
    wrapper.innerHTML = "";

    const pageCount = Math.ceil(totalItems / rowsPerPage);
    if (pageCount <= 1) return;

    // Previous Button
    let prevBtn = document.createElement('button');
    prevBtn.innerText = "« Prev";
    prevBtn.disabled = (currentPage === 1);
    prevBtn.onclick = () => { if (currentPage > 1) onPageChange(currentPage - 1); };
    wrapper.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= pageCount; i++) {
        if (i === 1 || i === pageCount || (i >= currentPage - 2 && i <= currentPage + 2)) {
            let btn = document.createElement('button');
            btn.innerText = i;
            if (i === currentPage) btn.classList.add('active');
            btn.onclick = () => onPageChange(i);
            wrapper.appendChild(btn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            let span = document.createElement('span');
            span.innerText = "...";
            span.style.padding = "0 5px";
            wrapper.appendChild(span);
        }
    }

    // Next Button
    let nextBtn = document.createElement('button');
    nextBtn.innerText = "Next »";
    nextBtn.disabled = (currentPage === pageCount);
    nextBtn.onclick = () => { if (currentPage < pageCount) onPageChange(currentPage + 1); };
    wrapper.appendChild(nextBtn);
}

// SINGLE STARTUP FUNCTION
window.onload = function() {
    updateSidebarStats();

    // Main index table
    if (document.getElementById('tableBody')) {
        renderTable();
    }

    // Completed page table
    if (document.getElementById('completedBody')) {
        renderCompleted();
    }

    // Backlog page table
    if (document.getElementById('backlogBody')) {
        renderBacklog();
    }

    const savedTime = localStorage.getItem('lastBackupSavedTime');
    if (savedTime) updateBackupDisplay(savedTime);
};
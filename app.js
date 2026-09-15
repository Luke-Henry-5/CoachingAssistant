(function () {
  "use strict";

  var STORAGE_KEY_PLAYERS = "soccerLineup.players";
  var STORAGE_KEY_LINEUP = "soccerLineup.lineup";
  var STORAGE_KEY_TEAM = "soccerLineup.teamName";
  var STORAGE_KEY_CATEGORIES = "soccerLineup.categories";

  var DEFAULT_CATEGORIES = [
    { id: "GK", label: "Goalkeeper", color: "#C9622B" },
    { id: "DEF", label: "Defense", color: "#3B6EA5" },
    { id: "MID", label: "Midfield", color: "#2F7A6B" },
    { id: "FWD", label: "Forward", color: "#B5432F" }
  ];

  /** @type {{id:string, label:string, color:string}[]} */
  var categories = loadJSON(STORAGE_KEY_CATEGORIES, null) || DEFAULT_CATEGORIES.slice();
  /** @type {{id:string, name:string, position:string}[]} */
  var players = loadJSON(STORAGE_KEY_PLAYERS, []);
  /** @type {Object.<string,{x:number,y:number}>} keyed by player id */
  var lineup = loadJSON(STORAGE_KEY_LINEUP, {});

  var els = {
    teamNameInput: document.getElementById("teamNameInput"),
    addPlayerForm: document.getElementById("addPlayerForm"),
    playerNameInput: document.getElementById("playerNameInput"),
    playerPositionInput: document.getElementById("playerPositionInput"),
    rosterGroups: document.getElementById("rosterGroups"),
    emptyRosterMsg: document.getElementById("emptyRosterMsg"),
    benchCount: document.getElementById("benchCount"),
    pitch: document.getElementById("pitch"),
    pitchEmptyMsg: document.getElementById("pitchEmptyMsg"),
    clearPitchBtn: document.getElementById("clearPitchBtn"),
    categoryList: document.getElementById("categoryList"),
    addCategoryForm: document.getElementById("addCategoryForm"),
    categoryNameInput: document.getElementById("categoryNameInput"),
    categoryColorInput: document.getElementById("categoryColorInput")
  };

  var COLOR_SUGGESTIONS = ["#6C6F41", "#8A5A83", "#3F7EA6", "#C97A3E", "#5C6BC0", "#7A8450", "#A8556B", "#4F8A6D"];
  var colorSuggestionIndex = 0;

  init();

  function init() {
    var savedTeamName = localStorage.getItem(STORAGE_KEY_TEAM);
    if (savedTeamName) els.teamNameInput.value = savedTeamName;

    els.teamNameInput.addEventListener("change", function () {
      localStorage.setItem(STORAGE_KEY_TEAM, els.teamNameInput.value.trim() || "My Team");
    });

    els.addPlayerForm.addEventListener("submit", onAddPlayer);
    els.clearPitchBtn.addEventListener("click", onBenchEveryone);
    els.addCategoryForm.addEventListener("submit", onAddCategory);

    els.pitch.addEventListener("dragover", onPitchDragOver);
    els.pitch.addEventListener("dragleave", onPitchDragLeave);
    els.pitch.addEventListener("drop", onPitchDrop);

    // Bench area accepts drops to send a player back from the pitch.
    els.rosterGroups.addEventListener("dragover", function (e) { e.preventDefault(); });
    els.rosterGroups.addEventListener("drop", onBenchDrop);

    nextColorSuggestion();
    render();
  }

  // ---------- Data helpers ----------

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function savePlayers() { localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players)); }
  function saveLineup() { localStorage.setItem(STORAGE_KEY_LINEUP, JSON.stringify(lineup)); }
  function saveCategories() { localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories)); }

  function makeId(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function categoryById(id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i];
    }
    return null;
  }

  function abbreviate(label) {
    var words = label.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return "??";
  }

  function nextColorSuggestion() {
    els.categoryColorInput.value = COLOR_SUGGESTIONS[colorSuggestionIndex % COLOR_SUGGESTIONS.length];
    colorSuggestionIndex++;
  }

  // ---------- Actions: players ----------

  function onAddPlayer(e) {
    e.preventDefault();
    var name = els.playerNameInput.value.trim();
    if (!name) return;
    var position = els.playerPositionInput.value;
    if (!position && categories.length > 0) position = categories[0].id;
    players.push({ id: makeId("p"), name: name, position: position });
    savePlayers();
    els.playerNameInput.value = "";
    els.playerNameInput.focus();
    render();
  }

  function removePlayerFromSquad(id) {
    players = players.filter(function (p) { return p.id !== id; });
    delete lineup[id];
    savePlayers();
    saveLineup();
    render();
  }

  function sendToBench(id) {
    delete lineup[id];
    saveLineup();
    render();
  }

  function placeOnPitch(id, xPct, yPct) {
    lineup[id] = { x: clamp(xPct, 4, 96), y: clamp(yPct, 4, 96) };
    saveLineup();
    render();
  }

  function onBenchEveryone() {
    lineup = {};
    saveLineup();
    render();
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ---------- Actions: categories ----------

  function onAddCategory(e) {
    e.preventDefault();
    var label = els.categoryNameInput.value.trim();
    if (!label) return;
    var exists = categories.some(function (c) { return c.label.toLowerCase() === label.toLowerCase(); });
    if (exists) {
      alert("You already have a \"" + label + "\" position.");
      return;
    }
    categories.push({ id: makeId("cat"), label: label, color: els.categoryColorInput.value });
    saveCategories();
    els.categoryNameInput.value = "";
    els.categoryNameInput.focus();
    nextColorSuggestion();
    render();
  }

  function removeCategory(id) {
    var inUse = players.some(function (p) { return p.position === id; });
    if (inUse) {
      alert("Move or remove the players in this position before deleting it.");
      return;
    }
    categories = categories.filter(function (c) { return c.id !== id; });
    saveCategories();
    render();
  }

  // ---------- Drag and drop ----------

  function onDragStart(e, id) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");
  }

  function onDragEnd(e) {
    e.target.classList.remove("dragging");
  }

  function onPitchDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    els.pitch.classList.add("drag-over");
  }

  function onPitchDragLeave(e) {
    if (e.target === els.pitch) els.pitch.classList.remove("drag-over");
  }

  function onPitchDrop(e) {
    e.preventDefault();
    els.pitch.classList.remove("drag-over");
    var id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    var rect = els.pitch.getBoundingClientRect();
    var xPct = ((e.clientX - rect.left) / rect.width) * 100;
    var yPct = ((e.clientY - rect.top) / rect.height) * 100;
    placeOnPitch(id, xPct, yPct);
  }

  function onBenchDrop(e) {
    e.preventDefault();
    var id = e.dataTransfer.getData("text/plain");
    if (id && lineup.hasOwnProperty(id)) sendToBench(id);
  }

  // ---------- Rendering ----------

  function render() {
    renderPositionSelect();
    renderCategoryList();
    renderRoster();
    renderPitch();
  }

  function renderPositionSelect() {
    var current = els.playerPositionInput.value;
    els.playerPositionInput.innerHTML = "";
    categories.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      els.playerPositionInput.appendChild(opt);
    });
    if (categories.some(function (c) { return c.id === current; })) {
      els.playerPositionInput.value = current;
    }
  }

  function renderCategoryList() {
    els.categoryList.innerHTML = "";
    categories.forEach(function (cat) {
      var count = players.filter(function (p) { return p.position === cat.id; }).length;

      var row = document.createElement("div");
      row.className = "category-item";

      var dot = document.createElement("span");
      dot.className = "category-item__dot";
      dot.style.background = cat.color;
      row.appendChild(dot);

      var label = document.createElement("span");
      label.className = "category-item__label";
      label.textContent = cat.label;
      row.appendChild(label);

      var countEl = document.createElement("span");
      countEl.className = "category-item__count";
      countEl.textContent = count;
      row.appendChild(countEl);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "category-item__delete";
      del.innerHTML = "&times;";
      del.disabled = count > 0;
      del.title = count > 0 ? "Move players out of this position first" : "Delete this position";
      del.addEventListener("click", function () { removeCategory(cat.id); });
      row.appendChild(del);

      els.categoryList.appendChild(row);
    });
  }

  function renderRoster() {
    els.rosterGroups.innerHTML = "";
    var benched = players.filter(function (p) { return !lineup.hasOwnProperty(p.id); });

    els.benchCount.textContent = benched.length + (benched.length === 1 ? " player" : " players");
    els.emptyRosterMsg.style.display = players.length === 0 ? "block" : "none";

    categories.forEach(function (cat) {
      var group = benched.filter(function (p) { return p.position === cat.id; });
      if (group.length === 0) return;

      var section = document.createElement("div");
      section.className = "roster-group roster-group--visible";

      var label = document.createElement("div");
      label.className = "roster-group__label";
      var dot = document.createElement("span");
      dot.className = "roster-group__dot";
      dot.style.background = cat.color;
      label.appendChild(dot);
      label.appendChild(document.createTextNode(cat.label + " (" + group.length + ")"));
      section.appendChild(label);

      var list = document.createElement("div");
      list.className = "roster-group__list";
      group.forEach(function (p) {
        list.appendChild(buildChip(p, cat, { removable: true, source: "bench" }));
      });
      section.appendChild(list);

      els.rosterGroups.appendChild(section);
    });

    // Players whose category was deleted from under them (shouldn't normally
    // happen since deletion is blocked while in use, but stay defensive).
    var orphaned = benched.filter(function (p) { return !categoryById(p.position); });
    if (orphaned.length > 0) {
      var section2 = document.createElement("div");
      section2.className = "roster-group roster-group--visible";
      var label2 = document.createElement("div");
      label2.className = "roster-group__label";
      label2.appendChild(document.createTextNode("Unassigned (" + orphaned.length + ")"));
      section2.appendChild(label2);
      var list2 = document.createElement("div");
      list2.className = "roster-group__list";
      orphaned.forEach(function (p) {
        list2.appendChild(buildChip(p, { label: "?", color: "#8B8577" }, { removable: true, source: "bench" }));
      });
      section2.appendChild(list2);
      els.rosterGroups.appendChild(section2);
    }
  }

  function renderPitch() {
    var existing = els.pitch.querySelectorAll(".pitch-token");
    existing.forEach(function (node) { node.remove(); });

    var ids = Object.keys(lineup);
    els.pitchEmptyMsg.style.display = ids.length === 0 ? "flex" : "none";

    ids.forEach(function (id) {
      var player = players.find(function (p) { return p.id === id; });
      if (!player) { delete lineup[id]; return; }
      var cat = categoryById(player.position) || { label: "?", color: "#8B8577" };
      var token = document.createElement("div");
      token.className = "pitch-token";
      token.style.left = lineup[id].x + "%";
      token.style.top = lineup[id].y + "%";
      token.appendChild(buildChip(player, cat, { removable: true, source: "pitch" }));
      els.pitch.appendChild(token);
    });
  }

  function buildChip(player, cat, opts) {
    var chip = document.createElement("div");
    chip.className = "chip";
    chip.draggable = true;
    chip.dataset.id = player.id;
    chip.addEventListener("dragstart", function (e) { onDragStart(e, player.id); });
    chip.addEventListener("dragend", onDragEnd);

    var badge = document.createElement("span");
    badge.className = "chip__badge";
    badge.style.background = cat.color;
    badge.textContent = abbreviate(cat.label);
    badge.title = cat.label;
    chip.appendChild(badge);

    var nameSpan = document.createElement("span");
    nameSpan.textContent = player.name;
    chip.appendChild(nameSpan);

    if (opts.removable) {
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "chip__remove";
      removeBtn.innerHTML = "&times;";
      if (opts.source === "pitch") {
        removeBtn.title = "Send back to bench";
        removeBtn.addEventListener("click", function () { sendToBench(player.id); });
      } else {
        removeBtn.title = "Remove from squad";
        removeBtn.addEventListener("click", function () {
          if (confirm(player.name + " will be removed from the squad. Continue?")) {
            removePlayerFromSquad(player.id);
          }
        });
      }
      chip.appendChild(removeBtn);
    }

    return chip;
  }
})();

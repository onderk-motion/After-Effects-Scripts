/*
Split & Save Comps into N-sized sets (Palette UI, duplicate and unsafe-name checks)
- Scans for duplicate names and reports them
- Scans for risky characters and reports them
- Builds a plan using Regular or Random mode
- Saves a duplicate project for each set and removes comps outside that set
- Maintains index mapping to avoid invalid object errors after reopening
*/

(function () {
    if (!(app && app.project)) { alert("Open a project first."); return; }
    if (!app.project.file)     { alert("Save the project first, then run."); return; }

    // ---------- Helpers ----------
    function getCompsArray() {
        var it = app.project.items, arr = [];
        for (var i = 1; i <= it.length; i++) if (it[i] instanceof CompItem) arr.push(it[i]);
        return arr;
    }
    function countComps() { return getCompsArray().length; }
    function buildIndexPlan(totalCount, mode) {
        var arr = [];
        for (var i = 0; i < totalCount; i++) arr.push(i);
        if (mode === "Random") shuffle(arr);
        return arr;
    }
    function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function containsItem(arr, it) {
        for (var i = 0; i < arr.length; i++) if (arr[i] === it) return true;
        return false;
    }
    function stripExt(name) {
        var dot = name.lastIndexOf(".");
        return dot > 0 ? name.substring(0, dot) : name;
    }
    function pad2(n) { return (n < 10 ? "0" : "") + n; }
    function clampInt(n, min, max) {
        if (isNaN(n)) return null;
        if (n < min) n = min; if (n > max) n = max; return n;
    }
    function startSuppressDialogs() {
        try { app.beginSuppressDialogs(true); return true; } catch (e1) {}
        try { app.beginSuppressDialogs();     return true; } catch (e2) {}
        return false;
    }
    function endSuppressDialogs(started) {
        if (!started) return;
        try { app.endSuppressDialogs(false); } catch (e1) { try { app.endSuppressDialogs(); } catch (e2) {} }
    }

    // Duplicate scan
    function findDuplicateCompNames() {
        var comps = getCompsArray();
        var map = {};
        for (var i = 0; i < comps.length; i++) {
            var n = comps[i].name;
            if (!map[n]) map[n] = 0;
            map[n]++;
        }
        var list = [];
        var totalDupItems = 0;
        for (var k in map) if (map.hasOwnProperty(k) && map[k] > 1) {
            list.push({ name: k, count: map[k] });
            totalDupItems += map[k];
        }
        list.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
        return { list: list, uniqueNames: list.length, totalItems: totalDupItems };
    }

    // Unsafe character scan
    // Default risky set: \ / : * ? " < > | ' ; and leading/trailing or repeated spaces
    var UNSAFE_RE = /[\\\/:\*\?"<>|';]/g;
    function findUnsafeCompNames() {
        var comps = getCompsArray();
        var hits = [];
        for (var i = 0; i < comps.length; i++) {
            var n = comps[i].name;
            var riskChars = uniqueMatches(n, UNSAFE_RE);
            var leadingSpace = /^\s/.test(n);
            var trailingSpace = /\s$/.test(n);
            var multiSpaces = /\s{2,}/.test(n);
            if (riskChars.length || leadingSpace || trailingSpace || multiSpaces) {
                hits.push({
                    name: n,
                    chars: riskChars,
                    leadingSpace: leadingSpace,
                    trailingSpace: trailingSpace,
                    multiSpaces: multiSpaces
                });
            }
        }
        // Alphabetical order
        hits.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
        return hits;
    }
    function uniqueMatches(str, regex) {
        var set = {};
        var m, re = new RegExp(regex.source, regex.flags); // create a new instance to reset lastIndex
        while ((m = re.exec(str)) !== null) set[m[0]] = true;
        var out = [];
        for (var k in set) if (set.hasOwnProperty(k)) out.push(k);
        return out;
    }

    // ---------- UI ----------
    var win = new Window("palette", "Split Project Saver", undefined, { resizeable: true });
    win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.margins = 12;

    var infoGroup = win.add("group");
    infoGroup.add("statictext", undefined, "Total comps:");
    var totalValue = infoGroup.add("statictext", undefined, "-"); totalValue.preferredSize.width = 80;

    // Duplicate panel
    var dupPanel = win.add("panel", undefined, "Duplicate Names Warning");
    dupPanel.orientation = "row"; dupPanel.alignChildren = ["left", "center"]; dupPanel.margins = 10;
    var dupInfo = dupPanel.add("statictext", undefined, "No duplicates detected."); dupInfo.preferredSize.width = 260;
    var dupViewBtn = dupPanel.add("button", undefined, "View list"); dupViewBtn.enabled = false;

    // Unsafe names panel
    var unsafePanel = win.add("panel", undefined, "Name Safety Check");
    unsafePanel.orientation = "row"; unsafePanel.alignChildren = ["left", "center"]; unsafePanel.margins = 10;
    var unsafeInfo = unsafePanel.add("statictext", undefined, "No risky names detected."); unsafeInfo.preferredSize.width = 260;
    var unsafeViewBtn = unsafePanel.add("button", undefined, "View list"); unsafeViewBtn.enabled = false;

    // Settings
    var ctrl = win.add("panel", undefined, "Settings");
    ctrl.orientation = "column"; ctrl.alignChildren = ["fill", "top"]; ctrl.margins = 10;

    var row1 = ctrl.add("group");
    row1.add("statictext", undefined, "Set size:");
    var setSizeEt = row1.add("edittext", undefined, "20"); setSizeEt.characters = 6;
    row1.add("statictext", undefined, "Sets:");
    var setsValue = row1.add("statictext", undefined, "-"); setsValue.preferredSize.width = 60;

    var row2 = ctrl.add("group");
    row2.add("statictext", undefined, "Mode:");
    var modeDd = row2.add("dropdownlist", undefined, ["Regular", "Random"]); modeDd.selection = 0;

    var labelCb = ctrl.add("checkbox", undefined, "Label groups for visual aid"); labelCb.value = false;

    // Progress
    var prog = win.add("panel", undefined, "Progress");
    prog.orientation = "column"; prog.alignChildren = ["fill", "top"]; prog.margins = 10;
    var progressBar = prog.add("progressbar", undefined, 0, 100); progressBar.preferredSize.width = 320;
    var logText     = prog.add("statictext", undefined, "", { multiline: true }); logText.preferredSize = [320, 64];

    var btns = win.add("group");
    var startBtn = btns.add("button", undefined, "Start");
    var closeBtn = btns.add("button", undefined, "Close");

    // Project info
    var proj = app.project;
    var origFile   = proj.file;
    var origFolder = origFile.parent;
    var baseName   = stripExt(origFile.displayName);

    var total = countComps();
    totalValue.text = String(total);

    function updateSetsLabel() {
        var n = clampInt(parseInt(setSizeEt.text, 10), 1, 999999);
        if (!n) { setsValue.text = "-"; return; }
        setsValue.text = String(Math.ceil(total / n));
    }
    setSizeEt.onChanging = updateSetsLabel;
    setSizeEt.onChange   = updateSetsLabel;
    updateSetsLabel();

    // Initial scans
    var dupState = findDuplicateCompNames();
    var unsafeState = findUnsafeCompNames();
    refreshDupPanel();
    refreshUnsafePanel();

    function refreshDupPanel() {
        if (dupState.uniqueNames > 0) {
            dupInfo.text = "Duplicates: " + dupState.uniqueNames + " names, " + dupState.totalItems + " items";
            dupViewBtn.enabled = true;
        } else {
            dupInfo.text = "No duplicates detected.";
            dupViewBtn.enabled = false;
        }
    }
    function refreshUnsafePanel() {
        if (unsafeState.length > 0) {
            unsafeInfo.text = "Risky names: " + unsafeState.length + " comps";
            unsafeViewBtn.enabled = true;
        } else {
            unsafeInfo.text = "No risky names detected.";
            unsafeViewBtn.enabled = false;
        }
    }

    dupViewBtn.onClick = function () {
        var dlg = new Window("dialog", "Duplicate List");
        dlg.orientation = "column"; dlg.alignChildren = ["fill", "top"]; dlg.margins = 12;
        var txt = dlg.add("edittext", undefined, "", { multiline: true, scrolling: true });
        txt.preferredSize = [460, 280];
        var lines = [];
        for (var i = 0; i < dupState.list.length; i++) {
            var d = dupState.list[i];
            lines.push(d.name + "  x" + d.count);
        }
        if (lines.length === 0) lines.push("No duplicates.");
        txt.text = lines.join("\n");
        var btns = dlg.add("group"); var ok = btns.add("button", undefined, "Close");
        ok.onClick = function () { dlg.close(); };
        dlg.center(); dlg.show();
    };

    unsafeViewBtn.onClick = function () {
        var dlg = new Window("dialog", "Risky Name List");
        dlg.orientation = "column"; dlg.alignChildren = ["fill", "top"]; dlg.margins = 12;
        var txt = dlg.add("edittext", undefined, "", { multiline: true, scrolling: true });
        txt.preferredSize = [460, 320];
        var lines = [];
        for (var i = 0; i < unsafeState.length; i++) {
            var u = unsafeState[i];
            var flags = [];
            if (u.chars.length) flags.push("chars: [" + u.chars.join(" ") + "]");
            if (u.leadingSpace) flags.push("leading-space");
            if (u.trailingSpace) flags.push("trailing-space");
            if (u.multiSpaces)   flags.push("multi-spaces");
            lines.push(u.name + "  —  " + flags.join(", "));
        }
        if (lines.length === 0) lines.push("No risky names.");
        txt.text = lines.join("\n");
        var btns = dlg.add("group"); var ok = btns.add("button", undefined, "Close");
        ok.onClick = function () { dlg.close(); };
        dlg.center(); dlg.show();
    };

    startBtn.onClick = function () {
        // Re-scan before running
        dupState = findDuplicateCompNames();
        unsafeState = findUnsafeCompNames();
        refreshDupPanel();
        refreshUnsafePanel();

        var warnings = [];
        if (dupState.uniqueNames > 0) warnings.push("Duplicate names: " + dupState.uniqueNames + " names");
        if (unsafeState.length  > 0) warnings.push("Risky names: " + unsafeState.length + " comps");

        if (warnings.length > 0) {
            var msg = warnings.join("\n") + "\nProceed anyway?";
            if (!confirm(msg)) return;
        }

        var size = clampInt(parseInt(setSizeEt.text, 10), 1, 999999);
        if (!size) { alert("Set size must be a positive integer."); return; }
        if (total === 0) { alert("No compositions found."); return; }
        var mode = modeDd.selection ? modeDd.selection.text : "Regular";
        run(size, mode, labelCb.value);
    };

    closeBtn.onClick = function () { try { win.close(); } catch (e) {} };
    win.onResizing = win.onResize = function () { this.layout.resize(); };
    win.center(); win.show();

    // ---------- Core ----------
    function run(GROUP, mode, doLabels) {
        var sup = startSuppressDialogs();
        try {
            total = countComps();
            var planIdx = buildIndexPlan(total, mode);
            var groups = Math.ceil(planIdx.length / GROUP);
            progressBar.maxvalue = groups; progressBar.value = 0;

            var colorOrder = [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16];

            var proj = app.project;
            var origFile   = proj.file;
            var origFolder = origFile.parent;
            var baseName   = stripExt(origFile.displayName);

            for (var g = 0; g < groups; g++) {
                if (g > 0) app.open(origFile);
                proj = app.project;

                var currentComps = getCompsArray();
                if (currentComps.length !== total) total = currentComps.length;

                var start = g * GROUP;
                var end   = Math.min(start + GROUP, planIdx.length);
                var memberIdx = planIdx.slice(start, end);

                if (doLabels) {
                    var lab = colorOrder[g % colorOrder.length];
                    for (var i = 0; i < memberIdx.length; i++) {
                        var ci = memberIdx[i];
                        if (ci >= 0 && ci < currentComps.length) {
                            try { currentComps[ci].label = lab; } catch (e) {}
                        }
                    }
                }

                var outName = baseName + " " + pad2(g + 1) + ".aep";
                var outFile = File(origFolder.fsName + "/" + outName);
                proj.save(outFile);

                var keepList = [];
                for (var k = 0; k < memberIdx.length; k++) {
                    var idx = memberIdx[k];
                    if (idx >= 0 && idx < currentComps.length) keepList.push(currentComps[idx]);
                }

                var items = proj.items;
                for (var p = items.length; p >= 1; p--) {
                    var it = items[p];
                    if (it instanceof CompItem) {
                        if (!containsItem(keepList, it)) {
                            try { it.remove(); } catch (e) {}
                        }
                    }
                }

                try { proj.removeUnusedFootage(); } catch (e) {}
                proj.save(outFile);

                progressBar.value = g + 1;
                logText.text = "Saved: " + outName;
                win.update();
            }

            alert("Done.\nSaved projects: " + Math.ceil(planIdx.length / GROUP));
        } catch (err) {
            alert("Error: " + err.toString());
        } finally {
            endSuppressDialogs(sup);
        }
    }
})();

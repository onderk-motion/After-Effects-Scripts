/*
    Set Viewer Resolution - Vertical Palette UI
    Layout: vertical, symmetric spacing, full-width controls
    Scope: Active Comp, Selected Comps, Entire Project
    Resolution: Full, Half, Third, Quarter
*/

(function SetViewerResolutionPaletteVertical() {
    if (app.project === null) app.newProject();

    // ---------- Helpers ----------
    var RES_MAP = {
        "Full":   [1, 1],
        "Half":   [2, 2],
        "Third":  [3, 3],
        "Quarter":[4, 4]
    };

    function setCompResolution(comp, factor) {
        if (comp && comp instanceof CompItem) {
            comp.resolutionFactor = factor;
            return true;
        }
        return false;
    }

    function getSelectedComps() {
        var arr = [];
        var sel = app.project.selection || [];
        for (var i = 0; i < sel.length; i++) if (sel[i] instanceof CompItem) arr.push(sel[i]);
        return arr;
    }

    function getAllComps() {
        var comps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem) comps.push(it);
        }
        return comps;
    }

    function getActiveComp() {
        var it = app.project.activeItem;
        return (it && it instanceof CompItem) ? it : null;
    }

    // ---------- UI ----------
    var win = new Window("palette", "Set Viewer Resolution", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 12;
    win.preferredSize.width = 360;

    // Scope panel, vertical radios
    var pScope = win.add("panel", undefined, "Scope");
    pScope.orientation = "column";
    pScope.alignChildren = ["left", "top"];
    pScope.margins = 10;
    pScope.spacing = 6;

    var rbActive   = pScope.add("radiobutton", undefined, "Active Comp");
    var rbSelected = pScope.add("radiobutton", undefined, "Selected Comps");
    var rbAll      = pScope.add("radiobutton", undefined, "Entire Project");
    rbActive.value = true;

    // Resolution panel, dropdown full width
    var pRes = win.add("panel", undefined, "Resolution");
    pRes.orientation = "column";
    pRes.alignChildren = ["fill", "top"];
    pRes.margins = 10;
    pRes.spacing = 6;

    var ddRes = pRes.add("dropdownlist", undefined, ["Full", "Half", "Third", "Quarter"]);
    ddRes.selection = 0;
    ddRes.preferredSize.height = 26; // a bit taller for balance

    // Buttons, equal widths
    var gBtns = win.add("group");
    gBtns.orientation = "row";
    gBtns.alignChildren = ["fill", "center"];
    gBtns.spacing = 10;
    gBtns.margins = 0;

    var btnApply   = gBtns.add("button", undefined, "Apply");
    var btnRefresh = gBtns.add("button", undefined, "Refresh");
    var btnClose   = gBtns.add("button", undefined, "Close");

    // Make buttons equal width by stretching with a fixed min size
    var btnW = 90;
    btnApply.minimumSize   = [btnW, 28];
    btnRefresh.minimumSize = [btnW, 28];
    btnClose.minimumSize   = [btnW, 28];

    // Status text, full width
    var txtStatus = win.add("statictext", undefined, "Ready.", { multiline: true });
    txtStatus.alignment = ["fill", "top"];
    txtStatus.preferredSize.height = 40;

    // ---------- Behavior ----------
    function refreshStatus() {
        var active = getActiveComp();
        var sel = getSelectedComps();
        var all = getAllComps();
        var aName = active ? active.name : "None";
        txtStatus.text = "Active: " + aName + " ; Selected: " + sel.length + " ; All: " + all.length + ".";
    }

    btnRefresh.onClick = refreshStatus;
    btnClose.onClick = function () { win.close(); };

    btnApply.onClick = function () {
        var mode = ddRes.selection ? ddRes.selection.text : "Full";
        var factor = RES_MAP[mode] || [1, 1];

        var targets = [];
        if (rbActive.value) {
            var ac = getActiveComp();
            if (ac) targets.push(ac);
        } else if (rbSelected.value) {
            targets = getSelectedComps();
        } else if (rbAll.value) {
            targets = getAllComps();
        }

        if (targets.length === 0) {
            txtStatus.text = "No target compositions found.";
            return;
        }

        app.beginUndoGroup("Set Viewer Resolution: " + mode);
        var count = 0;
        for (var i = 0; i < targets.length; i++) if (setCompResolution(targets[i], factor)) count++;
        app.endUndoGroup();

        txtStatus.text = "Applied '" + mode + "' to " + count + " composition(s).";
    };

    win.onShow = refreshStatus;
    win.center();
    win.show();
})();

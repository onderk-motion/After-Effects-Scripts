/*
 * Apply Parent Prefix to Selected Layers
 *
 * Run this script in After Effects' ExtendScript Toolkit to batch rename the
 * selected layers.
 *
 * The script prefixes each selected layer's name with its parent layer name.
 * It replaces underscores in the parent name with spaces, skips layers without
 * a parent, and avoids adding duplicate prefixes if the parent name already
 * appears at the beginning of the child layer name. When the process finishes
 * all layers are deselected.
 */
(function applyParentPrefixToSelectedLayers() {
    if (!app || !app.project) {
        alert("Open a project before running the script.");
        return;
    }

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please activate a composition and try again.");
        return;
    }

    if (!comp.selectedLayers || comp.selectedLayers.length === 0) {
        alert("Select at least one layer to rename.");
        return;
    }

    app.beginUndoGroup("Apply Parent Layer Name as Prefix");

    for (var i = 0; i < comp.selectedLayers.length; i += 1) {
        var layer = comp.selectedLayers[i];

        if (!layer.parent) {
            continue;
        }

        var parentName = layer.parent.name.replace(/_/g, " ");

        if (layer.name.indexOf(parentName) !== 0) {
            layer.name = parentName + " " + layer.name;
        }
    }

    for (var j = 1; j <= comp.numLayers; j += 1) {
        comp.layer(j).selected = false;
    }

    app.endUndoGroup();
})();

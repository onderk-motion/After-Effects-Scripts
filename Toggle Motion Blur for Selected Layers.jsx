/*
 * Toggle Motion Blur for Selected Layers
 *
 * Quickly toggles the motion blur switch for all selected layers in the
 * active composition. If any selected layer has motion blur disabled, the
 * script enables motion blur for every selected layer. If all selected
 * layers already have motion blur enabled, the script disables the switch
 * for all of them. Layers that do not support motion blur are skipped.
 */
(function toggleMotionBlurForSelectedLayers() {
    if (!app || !app.project) {
        alert("No active project found. Please open a project first.");
        return;
    }

    app.beginUndoGroup("Toggle Motion Blur for Selected Layers");

    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select a composition and try again.");
        app.endUndoGroup();
        return;
    }

    var selectedLayers = activeItem.selectedLayers;
    if (!selectedLayers || selectedLayers.length === 0) {
        alert("Select at least one layer to toggle motion blur.");
        app.endUndoGroup();
        return;
    }

    var shouldEnable = false;
    for (var i = 0; i < selectedLayers.length; i += 1) {
        var layer = selectedLayers[i];
        if (layer instanceof AVLayer && !layer.motionBlur) {
            shouldEnable = true;
            break;
        }
    }

    for (var j = 0; j < selectedLayers.length; j += 1) {
        var currentLayer = selectedLayers[j];
        if (!(currentLayer instanceof AVLayer)) {
            continue;
        }
        currentLayer.motionBlur = shouldEnable;
    }

    app.endUndoGroup();
})();

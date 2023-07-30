(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    if (comp.selectedLayers.length === 0) {
        alert("Select one or more layers to duplicate.");
        return;
    }

    app.beginUndoGroup("Duplicate layers below");

    var selectedLayers = comp.selectedLayers.slice(); // Duplicate the selected layers array to avoid mutating it while looping

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        layer.selected = false; // Deselect original layer
        var duplicate = layer.duplicate();
        duplicate.moveAfter(layer);
        duplicate.selected = true; // Select the duplicated layer
    }
    
    app.endUndoGroup();
})();
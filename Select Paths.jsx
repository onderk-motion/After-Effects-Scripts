(function () {
    app.beginUndoGroup("Select Shape Groups");

    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            alert("Please select a shape layer.");
            return;
        }

        function selectShapeGroups(propertyGroup) {
            for (var i = 1; i <= propertyGroup.numProperties; i++) {
                var my_property = propertyGroup.property(i);

                if (my_property.matchName === 'ADBE Vector Shape - Group') {
                    my_property.selected = true;
                } else if (my_property.propertyType === PropertyType.INDEXED_GROUP || my_property.propertyType === PropertyType.NAMED_GROUP) {
                    selectShapeGroups(my_property);
                }
            }
        }

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            if (layer.matchName === 'ADBE Vector Layer') {
                var rootVectorsGroup = layer.property("ADBE Root Vectors Group");
                selectShapeGroups(rootVectorsGroup);
            }
        }

    } catch (err) {
        alert("Error: " + err.message + " (line " + (err.line) + ")");
    } finally {
        app.endUndoGroup();
    }
})();

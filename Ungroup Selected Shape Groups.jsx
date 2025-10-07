// Ungroup Selected Shape Groups Script for After Effects
// Ungroups each selected shape group while leaving any nested sub-groups untouched.

(function ungroupSelectedShapes() {
    app.beginUndoGroup("Ungroup Selected Shapes");

    try {
        var comp = app.project.activeItem;

        if (!comp || !(comp instanceof CompItem)) {
            alert("Please open a composition.");
            return;
        }

        var selectedProperties = comp.selectedProperties;

        if (selectedProperties.length === 0) {
            alert("No shape groups are selected.\nPlease select shape groups in the Timeline panel.");
            return;
        }

        // Store information about the groups that were initially selected.
        var initialGroups = [];

        for (var i = 0; i < selectedProperties.length; i++) {
            var prop = selectedProperties[i];
            if (prop.matchName === "ADBE Vector Group") {
                // Save the group's parent and property index so we can find it again later.
                initialGroups.push({
                    parent: prop.parentProperty,
                    index: prop.propertyIndex,
                    name: prop.name
                });
            }
        }

        if (initialGroups.length === 0) {
            alert("None of the selected properties are shape groups.");
            return;
        }

        var successCount = 0;

        // Iterate backwards because ungrouping changes the property indices.
        for (var j = initialGroups.length - 1; j >= 0; j--) {
            var groupInfo = initialGroups[j];

            // Clear all selections.
            var allProps = comp.selectedProperties;
            for (var k = 0; k < allProps.length; k++) {
                allProps[k].selected = false;
            }

            // Locate and select the saved group.
            try {
                var targetGroup = groupInfo.parent.property(groupInfo.index);

                // Verify the group still exists before ungrouping.
                if (targetGroup && targetGroup.matchName === "ADBE Vector Group") {
                    targetGroup.selected = true;

                    // Execute the Ungroup Shapes command.
                    app.executeCommand(3742);

                    successCount++;
                }
            } catch (e) {
                // If the group was deleted or cannot be found, skip it.
            }
        }

        alert(successCount + " shape group(s) were successfully ungrouped!");

    } catch (error) {
        alert("An error occurred: " + error.toString() + "\n\nLine: " + error.line);
    } finally {
        app.endUndoGroup();
    }
})();

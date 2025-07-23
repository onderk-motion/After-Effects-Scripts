/*
Shape Separator Script for After Effects
Created by: Onder Kadagan (onderk-motion)
GitHub: https://github.com/onderk-motion/After-Effects-Scripts
License: Free to use and modify

Description: Separates shape layer groups into individual layers
Special Feature: Automatically ungroups single main groups before separation
Usage: File > Scripts > Run Script File... or add to KBar
*/

// Shape Separator - Separates shape layer groups into individual layers

// ========== SETTINGS (Change these values as needed) ==========
var SETTINGS = {
    centerAnchorPoint: true,     // Centers anchor point of separated shapes
    hideOriginalLayer: false,    // Hides original layer after separation  
    deleteSourceLayer: true,     // Deletes source layer after separation (overrides hideOriginalLayer)
    useSourcePrefix: false       // Uses source layer name as prefix: "Source Layer - Group Name"
};
// ============================================================

/**
 * Main Shape Separator Function
 * Separates shape layer groups into individual layers
 * Can be used with File > Scripts > Run Script File or added to KBar
 */
function executeShapeSeparator() {
    // Basic validation checks
    var activeComp = app.project.activeItem;
    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("Please open and activate a composition.");
        return;
    }

    var selectedLayers = activeComp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select at least one shape layer.");
        return;
    }

    app.beginUndoGroup("Shape Separator");

    // First run ungroup operation (UNIQUE FEATURE: automatically ungroups single main groups)
    // This is different from other scripts - it handles single-group cases by ungrouping first
    try {
        var ungroupCount = 0;
        for (var i = 0; i < selectedLayers.length; i++) {
            var selectedLayer = selectedLayers[i];
            
            // Check if it's a shape layer
            if (!(selectedLayer instanceof ShapeLayer)) {
                continue;
            }

            var rootVectors = selectedLayer.property("ADBE Root Vectors Group");
            if (!rootVectors) {
                continue;
            }

            // Check group count - ungroup only if there's exactly 1 group
            if (rootVectors.numProperties === 1) {
                var vectorGroup = rootVectors.property("ADBE Vector Group");
                if (vectorGroup) {
                    vectorGroup.selected = true;
                    app.executeCommand(3742); // Ungroup Shapes command
                    ungroupCount++;
                }
            }
        }
    } catch (ungroupError) {
        // If ungroup fails, continue without showing error
    }

    // Main separation process
    try {
        for (var layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
            var currentLayer = selectedLayers[layerIndex];

            // Ensure it's a shape layer
            if (!(currentLayer instanceof ShapeLayer)) {
                continue;
            }

            var vectorsGroup = currentLayer.property("ADBE Root Vectors Group");
            if (!vectorsGroup) {
                continue;
            }

            var groupCount = vectorsGroup.numProperties;
            // Skip if there's only one group or no groups
            if (groupCount <= 1) {
                continue;
            }

            // Create separate layer for each group
            for (var groupIndex = 1; groupIndex <= groupCount; groupIndex++) {
                var currentGroup = vectorsGroup.property(groupIndex);

                // Duplicate the original layer
                var duplicatedLayer = currentLayer.duplicate();
                duplicatedLayer.moveBefore(currentLayer);

                // Set layer name based on settings
                if (SETTINGS.useSourcePrefix) {
                    duplicatedLayer.name = currentLayer.name + " - " + currentGroup.name;
                } else {
                    duplicatedLayer.name = currentGroup.name;
                }

                var dupeVectorsGroup = duplicatedLayer.property("ADBE Root Vectors Group");

                // Remove unnecessary groups (keep only the current group)
                var groupsToDelete = [];
                for (var i = 1; i <= groupCount; i++) {
                    if (i !== groupIndex) {
                        groupsToDelete.push(i);
                    }
                }

                // Sort in reverse order to avoid index shifting during deletion
                groupsToDelete.sort(function(a, b) { return b - a; });

                // Delete unwanted groups
                for (var deleteIndex = 0; deleteIndex < groupsToDelete.length; deleteIndex++) {
                    var indexToDelete = groupsToDelete[deleteIndex];
                    try {
                        dupeVectorsGroup.property(indexToDelete).remove();
                    } catch (e) {
                        // Continue if deletion fails
                    }
                }

                // Enable the duplicated layer
                duplicatedLayer.enabled = true;

                // Center anchor point if setting is enabled
                if (SETTINGS.centerAnchorPoint) {
                    centerAnchorPoint(duplicatedLayer);
                }
            }

            // Handle source layer based on settings
            if (SETTINGS.deleteSourceLayer) {
                currentLayer.remove(); // Delete the layer
            } else if (SETTINGS.hideOriginalLayer) {
                currentLayer.enabled = false; // Hide the layer
            }
            // If neither option is selected, layer remains as is
        }

        // Operation completed silently - no alert needed

    } catch (error) {
        alert("General error: " + error.toString());
    }

    app.endUndoGroup();
}

/**
 * Centers the anchor point of a layer to its geometric center
 * @param {Layer} layer - The layer to center anchor point for
 */
function centerAnchorPoint(layer) {
    try {
        var currentTime = layer.containingComp.time;

        // Get the shape layer's bounds
        var sourceRect = layer.sourceRectAtTime(currentTime, false);

        // Calculate center point
        var centerX = sourceRect.left + (sourceRect.width / 2);
        var centerY = sourceRect.top + (sourceRect.height / 2);

        // Get old anchor point value
        var oldAnchor = layer.transform.anchorPoint.value;

        // Set new anchor point (center)
        var newAnchor = [centerX, centerY];

        // Add Z value for 3D layers
        if (layer.threeDLayer) {
            newAnchor.push(oldAnchor[2] || 0);
        }

        // Set the new anchor point
        layer.transform.anchorPoint.setValue(newAnchor);

        // Adjust position so layer stays in the same place
        var oldPosition = layer.transform.position.value;
        var anchorDifference = [
            newAnchor[0] - oldAnchor[0],
            newAnchor[1] - oldAnchor[1]
        ];

        var newPosition = [
            oldPosition[0] + anchorDifference[0],
            oldPosition[1] + anchorDifference[1]
        ];

        if (layer.threeDLayer) {
            newPosition.push(oldPosition[2] || 0);
        }

        layer.transform.position.setValue(newPosition);

    } catch (e) {
        // Continue if anchor point adjustment fails
    }
}

// ========== HOW TO USE ==========
// Method 1 - Direct Script Execution:
// 1. File > Scripts > Run Script File... and select this script
// 2. Select one or more shape layers in After Effects before running
// 3. Each group within selected shape layers will become a separate layer
//
// Method 2 - KBar Integration:
// 1. Add this script to KBar
// 2. Set the function to call: executeShapeSeparator()
//
// Settings: Adjust SETTINGS object at the top as needed
// ===============================

// Auto-run the script when executed via File > Scripts > Run Script File
executeShapeSeparator();
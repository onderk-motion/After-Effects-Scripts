//Made by Onderk. Motion
//https://github.com/onderk-motion/After-Effects-Scripts

(function createBoundingBoxGuide() {
    app.beginUndoGroup("Create Bounding Box Guide");

    // =========================
    //         CONFIG
    // =========================
    var CONFIG = {
        boxName: "Bounding Box",
        strokeColor: "#00b7ff", // hex string
        strokeWidth: 2,
        padding: 0,
        showDialog: false,
        dashEnabled: true,
        dashLength: 10,
        lineCap: "Round Cap",
        lineJoin: "Round Join",
        guideShy: true,
        guideLayer: true
    };

    // =========================
    //       UI DIALOG
    // =========================
    function showSettingsDialog() {
        var dialog = new Window("dialog", "Advanced Bounding Box Guide");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";
        dialog.spacing = 10;

        // Layer settings
        var nameGroup = dialog.add("panel", undefined, "Layer Settings");
        nameGroup.orientation = "row";
        nameGroup.alignChildren = ["left", "center"];
        nameGroup.add("statictext", undefined, "Name:");
        var nameInput = nameGroup.add("edittext", undefined, CONFIG.boxName);
        nameInput.characters = 20;

        // Appearance
        var appearancePanel = dialog.add("panel", undefined, "Appearance");
        var hexGroup = appearancePanel.add("group");
        hexGroup.add("statictext", undefined, "Hex Color:");
        var hexInput = hexGroup.add("edittext", undefined, CONFIG.strokeColor);
        hexInput.characters = 8;

        var strokeGroup = appearancePanel.add("group");
        strokeGroup.add("statictext", undefined, "Stroke Width:");
        var strokeInput = strokeGroup.add("edittext", undefined, CONFIG.strokeWidth.toString());
        strokeInput.characters = 5;

        var paddingGroup = appearancePanel.add("group");
        paddingGroup.add("statictext", undefined, "Padding:");
        var paddingInput = paddingGroup.add("edittext", undefined, CONFIG.padding.toString());
        paddingInput.characters = 5;

        var dashGroup = appearancePanel.add("group");
        var dashCheckbox = dashGroup.add("checkbox", undefined, "Dashed Line");
        dashCheckbox.value = CONFIG.dashEnabled;
        dashGroup.add("statictext", undefined, "Dash:");
        var dashInput = dashGroup.add("edittext", undefined, CONFIG.dashLength.toString());
        dashInput.characters = 5;
        dashInput.enabled = CONFIG.dashEnabled;
        dashCheckbox.onClick = function() {
            dashInput.enabled = dashCheckbox.value;
        };

        // Guide Layer & Shy checkboxes (vertical)
        var guidePanel = dialog.add("panel", undefined, "Guide Layer Options");
        guidePanel.orientation = "column";
        var guideLayerCheckbox = guidePanel.add("checkbox", undefined, "Make Bounding Box a Guide Layer");
        guideLayerCheckbox.value = true;
        var shyCheckbox = guidePanel.add("checkbox", undefined, "Make Bounding Box Layer shy");
        shyCheckbox.value = true;

        // --- Centered Buttons ---
        var buttonGroup = dialog.add("group");
        buttonGroup.alignment = "center";
        buttonGroup.orientation = "row";
        var okButton = buttonGroup.add("button", undefined, "Create");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");

        // ----- INPUT VALIDATION -----
        function isHexColor(val) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val);
        }
        function isPositiveNumber(val) {
            return !isNaN(val) && Number(val) >= 0;
        }

        okButton.onClick = function() {
            if (!isHexColor(hexInput.text)) {
                alert("Please enter a valid hex color (e.g., #00b7ff)");
                return;
            }
            if (!isPositiveNumber(strokeInput.text)) {
                alert("Stroke width must be a positive number.");
                return;
            }
            if (!isPositiveNumber(paddingInput.text)) {
                alert("Padding must be a positive number.");
                return;
            }
            if (dashCheckbox.value && !isPositiveNumber(dashInput.text)) {
                alert("Dash value must be a positive number.");
                return;
            }
            CONFIG.boxName = nameInput.text;
            CONFIG.strokeColor = hexInput.text;
            CONFIG.strokeWidth = parseFloat(strokeInput.text) || 2;
            CONFIG.padding = parseFloat(paddingInput.text) || 0;
            CONFIG.dashEnabled = dashCheckbox.value;
            CONFIG.dashLength = parseFloat(dashInput.text) || 10;
            CONFIG.guideShy = shyCheckbox.value;
            CONFIG.guideLayer = guideLayerCheckbox.value;
            dialog.close(1);
        };
        cancelButton.onClick = function() { dialog.close(0); };
        return dialog.show();
    }

    // --- Helpers ---
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(function(h) { return h + h; }).join('');
        }
        if (hex.length !== 6) return null;
        var r = parseInt(hex.substr(0, 2), 16) / 255;
        var g = parseInt(hex.substr(2, 2), 16) / 255;
        var b = parseInt(hex.substr(4, 2), 16) / 255;
        return [r, g, b];
    }

    // --- Show UI and check cancel ---
    if (CONFIG.showDialog && !showSettingsDialog()) {
        app.endUndoGroup();
        return;
    }

    // --- Layer selection validation ---
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select an active composition.");
        app.endUndoGroup();
        return;
    }
    var originalSelectedLayers = comp.selectedLayers;
    if (!originalSelectedLayers || originalSelectedLayers.length === 0) {
        alert("Please select at least one layer.");
        app.endUndoGroup();
        return;
    }

    // ========== ADVANCED RELATIONSHIPS ==========
    function analyzeParentChildRelationships(layers) {
        var relationships = {
            parents: [], children: [], independent: [], rootParents: [], hierarchyInfo: []
        };
        for (var i = 0; i < layers.length; i++) {
            var currentLayer = layers[i];
            var layerInfo = {
                layer: currentLayer,
                isParent: false, isChild: false, isRootParent: false,
                parentInSelection: null, childrenInSelection: []
            };
            if (currentLayer.parent) {
                for (var j = 0; j < layers.length; j++) {
                    if (layers[j] === currentLayer.parent) {
                        layerInfo.isChild = true;
                        layerInfo.parentInSelection = layers[j];
                        if (relationships.children.indexOf(currentLayer) === -1)
                            relationships.children.push(currentLayer);
                        break;
                    }
                }
            }
            for (var k = 0; k < layers.length; k++) {
                if (layers[k].parent === currentLayer) {
                    layerInfo.isParent = true;
                    layerInfo.childrenInSelection.push(layers[k]);
                    if (relationships.parents.indexOf(currentLayer) === -1)
                        relationships.parents.push(currentLayer);
                }
            }
            if (layerInfo.isParent && !layerInfo.isChild) {
                layerInfo.isRootParent = true;
                relationships.rootParents.push(currentLayer);
            }
            if (!layerInfo.isParent && !layerInfo.isChild)
                relationships.independent.push(currentLayer);
            relationships.hierarchyInfo.push(layerInfo);
        }
        return relationships;
    }

    function getWorldPosition(layer, localPoint, time) {
        if (!time) time = layer.containingComp.time;
        try {
            var transform = layer.transform;
            var position = transform.position.valueAtTime(time, false);
            var anchor = transform.anchorPoint.valueAtTime(time, false);
            var scale = transform.scale.valueAtTime(time, false);
            var rotation = transform.rotation.valueAtTime(time, false);
            var p = [localPoint[0] - anchor[0], localPoint[1] - anchor[1]];
            p[0] *= scale[0] / 100;
            p[1] *= scale[1] / 100;
            if (!layer.threeDLayer && rotation !== 0) {
                var rad = rotation * Math.PI / 180;
                var cos = Math.cos(rad), sin = Math.sin(rad);
                var x = p[0], y = p[1];
                p[0] = x * cos - y * sin;
                p[1] = x * sin + y * cos;
            }
            p[0] += position[0];
            p[1] += position[1];
            if (layer.parent) return getWorldPosition(layer.parent, p, time);
            return p;
        } catch (e) { return localPoint; }
    }

    function findMaxStrokeWidth(propGroup) {
        var maxStroke = 0;
        try {
            for (var i = 1; i <= propGroup.numProperties; i++) {
                var prop = propGroup.property(i);
                if (prop && prop.matchName === "ADBE Vector Graphic - Stroke" && prop.enabled) {
                    var strokeWidthProp = prop.property("Stroke Width");
                    if (strokeWidthProp)
                        maxStroke = Math.max(maxStroke, strokeWidthProp.value);
                } else if (prop && prop.matchName === "ADBE Vector Group") {
                    var contents = prop.property("Contents");
                    if (contents)
                        maxStroke = Math.max(maxStroke, findMaxStrokeWidth(contents));
                }
            }
        } catch (e) {}
        return maxStroke;
    }

    function getLayerBounds(comp, layer) {
        try {
            var maskGroup = layer.property("Masks");
            var hasEnabledMask = false;
            if (maskGroup !== null) {
                for (var i = 1; i <= maskGroup.numProperties; i++) {
                    if (maskGroup.property(i).enabled) {
                        hasEnabledMask = true;
                        break;
                    }
                }
            }
            if (hasEnabledMask) {
                var maskMinX = Infinity, maskMinY = Infinity, maskMaxX = -Infinity, maskMaxY = -Infinity;
                for (var j = 1; j <= maskGroup.numProperties; j++) {
                    var mask = maskGroup.property(j);
                    if (mask.enabled) {
                        var maskShape = mask.property("Mask Path").value;
                        var vertices = maskShape.vertices;
                        for (var k = 0; k < vertices.length; k++) {
                            maskMinX = Math.min(maskMinX, vertices[k][0]);
                            maskMinY = Math.min(maskMinY, vertices[k][1]);
                            maskMaxX = Math.max(maskMaxX, vertices[k][0]);
                            maskMaxY = Math.max(maskMaxY, vertices[k][1]);
                        }
                    }
                }
                return {
                    left: maskMinX, top: maskMinY,
                    width: maskMaxX - maskMinX, height: maskMaxY - maskMinY
                };
            } else {
                var rect = layer.sourceRectAtTime(comp.time, false);
                var strokeWidth = 0;
                if (layer.matchName === "ADBE Vector Layer") {
                    var contents = layer.property("Contents");
                    if (contents)
                        strokeWidth = findMaxStrokeWidth(contents);
                }
                var halfStroke = strokeWidth / 2;
                rect.top -= halfStroke;
                rect.left -= halfStroke;
                rect.width += strokeWidth;
                rect.height += strokeWidth;
                return rect;
            }
        } catch (e) {
            return {
                left: 0, top: 0,
                width: layer.width || 100,
                height: layer.height || 100
            };
        }
    }

    function addDashSafely(stroke, dashLength) {
        try {
            var dashes = stroke.property("Dashes");
            if (dashes) {
                var dash = dashes.addProperty("ADBE Vector Stroke Dash 1");
                if (dash) dash.setValue(dashLength);
                var offset = dashes.addProperty("ADBE Vector Stroke Offset");
                if (offset) offset.setValue(dashLength);
                return true;
            }
        } catch (e) { return false; }
        return false;
    }

    // =============================
    //     MAIN SCRIPT EXECUTION
    // =============================

    var relationships = analyzeParentChildRelationships(originalSelectedLayers);

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var validLayers = [];
    for (var i = 0; i < originalSelectedLayers.length; i++) {
        var layer = originalSelectedLayers[i];
        if (typeof layer.sourceRectAtTime !== 'function') continue;
        validLayers.push(layer);
        var rect = getLayerBounds(comp, layer);
        var corners = [
            [rect.left, rect.top], [rect.left + rect.width, rect.top],
            [rect.left, rect.top + rect.height], [rect.left + rect.width, rect.top + rect.height]
        ];
        for (var j = 0; j < corners.length; j++) {
            var worldPoint = getWorldPosition(layer, corners[j], comp.time);
            if (worldPoint) {
                minX = Math.min(minX, worldPoint[0]);
                minY = Math.min(minY, worldPoint[1]);
                maxX = Math.max(maxX, worldPoint[0]);
                maxY = Math.max(maxY, worldPoint[1]);
            }
        }
    }
    if (maxX === -Infinity) {
        app.endUndoGroup();
        return;
    }
    minX -= CONFIG.padding;
    minY -= CONFIG.padding;
    maxX += CONFIG.padding;
    maxY += CONFIG.padding;
    var boxWidth = maxX - minX;
    var boxHeight = maxY - minY;
    var boxCenter = [minX + boxWidth / 2, minY + boxHeight / 2];

    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = CONFIG.boxName;
    shapeLayer.position.setValue(boxCenter);
    shapeLayer.guideLayer = CONFIG.guideLayer;
    shapeLayer.shy = CONFIG.guideShy;

    var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
    shapeGroup.name = "Guide Rectangle";
    var rectShape = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
    rectShape.property("Size").setValue([boxWidth, boxHeight]);
    var stroke = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("Color").setValue(hexToRgb(CONFIG.strokeColor));
    stroke.property("Stroke Width").setValue(CONFIG.strokeWidth);
    stroke.property("Line Cap").setValue(2);
    stroke.property("Line Join").setValue(2);
    if (CONFIG.dashEnabled) addDashSafely(stroke, CONFIG.dashLength);

    // --- Null Controller & Parenting ---
    var nullController = null;
    if (CONFIG.createNull) {
        nullController = comp.layers.addNull();
        nullController.name = CONFIG.boxName + " Controller";
        nullController.position.setValue(boxCenter);
        nullController.guideLayer = true;
        shapeLayer.parent = nullController;
    }

    var parentTarget = CONFIG.createNull ? nullController : shapeLayer;
    var layersToParent = [];
    if (CONFIG.preserveRelationships) {
        if (CONFIG.smartParenting) {
            layersToParent = relationships.rootParents.concat(relationships.independent);
        } else {
            layersToParent = relationships.parents.concat(relationships.independent);
        }
    } else {
        layersToParent = validLayers;
    }
    for (var k = 0; k < layersToParent.length; k++) {
        try {
            layersToParent[k].parent = parentTarget;
        } catch (e) {}
    }

    // --- Layer Order ---
    try {
        var topLayer = validLayers[0];
        for (var l = 1; l < validLayers.length; l++) {
            if (validLayers[l].index < topLayer.index) topLayer = validLayers[l];
        }
        if (CONFIG.createNull && nullController) nullController.moveBefore(topLayer);
        else shapeLayer.moveBefore(topLayer);
    } catch (e) {}

    // --- Auto Collapse Fix ---
    try {
        comp.selectedLayers = [shapeLayer];
        comp.selectedLayers = originalSelectedLayers;
    } catch (e) {}
    app.executeCommand(2771); // Reveal Properties
    app.executeCommand(2771); // Collapse Properties

    app.endUndoGroup();
})();

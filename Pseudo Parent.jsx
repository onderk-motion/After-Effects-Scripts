// Pseudo Parent Panel for After Effects
// 
// Description: Control parent-child relationships with keyframes
// Author: Onder K Motion
// Version: 1.0
// 
// Installation:
// 1. Copy this file to: After Effects/Scripts/ScriptUI Panels/
// 2. Restart After Effects
// 3. Access from: Window → Pseudo Parent

(function buildUI(thisObj) {
  var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Pseudo Parent", undefined, {resizeable: true});
  
  // UI Elements
  panel.orientation = "column";
  panel.alignChildren = ["fill", "top"];
  panel.spacing = 10;
  panel.margins = 16;
  
  // === HEADER ===
  var headerGrp = panel.add("group");
  headerGrp.orientation = "row";
  headerGrp.alignChildren = ["fill", "center"];
  headerGrp.spacing = 4;
  
  // Left side - Title
  var titleGrp = headerGrp.add("group");
  titleGrp.orientation = "column";
  titleGrp.alignChildren = ["left", "top"];
  titleGrp.spacing = 2;
  
  var titleText = titleGrp.add("statictext", undefined, "PSEUDO PARENT");
  titleText.graphics.font = ScriptUI.newFont("dialog", "bold", 14);
  titleText.graphics.foregroundColor = titleText.graphics.newPen(titleText.graphics.PenType.SOLID_COLOR, [0.3, 0.5, 0.9], 1);
  
  var subtitleText = titleGrp.add("statictext", undefined, "Keyframe-based parent control");
  subtitleText.graphics.font = ScriptUI.newFont("dialog", "italic", 9);
  
  // Right side - Action buttons
  var actionGrp = headerGrp.add("group");
  actionGrp.orientation = "row";
  actionGrp.alignChildren = ["right", "center"];
  actionGrp.spacing = 4;
  actionGrp.alignment = ["right", "center"];
  
  var helpBtn = actionGrp.add("button", undefined, "?");
  helpBtn.preferredSize = [28, 28];
  helpBtn.helpTip = "Show help";
  
  var refreshBtn = actionGrp.add("button", undefined, "⟳");
  refreshBtn.preferredSize = [28, 28];
  refreshBtn.helpTip = "Clear child and parent selection";
  
  // Divider
  panel.add("panel", undefined, undefined, {borderStyle: "gray"});
  
  // === LAYER SELECTION ===
  var layerGrp = panel.add("group");
  layerGrp.orientation = "column";
  layerGrp.alignChildren = ["fill", "top"];
  layerGrp.spacing = 8;
  
  // Child Layer
  var childPanel = layerGrp.add("panel", undefined, "Child Layer");
  childPanel.orientation = "row";
  childPanel.alignChildren = ["fill", "center"];
  childPanel.margins = 10;
  
  var childNameText = childPanel.add("statictext", undefined, "None selected");
  childNameText.preferredSize = [200, 20];
  childNameText.graphics.font = ScriptUI.newFont("dialog", "regular", 11);
  
  var selectChildBtn = childPanel.add("button", undefined, "Select");
  selectChildBtn.preferredSize = [70, 24];
  
  // Parent Layer
  var parentPanel = layerGrp.add("panel", undefined, "Parent Layer");
  parentPanel.orientation = "row";
  parentPanel.alignChildren = ["fill", "center"];
  parentPanel.margins = 10;
  
  var parentNameText = parentPanel.add("statictext", undefined, "None selected");
  parentNameText.preferredSize = [200, 20];
  parentNameText.graphics.font = ScriptUI.newFont("dialog", "regular", 11);
  
  var selectParentBtn = parentPanel.add("button", undefined, "Select");
  selectParentBtn.preferredSize = [70, 24];
  
  // Divider
  panel.add("panel", undefined, undefined, {borderStyle: "gray"});
  
  // === CONTROL BUTTONS ===
  var ctrlGrp = panel.add("group");
  ctrlGrp.orientation = "column";
  ctrlGrp.alignChildren = ["fill", "center"];
  ctrlGrp.spacing = 8;
  
  var onBtn = ctrlGrp.add("button", undefined, "● ENABLE PARENT");
  onBtn.preferredSize = [-1, 36];
  onBtn.graphics.font = ScriptUI.newFont("dialog", "bold", 12);
  onBtn.enabled = false;
  
  var offBtn = ctrlGrp.add("button", undefined, "○ DISABLE PARENT");
  offBtn.preferredSize = [-1, 36];
  offBtn.graphics.font = ScriptUI.newFont("dialog", "bold", 12);
  offBtn.enabled = false;
  
  // === STATUS ===
  var statusGrp = panel.add("group");
  statusGrp.orientation = "column";
  statusGrp.alignChildren = ["fill", "center"];
  statusGrp.spacing = 4;
  
  var statusText = statusGrp.add("statictext", undefined, "Ready", {multiline: true});
  statusText.graphics.font = ScriptUI.newFont("dialog", "italic", 10);
  statusText.preferredSize = [320, 30];
  statusText.justify = "center";
  
  // Global variables
  var childLayer = null;
  var parentLayer = null;
  
  // Functions
  function updateUI() {
    childNameText.text = childLayer ? childLayer.name : "None selected";
    parentNameText.text = parentLayer ? parentLayer.name : "None selected";
    
    var canControl = (childLayer && parentLayer);
    onBtn.enabled = canControl;
    offBtn.enabled = canControl;
    
    if (canControl) {
      statusText.text = "Ready to parent";
    } else {
      statusText.text = "Please select child and parent layers";
    }
  }
  
  function getSelectedLayer() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      alert("Please open a composition!");
      return null;
    }
    var sel = comp.selectedLayers;
    if (!sel || sel.length !== 1) {
      alert("Please select exactly one layer!");
      return null;
    }
    if (!(sel[0] instanceof AVLayer)) {
      alert("Please select an AV layer!");
      return null;
    }
    return sel[0];
  }
  
  function autoSelectLayers() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      alert("Please open a composition!");
      return false;
    }
    var sel = comp.selectedLayers;
    if (!sel || sel.length !== 2) {
      alert("Please select exactly 2 layers!\n\nFirst selected = Child\nLast selected = Parent");
      return false;
    }
    if (!(sel[0] instanceof AVLayer) || !(sel[1] instanceof AVLayer)) {
      alert("Both layers must be AV layers!");
      return false;
    }
    
    childLayer = sel[0];
    parentLayer = sel[1];
    updateUI();
    statusText.text = "Auto-selected: " + childLayer.name + " → " + parentLayer.name;
    return true;
  }
  
  function setParenting(enable) {
    app.beginUndoGroup(enable ? "Pseudo Parent ON" : "Pseudo Parent OFF");
    
    try {
      var comp = app.project.activeItem;
      var currentTime = comp.time;
      var posProp = childLayer.property("ADBE Transform Group").property("ADBE Position");
      
      if (enable) {
        // ON: Move to parent position and add keyframe
        var parentPos = parentLayer.property("ADBE Transform Group").property("ADBE Position").value;
        
        // Add keyframe
        posProp.setValueAtTime(currentTime, parentPos);
        
        // Get the correct keyframe index
        var keyIndex = posProp.nearestKeyIndex(currentTime);
        
        // Apply Easy Ease - Standard 33.33% influence, 0 speed
        try {
          // Each dimension needs its own ease (X and Y for position)
          var easeIn = [
            new KeyframeEase(0, 33.33),  // X axis
            new KeyframeEase(0, 33.33)   // Y axis
          ];
          var easeOut = [
            new KeyframeEase(0, 33.33),  // X axis
            new KeyframeEase(0, 33.33)   // Y axis
          ];
          posProp.setTemporalEaseAtKey(keyIndex, easeIn, easeOut);
          
          // Set interpolation type to bezier (smooth)
          posProp.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        } catch(easeError) {
          // If ease fails, try just setting interpolation type
          try {
            posProp.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          } catch(e) {}
        }
        
        // Add expression
        var expr = 
          "var par = thisComp.layer('" + parentLayer.name.replace(/'/g, "\\'") + "');\n" +
          "try {\n" +
          "  par.transform.position.value;\n" +
          "} catch(e) {\n" +
          "  value;\n" +
          "}";
        
        posProp.expression = expr;
        statusText.text = "✓ ENABLED - Child is now following parent";
        
      } else {
        // OFF: Save current position and remove expression
        var currentPos = posProp.value;
        
        // Remove expression
        posProp.expression = "";
        
        // Add keyframe at current position
        posProp.setValueAtTime(currentTime, currentPos);
        
        // Get the correct keyframe index
        var keyIndex = posProp.nearestKeyIndex(currentTime);
        
        // Apply Easy Ease - Standard 33.33% influence, 0 speed
        try {
          // Each dimension needs its own ease (X and Y for position)
          var easeIn = [
            new KeyframeEase(0, 33.33),  // X axis
            new KeyframeEase(0, 33.33)   // Y axis
          ];
          var easeOut = [
            new KeyframeEase(0, 33.33),  // X axis
            new KeyframeEase(0, 33.33)   // Y axis
          ];
          posProp.setTemporalEaseAtKey(keyIndex, easeIn, easeOut);
          
          // Set interpolation type to bezier (smooth)
          posProp.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        } catch(easeError) {
          // If ease fails, try just setting interpolation type
          try {
            posProp.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          } catch(e) {}
        }
        
        statusText.text = "✓ DISABLED - Child is now free (position saved)";
      }
      
    } catch(e) {
      alert("Error: " + e.toString());
      statusText.text = "✗ Error occurred";
    }
    
    app.endUndoGroup();
  }
  
  function showHelp() {
    alert(
      "PSEUDO PARENT - How to Use:\n\n" +
      "1. SELECT LAYERS:\n" +
      "   • Select a layer and click 'Select' for Child\n" +
      "   • Select a layer and click 'Select' for Parent\n\n" +
      "2. CONTROL PARENTING:\n" +
      "   • 'ENABLE PARENT' - Child follows parent\n" +
      "   • 'DISABLE PARENT' - Child becomes free\n\n" +
      "3. KEYFRAMES:\n" +
      "   • Each action creates a keyframe at current time\n" +
      "   • Keyframes use Easy Ease by default\n" +
      "   • When disabled, position is preserved\n\n" +
      "TIP: Move playhead to desired time before clicking buttons!",
      "Help"
    );
  }
  
  // Event Handlers
  selectChildBtn.onClick = function() {
    var layer = getSelectedLayer();
    if (layer) {
      childLayer = layer;
      updateUI();
    }
  };
  
  selectParentBtn.onClick = function() {
    var layer = getSelectedLayer();
    if (layer) {
      parentLayer = layer;
      updateUI();
    }
  };
  
  onBtn.onClick = function() {
    setParenting(true);
  };
  
  offBtn.onClick = function() {
    setParenting(false);
  };
  
  helpBtn.onClick = function() {
    showHelp();
  };
  
  refreshBtn.onClick = function() {
    childLayer = null;
    parentLayer = null;
    updateUI();
    statusText.text = "Reset - Please select layers again";
  };
  
  // Initialize
  updateUI();
  
  // Show panel
  if (panel instanceof Window) {
    panel.center();
    panel.show();
  } else {
    panel.layout.layout(true);
  }
  
  return panel;
})(this);

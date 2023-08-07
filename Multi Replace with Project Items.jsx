// Create the UI
var win = new Window('palette', 'Replace with Project Items');
var group = win.add('group');
group.add('statictext', undefined, 'Mode:');
var dropdown = group.add('dropdownlist', undefined, ['Regular', 'Random']);
dropdown.selection = 1; // Default to 'Regular'

var closeCheckbox = win.add("checkbox", undefined, "Close the panel after use");

var btnGroup = win.add('group');
var okButton = btnGroup.add('button', undefined, 'OK', {name: 'ok'});
var cancelButton = btnGroup.add('button', undefined, 'Cancel', {name: 'cancel'});

// When the OK button is clicked
okButton.onClick = function() {
  var shouldClose = closeCheckbox.value;
  // Get the active composition
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    alert('Please select a composition');
    return;
  }

  // Get the selected layers
  var layers = comp.selectedLayers;
  if (layers.length == 0) {
    alert('No layers selected in the composition');
    return;
  }

  // Get the selected items in the project panel
  var items = app.project.selection;
  if (items.length == 0) {
    alert('No items selected in the project panel');
    return;
  }

  // If 'Random' mode is selected, shuffle the items
  if (dropdown.selection.text == 'Random') {
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }
  }

  // Replace each layer's source with the corresponding item
  app.beginUndoGroup('Replace Layers');
  for (var i = 0; i < layers.length; i++) {
    layers[i].replaceSource(items[i], false);
  }
  app.endUndoGroup();
  if (shouldClose) {
    win.close();
  }
}

// When the Cancel button is clicked
cancelButton.onClick = function() {
  win.close();
}

win.show();

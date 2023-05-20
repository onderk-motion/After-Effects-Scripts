// Create the UI panel
var scriptUIPanel = new Window("palette", "Rename Layers by Alphabet");
scriptUIPanel.orientation = "column";
scriptUIPanel.alignChildren = "left";

// Create the checkbox for characters
var charactersCheckbox = scriptUIPanel.add("checkbox", undefined, "Characters (A-Z)");
charactersCheckbox.value = true;

// Create the checkbox for numbers
var numbersCheckbox = scriptUIPanel.add("checkbox", undefined, "Numbers (0-9)");
numbersCheckbox.value = true;

// Create the rename button
var renameButton = scriptUIPanel.add("button", undefined, "Rename");
renameButton.onClick = renameLayers;

// Show the UI panel
scriptUIPanel.show();

// Function to rename the layers
function renameLayers() {
  // Get the active composition
  var comp = app.project.activeItem;

  // Check if a composition is selected
  if (comp && comp instanceof CompItem) {
    // Begin undo group
    app.beginUndoGroup("Rename Layers");

    // Get the selected options from the checkboxes
    var useCharacters = charactersCheckbox.value;
    var useNumbers = numbersCheckbox.value;

    // Specify the starting letter and number for renaming
    var letterIndex = 65; // ASCII code for 'A'
    var numberIndex = 0;

    // Iterate through each layer in the composition
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      var newName = "";

      // Determine the new name based on the selected options
      if (useCharacters && !useNumbers) {
        newName += getCharacterName(letterIndex);
        letterIndex++;
        if (letterIndex > 90) {
          letterIndex = 65; // Reset to 'A' after reaching 'Z'
        }
      } else if (useNumbers && !useCharacters) {
        newName += getNumberName(numberIndex);
        numberIndex++;
        if (numberIndex > 9) {
          numberIndex = 0; // Reset to '0' after reaching '9'
        }
      } else if (useCharacters && useNumbers) {
        if (letterIndex <= 90) {
          newName += getCharacterName(letterIndex);
          letterIndex++;
        } else {
          newName += getNumberName(numberIndex);
          numberIndex++;
        }
      }

      // Set the new name for the layer
      layer.name = newName;
    }

    // End undo group
    app.endUndoGroup();
  } else {
    // No composition selected, display an error message
    alert("Please select a composition.");
  }
}

// Helper function to get the character name based on the index
function getCharacterName(index) {
  if (index >= 65 && index <= 90) {
    // Uppercase letters (A-Z)
    return String.fromCharCode(index);
  } else {
    // Symbols and small characters
    return "";
  }
}

// Helper function to get the number name based on the index
function getNumberName(index) {
  return index.toString();
}

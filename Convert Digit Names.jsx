// Mapping digits to text.
var digitToText = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
};

// Mapping text to digits.
var textToDigit = {
    'Zero': '0',
    'One': '1',
    'Two': '2',
    'Three': '3',
    'Four': '4',
    'Five': '5',
    'Six': '6',
    'Seven': '7',
    'Eight': '8',
    'Nine': '9',
};

// Create script UI.
var mainWindow = new Window("palette", "Convert Names", undefined);
mainWindow.orientation = "column";

var groupOne = mainWindow.add("group", undefined, "groupOne");
groupOne.orientation = "row";
var dropdown = groupOne.add("dropdownlist", undefined, ["Digit to Text", "Text to Digit"]);
dropdown.selection = 0;

var groupTwo = mainWindow.add("group", undefined, "groupTwo");
groupTwo.orientation = "row";
var applyButton = groupTwo.add("button", undefined, "Apply");

mainWindow.center();
mainWindow.show();

// On Apply button click.
applyButton.onClick = function () {
    // Begin undo group.
    app.beginUndoGroup("Convert Names");

    // Get selected compositions.
    var selectedItems = app.project.selection;

    for (var i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i] instanceof CompItem) {
            var comp = selectedItems[i];

            // Determine the current conversion mapping.
            var currentMapping = dropdown.selection.index === 0 ? digitToText : textToDigit;

            // If the comp name can be converted, rename it.
            if (currentMapping.hasOwnProperty(comp.name)) {
                comp.name = currentMapping[comp.name];
            }

            // Go through all layers in the comp.
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);

                // If the layer name can be converted, rename it.
                if (currentMapping.hasOwnProperty(layer.name)) {
                    layer.name = currentMapping[layer.name];
                }
            }
        }
    }

    // End undo group.
    app.endUndoGroup();
};

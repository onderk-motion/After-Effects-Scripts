var NullLayer = app.project.activeItem.layers.addShape(); // Add Controller Name or Change with your Layer
    NullLayer.name = "Controller"; // Customize Layer Name

var DropdownItems = ["Your Item 01", "Your Item 02", "Your Item 03"]; // Dropdown Items List

var LayerDropdown = NullLayer.Effects.addProperty("ADBE Dropdown Control"); // Add Dropdown to Layer Effects Controls

var Dropdown = LayerDropdown.property(1).setPropertyParameters(DropdownItems); // Final step
    Dropdown.propertyGroup(1).name = "Your Dropdown Name"; // Your Dropdown Control Name
    Dropdown.propertyGroup(1).property(1).setValue(2); // Set Default Menu Choice (2 = Your Item 02)
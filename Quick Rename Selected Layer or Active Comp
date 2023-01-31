app.beginUndoGroup("Change Layer/Comp Name");
try {
	Layer_Select = app.project.activeItem.selectedLayers;
	if (Layer_Select.length == 1) {
		Layer_Name = Layer_Select[0];
		Layer_Name.name = prompt("New Layer Name", Layer_Name.name);
	} else if (Layer_Select.length == 0) {
		Comp_Name = app.project.activeItem;
		Comp_Name.name = prompt("New Comp Name", Comp_Name.name);
	}
} catch(err){
	alert(err.message + " (line " + err.line + ")");
} finally {
	app.endUndoGroup();
}

{
    app.beginUndoGroup("Paste Text from Clipboard");

    var myComp = app.project.activeItem;
    if (myComp != null && myComp instanceof CompItem) {
        var myTextLayer = myComp.selectedLayers[0];
        if (myTextLayer instanceof TextLayer) {
            var mySourceText = myTextLayer.property("Source Text");
            var myTextDocument = mySourceText.value;
            myTextDocument.text = system.callSystem("pbpaste");
            if (mySourceText.numKeys > 0) {
                mySourceText.setValueAtTime(myComp.time, myTextDocument);
            } else {
                mySourceText.setValue(myTextDocument);
            }
        } else {
            alert("Please select a text layer");
        }
    } else {
        alert("Please select a composition");
    }

    app.endUndoGroup();
}

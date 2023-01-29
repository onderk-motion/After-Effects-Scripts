var items = app.project.items; // get the items in the Project panel
var unusedComps = new Array(); // array to store unused compositions

// iterate through the items
for (var i = 1; i <= items.length; i++) {
    var item = items[i];
    // check if the item is a composition and not used
    if (item instanceof CompItem && item.usedIn.length == 0) {
        unusedComps.push(item.name);
    }
}

if(unusedComps.length > 0){
    alert("The following compositions are not used in any other composition:\n" + unusedComps.join("\n"));
}else {
    alert("All the compositions are used in other compositions.");
}

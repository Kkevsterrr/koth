function rand_item(items) {
    return items[Math.floor(Math.random()*items.length)];
}
function randomUpdate(data) {
    id = rand_item(Object.values(data["machines"]))["id"]
    color = rand_item(Object.values(data["teams"]))
    update({"id": id , "color" : color});
}
function randomScan(data) {
    
}

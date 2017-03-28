function rand_item(items) {
    return items[Math.floor(Math.random()*items.length)];
}

function randomUpdate(data) {
    id = rand_item(Object.values(data["machines"]))["id"]
    color = rand_item(Object.values(data["teams"]))
    update({"id": id , "color" : color});
}

function flipPorts(data) {
    for(var name in data["machines"]) {
        machine = data["machines"][name];
        if (Math.random() > 0.2) { continue; }
        num_open = 0;
        for(var service_name in machine["services"]) {
            if (Math.random() > 0.2) {
                if (machine["services"][service_name]["status"] == "open") { num_open++; }
                continue;
            }
            machine["services"][service_name]["status"] = rand_item(['open', 'closed', 'issue']);
            console.log("Flipping " + machine["services"][service_name]["port"] + " ("+service_name+") for machine " + name);
            if (machine["services"][service_name]["status"] == "open") { num_open++; }
        }
        machine["status"] = num_open + "/" + Object.keys(machine["services"]).length;
        machine["percentage"] = 100 * (num_open / Object.keys(machine["services"]).length);
    }
    return data;
}

function randomScan(data) {
    for(var i = 0; i < data["chart"].length; i++) {
        scores = data["chart"][i]
        score_adj = (Math.random() < 0.5 ? -1 : 1) * (scores[1] * Math.random() / 4)
        data["chart"][i].push(scores[scores.length - 1] + score_adj)
    }
    flipPorts(data);
    scan(data);
}

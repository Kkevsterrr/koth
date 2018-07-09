# koth

King of the Hill (KotH) is an active cybersecurity competition in which multiple teams fight for control of a large vulnerable network, designed to give students experience performing and defending against penetration testing. Each team is given machines to defend, and must attack other team's boxes. 

Check out the demo of the front end on github.io [here](https://kkevsterrr.github.io/koth/index.html)! 

## Competition

KotH participants are divided into teams, and each team must work together to attack, control, and defend as many computers on a target network as they can. 

Gameplay occurs over a large, complex, isolated virtual environment, comprised of vulnerable Linux and Windows virtual machines of various builds that are spread across multiple partially interconnected subnet- works. Each team's goal is to exploit as many vulnerable machines on the network as they can, claim them by calling out to the global scorebot, defend them from other teams, and protect their critical services. 

Teams earn points keeping critical services up-and-running on the machines they control. They therefore have to consider the real-world trade-offs between keeping a vulnerable service up or shutting it down to help keep the rest of their network safe from attack. 

For detailed information, please view our [ASE 2018 paper](http://koth.cs.umd.edu/papers/koth_ase2018.pdf) or at [koth.cs.umd.edu](http://koth.cs.umd.edu).

Note that repository is solely the front-end for the competition - in order to run KotH, you will have to setup the network itself.

## How it works

The scorebot is written in node.js and functions as both the front-end for the network diagram and as the centralized hub for integrity checks and phone-homes. Machines on the network issue 'phone-homes' to the scorebot by issuing a GET or POST request to a scorebot IP with the team color as the parameter. For example, to claim a machine:

```
# wget <SCOREBOTIP>:8000?team=blue
[!] Box claimed for team Blue.
```

Once the scorebot receives a phone home, it pushes an update out to all the web client maps to update the network map colors. 

Every 2 minutes, the scorebot scans all the critical ports for all of the machines in the network map, and awards points to the team who's claimed the box.


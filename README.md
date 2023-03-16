# Astral Brridge Contracts Post Ren SDK

this repo has only been created so i can develop the bridge contracts external to the main astral backend. Since my commits are tied to an api server, developing contracts is more cumbersome so i have abstracted the bridge to this repo

# Astral Bridge
the ideas seen in the stral contraccts are inspired from the bridge flow hat the Ren protocol uses. That is when a user wants to move asset A from blockchain X to blockchain Y, the orgignal Asset A is locked up in a vault. then once a few security paraeteres have been met (explained below) we can mint a ERC-20 synthetic version of the original token on the destination chain with a 1:1 peg. Since i am building this solo and for hobby astral assets do no refleect ther counterpart. but in such a scenario luiquidty would be provided to make sure that the synth assets has a peg to th real ones

# astral bridge breakdown
The bridge works like a commoon factory. there is a registry of suppportted assets that astral supports.From here we have a duplicate smart contrac bindings. Each Astral asseet will have its own native address and bridge address associated with itlself. people can query the statste of this at any to get information on the the token being bridged or released. 

# Security
Users can execute cross chain transactions using astral api. howeveer how safe is it. Well ive only been building this out for a few weeks and the main build /contracs are not complete yet. right now there is a good bit of work i need to do on access control and upgradavle proxies.

## to view core astral backend visit
https://github.com/mcgraneder/astral-sol

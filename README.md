# FitBit-Heartrate-Variability-Software
This repository contains source code for the FitBit HRV Monitor Software. 

# How to build and test the software
## Using the FitBit OS Simulator
As of March 2023, FitBit has changed their online development environment to a CLI based environment. This CLI environment works on Windows,
MacOS, and Linux. There is also a FitBit OS Simulator you can download it for [Windows](https://simulator-updates.fitbit.com/download/stable/win)
or [Mac](https://simulator-updates.fitbit.com/download/stable/mac). You will also need to use a code editor with a terminal in order to connect
to the FitBit OS Simulator. [Here](https://dev.fitbit.com/build/guides/command-line-interface/) is FitBit's official guide for their CLI and how
to use it.

In the terminal of your chosen IDE, change directory into the project - if you're using the same file structure as this one you should be
in the WatchCode folder. Then run the command: *npx fitbit*. This will launch the FitBit CLI. Next, open up the FitBit OS Simulator. Finally,
run the command: *bi* in the FitBit CLI. This will build and install the watch face on the simulator for use.

## Deploying onto the watch
The steps for deploying the application onto a watch is the same as onto the simulator.

To make sure the application can be deployed to the CLI, make sure that you have a watch associated with the fitbit developer account that you are using. Follow steps to activate developer mode on the watch, make sure that the devloper bridge is connected on both the watch and the companion app.
Guide here: https://dev.fitbit.com/getting-started/

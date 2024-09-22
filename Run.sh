#!/bin/bash
screen -S StateAPI -X quit
screen -dmS StateAPI node Status.js

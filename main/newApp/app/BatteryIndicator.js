import { battery } from "power";
import * as document from "document";

export class BatteryIndicator 
{
    constructor()
    {
        this.batteryLevel = document.getElementById("batteryValue");
        this.batteryFillLevel = document.getElementById("batteryFill");
        this.batteryBody = document.getElementById("batteryBody");
        this.batteryFillWidth = this.batteryBody.width - 4;
    }

    draw() 
    {
        let level = battery.chargeLevel;
        this.batteryLevel.text = "" + (Math.floor(level)) + "%";
        this.batteryFillLevel.width = this.batteryFillWidth - Math.floor((100 - level) / 100 * this.batteryFillWidth);
    }
}
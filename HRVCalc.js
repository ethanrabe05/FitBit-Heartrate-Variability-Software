class HRVCalc
{
    constructor()
    {
        this.MPBList = []; // max length of 300
        this.HRList = []; // max length of 60
        this.HRVList = []; // max length of 300
        this.baselineZScore = 0;
    }

    calculateMRR()
    {
        let N = this.MPBList.length;
        let sum = 0;

        this.MPBList.forEach(i => sum += i);

        return sum / N;
    }

    calculateHRVSDNN()
    {
        let N = this.MPBList.length;
        let mean = this.calculateMRR();
        let results = 0;

        this.MPBList.forEach(i => results = (results + Math.pow(i - mean, 2)))

        results = (results / (N));
        return Math.sqrt(results);
    }

    processHRV(heartRate)
    {
        this.HRList.unshift(heartRate);
        if(this.HRList.length > 60) {
            this.HRList.pop();
        }

        this.MPBList.unshift(60000 / heartRate);
        if(this.MPBList.length > 300) {
            this.MPBList.pop();
        }

        this.HRVList.unshift(this.calculateHRVSDNN())
        if(this.HRVList.length > 300) {
            this.HRVList.pop();
        }
    }

    getLatestHRV()
    {
        return this.HRVList[this.HRVList.length - 1];
    }

    getLastOutlierStatus()
    {
        return false;
    }

}

export{HRVCalc};
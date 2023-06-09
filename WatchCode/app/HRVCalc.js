class HRVCalc{

    constructor(){
        this.timestampList = []; // max length of 120
        this.HRList = []; // max length of 120
        this.HRVList = []; // max length of 300
        this.curOutlierStatus = false;
    }

    calculateMRR()
    {
        let N = this.HRList.length;
        let sum = 0;

        this.HRList.forEach(i => sum += (60000 / i));

        return sum / N;
    }

    calculateHRVSDNN()
    {
        if(this.HRList.length < 30){
            return 0;
        }
        let N = this.HRList.length;
        let mean = this.calculateMRR();
        let results = 0;
        let hravg = 0;
        let count = 0;

        for(let i = 0; i < N - 1; i+=5){
            count = 0;
            if(i + 5 <= N - 1) {
                for(let j = i; j < i + 5 && j < N - 1; j++) {
                    hravg += this.HRList[j];
                }
                hravg /= 5;
                console.log(hravg);
                results += Math.pow((60000 / hravg) - mean, 2);
            }
        }

        results = (results / (N));
        return Math.sqrt(results);
    }

    //adds heart rate, timestamp of reading, and HRV to beginning of respective array.
    processHRV(heartRate, timestamp)
    {
        console.log(this.HRList.length);
        this.HRList.unshift(heartRate);
        if(this.HRList.length > 300) {
            this.HRList.pop();
        }

        this.timestampList.unshift(timestamp);
        if(this.timestampList.length > 300) {
            this.timestampList.pop();
        }

        let curHRV = this.calculateHRVSDNN();
        console.log(curHRV);
        if(curHRV !== 0) {
            this.HRVList.unshift(Math.round(curHRV));
        }
        if(this.HRVList.length > 300) {
            this.HRVList.pop();
        }

        //Calculate if HRV is an outlier
        if(this.HRVList.length < 30){ //Cannot determine an outlier with less than 30 HRV values
            this.updateVarianceMean();
            this.updateVariance();
        }
        else{ //HRV list can calc outlier
            this.calculateOutlier();
        }
    }

    //Sends a notification to user when HRV is .5 of HRV of last 10 seconds
    calculateOutlier(){
        this.curOutlierStatus = false;

        let avg = 0;
        for(let i = 0; i < 10; i++) {
            avg += this.HRVList[i];
        }
        avg /= 10;
        //Change .5 to different value to change desired notification threshold
        this.curOutlierStatus = avg <= (this.getLatestHRV() * .5); 
        return this.curOutlierStatus;
    }

    //The most recent calculated HRV value will be the one at the beginning of the list
    getLatestHRV()
    {
        return this.HRVList[0];
    }

    getLastOutlierStatus() {
        return this.curOutlierStatus;
    }
}

export{HRVCalc};
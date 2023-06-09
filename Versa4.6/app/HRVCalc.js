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

        /*for(let i = 0; i < this.timestampList.length - 1; i++) {
            sum += (this.timestampList[i] - this.timestampList[i+1]);
        }*/
        /*for(let i = 0; i < this.timestampList.length - 1; i++) {
            sum += ((this.timestampList[i] - this.timestampList[i+1]) + 60000/this.HRList[i]) / 2;
        }*/
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
            //console.log(this.timestampList[i+1] - this.timestampList[i]);
            //results += Math.pow((this.timestampList[i] - this.timestampList[i+1]) - mean, 2);
            if(i + 5 <= N - 1) {
                for(let j = i; j < i + 5 && j < N - 1; j++) {
                    hravg += this.HRList[j];
                }
                hravg /= 5;
                console.log(hravg);
                results += Math.pow((60000 / hravg) - mean, 2);
            }
            //results += Math.pow((((this.timestampList[i] - this.timestampList[i+1]) + 60000/this.HRList[i]) / 2) - mean, 2);
        }

        results = (results / (N));
        return Math.sqrt(results);
    }

    processHRV(heartRate, timestamp)
    {
        console.log(this.HRList.length);
        this.HRList.unshift(heartRate);
        if(this.HRList.length > 300) {
            this.HRList.pop();
        }

        //console.log(timestamp);
        this.timestampList.unshift(timestamp);
        //console.log(this.timestampList[0] - this.timestampList[1]);
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


    calculateOutlier(){
        this.curOutlierStatus = false;

        let avg = 0;
        for(let i = 0; i < 10; i++) {
            avg += this.HRVList[i];
        }
        avg /= 10;

        this.curOutlierStatus = avg <= (2 / this.getLatestHRV());
        return this.curOutlierStatus;
    }

    getLatestHRV()
    {
        return this.HRVList[0];
    }

    getLastOutlierStatus() {
        return this.curOutlierStatus;
    }
}

export{HRVCalc};
class HRVCalc{

    constructor(){
        this.timestampList = []; // max length of 60
        this.HRList = []; // max length of 60
        this.HRVList = []; // max length of 300
        this.varianceList = []; //max length of 300
        this.varianceMean = 0;
        this.variance = 0;
        this.curOutlierStatus = false;
        this.curZScore = 0;
        this.baselineZScore = 0;
    }

    calculateMRR()
    {
        let N = this.timestampList.length;
        let sum = 0;

        this.timestampList.forEach(i => sum += ((i+1) - i));

        return sum / N;
    }

    calculateHRVSDNN()
    {
        if(this.HRList.length < 60 && this.timestampList.length < 60){
            return;
        }
        let N = this.timestampList.length;
        let mean = this.calculateMRR();
        let results = 0;

        //this.TimestampList.forEach(i => results = (results + Math.pow(((i+1) - i) - mean, 2)));
        for(let i = 0; i < N - 1; i++){
            results += Math.pow((this.timestampList[i + 1] - this.timestampList[i]) - mean, 2);
        }

        results = (results / (N));
        return Math.sqrt(results);
    }

    processHRV(heartRate, timestamp)
    {
        this.HRList.unshift(heartRate);
        if(this.HRList.length > 60) {
            this.HRList.pop();
        }

        this.timestampList.unshift(timestamp);
        if(this.timestampList.length > 60) {
            this.timestampList.pop();
        }
        
        let curHRV = this.calculateHRVSDNN();
        this.HRVList.unshift(curHRV);
        if(this.HRVList.length > 300) {
            this.HRVList.pop();
        }
        curHRV = this.calculateHRVSDNN();

        //Calculate if HRV is an outlier
        if(this.HRVList.length < 30){ //Cannot determine an outlier with less than 30 HRV values
            this.updateVarianceMean();
            this.updateVariance();
        }
        else{ //HRV list can calc outlier
            this.calculateOutlier();
            if((this.curZScore < 3) && (this.curZScore > (this.baselineZScore * 1.1))){
                this.updateVarianceMean();
            }
            this.updateVariance();
        }
    }

    updateVarianceMean(){
        this.varianceMean = ((((this.varianceMean * this.HRVList.length) - this.HRVList[0]) + this.varianceList[0]) / this.HRVList.length);
    }

    updateVariance(){
        let sum = 0;
        for(let i = 0; i < this.varianceList.length; i++){
            sum += Math.pow((this.varianceList[i] - this.varianceMean), 2);
        }
        this.variance = (sum / (this.HRList.length));
    }

    calculateOutlier(){
        this.curOutlierStatus = false;
        if(this.variance == 0){
            return;
        }
        this.curZScore = (this.HRVList[0] - this.varianceMean) / Math.sqrt(this.variance);
        if(this.curZScore < this.baselineZScore){
            this.curOutlierStatus = true;
        }
    }

    getLatestHRV() 
    {
        if (this.HRVList.length < 30)
        {
            return 0;
        }
        return this.HRVList[0];
    }

    getLastOutlierStatus() {
        return this.curOutlierStatus;
    }
}

export{HRVCalc};
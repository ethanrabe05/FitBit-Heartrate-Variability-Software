import * as HeartRateLL from "./HeartRateLL.js";
import * as HRVLL from "./HRVLL.js";

/*
 * To measure HRV, you must have a compatible heart rate monitor that can accurately sense 
 * RR intervals. Many monitors do not meet this standard because:
 * 
 * 1. They were not designed with HRV in mind, and do not have the required accuracy. Most wrist-wearables 
 * (watches, etc) fall into this category.
 * 
 * 2)They record RR-intervals but artificially "smooth", average or alter them before transmitting to us.
 * 
 * 
 * Most wristbands and watches have difficulty sorting through the "noise" of an HRV 
 * reading because of all the complicated tissue in your wrist that surrounds your arteries.
 */
class HRV
{

    /**
     * @param {Integer} heartRateListWindowSize (Window size)
     * @param {Integer} hrvWindowSize (Old HRV data to keep around)
     */
    constructor(heartRateListWindowSize = 6, hrvWindowSize = 30)
    {
        this.heartRateListWindowSize = heartRateListWindowSize;
        this.HRVWindowSize = hrvWindowSize;

        this.HRVListEnd = HRVLL.generateEmptyList(this.HRVWindowSize);
        this.heartRateListEnd = HeartRateLL.generateEmptyList(this.heartRateListWindowSize);   //always points to the oldest data (tail)

        this.varianceListEnd = HRVLL.generateEmptyList(this.HRVWindowSize);
        this.meanForVariance = 0;
        this.poppedHRVValue = 0;
        this.variance = 0;        
        this.currentHRV = 0;
        this.currentOutlierStatus = false;
        this.currentZScore = 0;

        //This value is interactively changed in settings. Set to around -.5 for very sensitive.
        //Generally it should be around [-1.0, -3.0]
        this.baseLineZScore = -2.0;//If you want to test visuals - bring value closer to 0
    }

   /**
    * @param {number} heartRate 
    * @returns single number representing milliseconds between beats.
    */
    calculateMPB(heartRate)
    {
       return (60000 / heartRate);//convert bpm to ms between beats
    }

    /**
     *  Mean of RR Intervals
     *  1/(N − 1)sum{i=2 -> N}[Interval],
     * @returns mean
     */
    calculateMRR()
    {
        let N = this.heartRateListWindowSize;
        let mean = 0;
        let current = this.heartRateListEnd;

        do
        {
            mean += current.millisecondsPerBeat;
            current = current.next;
        }while(current != this.heartRateListEnd);
        // for (var i = 1; i < N; i++)
        // for (var i = 0; i < N; i++)
        // {
        //     mean += current.millisecondsPerBeat;
        //     current = current.next;
        // }

        // mean = mean / (N - 1);
        mean = mean / N;
        return mean;
    }

    /**
     * The Standard Deviation of Normal to Normal heartbeats (SDNN)
     * 
     * SDNN = sqrt[(1/N-1) * sum{i=2 -> N}[RR(i) - RRMean]^2]
     * 
     * @returns Standard Deviation
     */
    calculateHRVSDNN()
    {
        let N = this.heartRateListWindowSize;
        let mean = this.calculateMRR();
        let results = 0;
        let current = this.heartRateListEnd;
    

        do
        {
            results = (results + Math.pow(current.millisecondsPerBeat - mean, 2));
            current = current.next;
        }while(current != this.heartRateListEnd);
    
        results = (results / (N - 1));      
        results = Math.sqrt(results);
        return results;
    }

    /** 
    * takes in a heart rate in the form of Beats Per Minute.
    * 
    * saves data into appropriate fields and calls appropriate methods to
    * transition from beats per minute, to milliseconds per beat, and then
    * finally to a Heart Rate Variability.
    * 
    * calls a method to see if the data is considered an outlier
    * 
    * saves all information into class and list variables.
    * @param {number} heartRate 
    * @void
    * 
    */
    processHRV(heartRate)
    { 
        this.heartRateListEnd.heartRate = heartRate;
        this.heartRateListEnd.millisecondsPerBeat = this.calculateMPB(heartRate);
        this.heartRateListEnd = this.heartRateListEnd.next;
        
        /*Check to see if at least windowSize - 1 heart beats have been read*/
        if (this.heartRateListEnd.heartRate == 0)
        {
            //heart rate list is not full yet, can not calculate HRV yet.
            return;
        }
        
        this.currentHRV = this.calculateHRVSDNN();

        if (this.HRVListEnd.heartRateVariability == 0)
        {
            //HRV list is not full, cannot determine outlier status
            this.poppedHRVValue = this.popHRV();
            this.HRVListEnd.heartRateVariability = this.currentHRV;
            this.HRVListEnd.time = new Date();
            this.varianceListEnd.heartRateVariability = this.HRVListEnd.heartRateVariability;
            this.varianceListEnd.time = this.HRVListEnd.time;
            this.updateVarianceMean();
            if (this.HRVListEnd.next.heartRateVariability != 0)
            {
                this.updateVariance();
            }
        }
        else
        {
            //HRV list is full. now variance and outlier can be determined
            this.calculateOutlier();
            this.HRVListEnd.heartRateVariability = this.currentHRV;
            this.HRVListEnd.time = new Date();
            this.HRVListEnd.zScore = this.currentZScore;
            this.HRVListEnd.outlier = this.currentOutlierStatus;
            if ((this.currentZScore < 3) && (this.currentZScore > (this.baseLineZScore * 1.1)))
            {
                //not an outlier by current mean and not outside of our minimum z-score range
                this.poppedHRVValue = this.popHRV();
                this.varianceListEnd.heartRateVariability = this.HRVListEnd.heartRateVariability;
                this.varianceListEnd.time = this.HRVListEnd.time;
                this.varianceListEnd.zScore = this.HRVListEnd.zScore;
                this.varianceListEnd.outlier = this.HRVListEnd.zScore;
                this.updateVarianceMean();
            }
            else
            {
                //outlier, or outside of our preferred  z-score range
                //Do nothing else
            }
            this.updateVariance();

        }
        this.HRVListEnd = this.HRVListEnd.next;
        this.varianceListEnd = this.varianceListEnd.next;
    }

   /**
    * **NOT UTILIZED AT THIS TIME. Needs to be updated to reflect 
    *   changes that have been made in processHRV()
    * 
    * takes in a heart rate in the form of Beats Per Minute and the 
    * time it was taken.
    * 
    * It uses the time to figure out what the exact time difference is
    * and then create an estimated interval between beats using that.
    * 
    * saves data into appropriate fields and calls appropriate methods to
    * transition from beats per minute, to milliseconds per beat, and then
    * finally to a Heart Rate Variability.
    * 
    * calls a method to see if the data is considered an outlier
    * 
    * saves all information into class and list variables.
    * @param {Number} heartRate 
    * @param {Number} timestamp Timestamp in milliseconds
    * @returns 
    */
    processHRVwTime(heartRate, timestamp)
    {

        this.heartRateListEnd.heartRate = heartRate;
        this.heartRateListEnd.time = timestamp;
        this.heartRateListEnd.millisecondsPerBeat = this.calculateMPB(heartRate);
        var timeDiff = 0;
        var estimatedBeatCount = 0; 
        var averageInterval = 0;

        if (this.heartRateListEnd.previous.time == 0)
        {
            this.heartRateListEnd = this.heartRateListEnd.next;
            return;
        }
        timeDiff = this.heartRateListEnd.time - this.heartRateListEnd.previous.time;
        estimatedBeatCount = timeDiff / this.heartRateListEnd.millisecondsPerBeat;
        averageInterval = timeDiff / estimatedBeatCount;

        this.heartRateListEnd.millisecondsPerBeat = averageInterval;
        this.heartRateListEnd = this.heartRateListEnd.next;
        
        /*Check to see if at least windowSize - 1 heart beats have been read*/
        if (this.heartRateListEnd.heartRate == null)
        {
            return;
        }

        this.poppedHRVValue = this.popHRV();
        this.HRVListEnd.heartRateVariability = this.calculateHRVSDNN();
        this.HRVListEnd.time = new Date();
        this.HRVListEnd = this.HRVListEnd.next;
        this.updateRunningVariables();
        this.calculateOutlier();

    }

    /**
     * 
     * @returns Last nodes data of the circularly linked list
     * -No deletion-
     */
    popHRV()
    {
        return this.varianceListEnd.heartRateVariability;
    }

    /**
     * Updates the mean that is used for calculating variance.
     * @returns void
     */
    updateVarianceMean()
    {
        this.meanForVariance = ((((this.meanForVariance * this.HRVWindowSize) - this.poppedHRVValue) + this.varianceListEnd.heartRateVariability) / this.HRVWindowSize)
    }

    /**
     * updates the variance that is used to calculate outliers
     * @returns void
     */
    updateVariance()
    {
        let sum = 0;
        //Set to the front
        let currentNode = this.varianceListEnd.next;
        do
        {
            sum += Math.pow((currentNode.heartRateVariability - this.meanForVariance), 2);
            currentNode = currentNode.next;
        }while(currentNode != this.varianceListEnd.next);

        this.variance = (sum / (this.HRVWindowSize - 1));
    }
    
   /**
    * Takes the lates HRV and checks to see if it is an outlier and sets
    * the outlier variable appropriately 
    * @returns boolean (True if outlier, False if not)
    */
    calculateOutlier()
   {
        this.currentOutlierStatus = false;
        if (this.variance == 0)
        {
            return;
        }

        this.currentZScore = (this.currentHRV - this.meanForVariance) / Math.sqrt(this.variance);
        if (this.currentZScore < this.baseLineZScore)
        {
            this.currentOutlierStatus = true;
        }
    }
     
    /**
     * grabs the latest hrv value from data structure
     * @returns Current HRV
     */
    getLatestHRV() 
    {
        if (this.HRVListEnd.previous.heartRateVariability == null)
        {
            return 0;
        }
        return this.HRVListEnd.previous.heartRateVariability;
    }

    /**
     * grabs the latest z-score value from data structure
     * @returns Current ZScore
     */
    getLastZScore()
    {
        return this.HRVListEnd.previous.zScore;
    }

    /**
     * 
     * @returns Outlier status of the latest heartrate
     */
    getLastOutlierStatus()
    {
        return this.HRVListEnd.previous.outlier;
    }

    /**
     * This outlier status is meant to get the outlier status of a specific 
     * reading going backwards from the last read in zero indexing.
     * 
     * the last reading is always the first previous in the list, since
     * the current list pointer points to the oldest value.
     * 
     * ex: outliers in order F T T F F T F
     * 
     * if 2 is passed in, you will get F
     * most current is false, next one back (1) is true, 
     *   and the one before (2) is false
     * 
     * @param {Integer} index 
     * @returns boolean
     */
    getOutlierStatus(index)
    {
        var current = this.HRVListEnd.previous;
        for (var i = 0; i < index; i++)
        {
            current = current.previous;
        }

        return current.outlier;
    }

    /**
     * Zeroes the Heart Rate list and HRV list
     * @void
     */
    clearList()
    {
        let N = this.heartRateListWindowSize;
        let current = this.heartRateListEnd;
        for(let i = 0; i <= N; i++)
        {
            current.heartRate = 0;
            current.millisecondsPerBeat = 0;
            current.time = 0;
            current = current.next;
        }

        N = this.HRVWindowSize;
        current = this.HRVListEnd;
        for(let i = 0; i <= N; i++)
        {
            current.heartRateVariability = 0;
            current.time = 0;
            current.outlier = false;
            current = current.next;
        }
    }

    /**
     * @returns Base ZScore value.
     */
    getbaseLineZScore()
    {
        return this.baseLineZScore
    }

    /**
     * Updates the baseline z-score
     * @param {Number} newBaseLine 
     */
    setBaseLineZScore(newBaseLine)
    {
        this.baseLineZScore = newBaseLine;
    }

    /**
     * 
     * do we really need the below getters? If not, delete! 
     */
    getHeartRateListWindowSize()
    {
        return this.heartRateListWindowSize;
    }

    getHRVWindowSize()
    {
        return this.HRVWindowSize;
    }

    getHeartRateListEnd()
    {
        return this.heartRateListEnd;
    }
    
    getMeanForVariance()
    {
        return this.meanForVariance;
    }

    getVariance()
    {
        return this.variance;
    }

    
    // /**DEPRICATED
    //  * 
    //  *  "runningMean": Number,
    //  *  "runningVariance": Number,
    //  *  "runningSampleSize": Number
    //  * 
    //  * @returns JSON formatting of the running variables
    //  */
    // getRunningValues()
    // {
    //     let output_json = {
    //         runningMean: this.runningMean,
    //         runningVariance: this.runningVariance,
    //         runningSampleSize: this.runningSampleSize
    //     };

    //     return output_json;
    // }
  
    // setRunningValues(json_input)
    // {
    //   this.runningMean = JSON.parse(json_input).runningMean;
    //   this.runningVariance = JSON.parse(json_input).runningVariance
    //   this.runningSampleSize = JSON.parse(json_input).runningSampleSize
    // }
    //  
    // /** 
    //  * should be done with each new entry
    //  * 
    //  * take standard deviation of values
    //  * return single value representing standard deviation or HRV
    //  * 
    //  * RMSSD = sqrt[(1/N-1) * sum{i=1 -> N}[RR(i) - RR(i-1)]^2]
    //  * RMSSD = sqrt[(1/N-2) * sum{i=3 -> N}[RR(i) - RR(i-1)]^2]
    //  *   
    //  * The root mean square of successive differences between normal heartbeats 
    //  * (RMSSD) is obtained by first calculating each successive time difference 
    //  * between heartbeats in ms. Then, each of the values is squared and the result 
    //  * is averaged before the square root of the total is obtained
    //  * 
    //  * @returns The root mean square of successive differences between normal heartbeats
    //  */  
    //  calculateHRVRMSSD()
    //  {
 
    //      let N = this.heartRateListWindowSize;
    //      let results = 0;
    //      let current = this.heartRateListEnd.next.next;
         
    //      for (var i = 2; i < N - 1; i++)
    //      {
    //          results = results + Math.pow(current.millisecondsPerBeat - current.next.millisecondsPerBeat, 2);
    //          current = current.next;
    //      }
     
    //      results = (results / (N - 2));
    //      results = Math.sqrt(results);
    //      return results;
    //  }

}

export{HRV};

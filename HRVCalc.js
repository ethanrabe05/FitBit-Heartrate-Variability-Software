const MPBList = []; // max length of 300
const HRList = []; // max length of 60
const HRVList = []; // max length of 300

function calculateMRR()
{
    let N = MPBList.length;
    let sum = 0;

    MPBList.forEach(i => sum += i);

    return sum / N;
}

function calculateHRVSDNN()
{
    let N = MPBList.length;
    let mean = calculateMRR();
    let results = 0;

    MPBList.forEach(i => results = (results + Math.pow(i - mean, 2)))

    results = (results / (N));
    return Math.sqrt(results);
}

function processHRV(heartRate)
{
    HRList.unshift(heartRate);
    if(HRList.length > 60) {
        HRList.pop();
    }

    MPBList.unshift(60000 / heartRate);
    if(MPBList.length > 300) {
        MPBList.pop();
    }

    HRVList.unshift(calculateHRVSDNN())
    if(HRVList.length > 300) {
        HRVList.pop();
    }
}
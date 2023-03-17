class Node 
{   
    /**
    * 
    * @param {Number} heartRate 
    * @param {Date} time 
    * @param {Node ref} next 
    * @param {Node ref} previous 
    * @param {boolean} outlier 
    */
    constructor(heartRateVariability = 0, time = 0, next = null, previous = null, outlier = false) 
    {
        this.heartRateVariability = heartRateVariability;
        this.time = time;
        this.zScore = 0;
        this.outlier = outlier;
        this.next = next;
        this.previous = previous;
    }
}

/**
 * Generates an empty circulary linked list that will hold HRV
 * @param {Integer} listSize 
 * @returns head node
 */
function generateEmptyList(listSize)
{
    let head = new Node();
    let current = head;
    for (var i = 1; i < listSize; i++)
    {
        current.next = new Node();
        current.next.previous = current;
        current = current.next;
    }
    current.next = head;
    head.previous = current;

    return head;
}

/**
 * planned for future use to save data in list to JSON.
 */
function saveListJSON(headNode)
{
    let current = head;
    var output_json = {};
    while (current.next != head)
    {
        output_json += {
            "heartRateVariability": this.heartRateVariability,
            "time": this.time,
            "outlier": this.outlier
        }; 
    }

    return output_json;
}

export{Node, generateEmptyList, saveListJSON};
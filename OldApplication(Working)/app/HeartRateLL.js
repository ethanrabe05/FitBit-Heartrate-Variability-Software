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
    constructor(heartRate = 0, time = 0, next = null, previous = null) 
    {
        this.heartRate = heartRate;
        this.millisecondsPerBeat = 0;
        this.time = time;
        this.next = next;
        this.previous = previous;
    }
}

/**
 * Generates an empty circulary linked list that will hold Heart Rates
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

export{Node, generateEmptyList};
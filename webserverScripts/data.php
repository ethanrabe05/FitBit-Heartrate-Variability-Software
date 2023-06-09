<?php
$hr = $_POST['hr'];
$hrv = $_POST['hrv'];
$outlierStatus = $_POST['outlierStatus'];
$date = date("m/d/y H:i:s");
echo "$hr, $hrv, $outlierStatus";

if(file_exists(date("m-d-y") . "dataDaily.csv") == False){
        fopen(date("m-d-y") . "dataDaily.csv", "w");
}

if(file_exists(date("m-y") . "dataMonthly.csv") == False) {
        fopen(date("m-y") . "dataMonthly.csv", "w");
}

$filenames = array(date("m-d-y") . "dataDaily.csv", date("m-y") . "dataMonthly.csv", "dataTotal.csv");

                foreach ($filenames as  $filename){
                        // open csv file for writing
                        $f = fopen($filename, 'a');

                        if ($f === false) {
                                die('Error opening the file ' . $filename);
                        }

                        // write each row at a time to a file
                        $dat = [$date, $hr, $hrv, $outlierStatus];
                        fputcsv($f, $dat);

                        // close the file
                        fclose($f);
                }

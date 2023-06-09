<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Csv Downloads</title>
    <style>
      .img-box {
        display: inline-block;
        text-align: center;
        margin: 0 15px;
      }
    </style>
  </head>
  <body>
    <?php
    // Array encompassing sample image file names
    $datas = ["dataTotal.csv", date("m-y") . "dataMonthly.csv", date("m-d-y") . "dataDaily.csv"];

    // Looping through the array to generate an image gallery
    foreach ($datas as $datas) {
        echo '<div class="dow-box">';
        echo '<p><a href="' . $datas . '?file=' . urlencode($datas) . '">' . $datas . '</a></p>';
        echo '</div>';
    }
?>

<h4>Testing only</h4>
<form method="post">
  HeartRate: <input type="text" name="hr">
  HeartRateVariability: <input type="text" name="hrv">
  outlierStatus: <input type="text" name="outlierStatus">
  <input type="submit">
</form>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // collect value of input fieldi
        //

        if(file_exists(date("m-d-y") . "dataDaily.csv") == False){
                fopen(date("m-d-y") . "dataDaily.csv", "w");
        }

        if(file_exists(date("m-y") . "dataMonthly.csv") == False){
                fopen(date("m-y") . "dataMonthly.csv", "w");
        }

        $date = date("m/d/y H:i:s");
        $hr = $_POST['hr'];
        $hrv = $_POST['hrv'];
        $outlierStatus = $_POST['outlierStatus'];
        #if (empty($hr) || empty($hrv) || empty($outlierStatus)) {
        #       echo "a data field was left empty";
        #}      
        #else {
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
        #}
}
?>

  </body>
</html>
                   

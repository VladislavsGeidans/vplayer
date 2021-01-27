<?php
    include_once('config/databaseConfig.php');
?>

<html>
    <head>
        <meta charset="UTF-8">
        <title>VPlayer - Settings</title>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1">
        <link rel="shortcut icon" type="image/jpg" href="assets/icons/favicon.ico"/>
        <link rel="stylesheet" type="text/css" href="assets/vendor/bootstrap/css/bootstrap.min.css">
        <link rel="stylesheet" type="text/css" href="assets/vendor/bootstrap/css/bootstrap-grid.min.css">
        <link rel="stylesheet" type="text/css" href="assets/vendor/bootstrap/css/bootstrap-reboot.min.css">
        <link rel="stylesheet" type="text/css" href="assets/vendor/bootstrap/css/bootstrap-utilities.min.css">
        <link rel="stylesheet" type="text/css" href="assets/css/styles.css">
        <script type="text/javascript" src="assets/vendor/jquery/jquery-3.5.1.min.js"></script>
        <script type="text/javascript" src="assets/vendor/bootstrap/js/bootstrap.min.js"></script>
        <script type="text/javascript" src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
        <script type="text/javascript" src="assets/vendor/blockUI/jquery.blockUI.js"></script>
        <script src="https://kit.fontawesome.com/3fc26c8e8f.js" crossorigin="anonymous"></script>
        <script type="text/javascript" src="assets/js/scripts.js"></script>
    </head>
    <body>
        <?php include_once('templates/header.php'); ?>

        <?php include_once('templates/alerts-block.php'); ?>

        <div class="container">
            <div class="row">
                <?php include_once('templates/sidebar.php'); ?>
                <?php include_once('templates/main.php'); ?>
            </div>
        </div>

        <?php include_once('templates/footer.php'); ?>
    </body>
</html>
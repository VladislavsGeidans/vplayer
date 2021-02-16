<?php
	const HOST_NAME = "localhost";
	const USER_NAME = "root";
	const USER_PASS = "";
	const DATABASE_NAME = "vplayer_db";

    /**
     * @param string $hostName
     * @param string $userName
     * @param string $userPassword
     * @param string $databaseName
     *
     * @return bool
     */
	function connectToDatabase(string $hostName, string $userName, string $userPassword, string $databaseName) 
	{
		$mysqli = new mysqli($hostName, $userName, $userPassword, $databaseName);

		if ($mysqli->connect_errno) {
			return false;
		}

		return true;
	}

	if (!$connection = connectToDatabase(HOST_NAME, USER_NAME, USER_PASS, DATABASE_NAME)) {
		include_once('templates/access_denied.php');
		exit;
	}
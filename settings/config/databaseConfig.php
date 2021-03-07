<?php
	const HOST_NAME = "mysql.odvinsk.ru:81";
	const USER_NAME = "vlad";
	const USER_PASS = "vlad2021";
	const DATABASE_NAME = "vlad";

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
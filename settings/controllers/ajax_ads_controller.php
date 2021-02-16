<?php

	include_once('../config/databaseConfig.php');
	include_once('../func/functions.php');
	global $mysqli;

	if ($action = getUrlParams('a', 'string')) {

		switch ($action) {
			case 'n':
				if ($postData = $_POST['formData']) {
					$insertSql = "INSERT INTO ads SET
								name = " . $postData['name'] . ",
								code = " . $postData['code'] . ",
								url = " . $postData['url'] . ",
								comments = " . $postData['comments'] . ",
								type = " . $postData['type'] . ",
								offset = " . (int) $postData['offset'] . ",
								maxAds = " . (int) $postData['maxAds'] . ",
								created_at = " . time() . ",
								updated_at = " . time() . ",
								status = '0'";
					$insertResult = $mysqli->query($insertSql);

					if ($insertResult) {
						return true;
					} else {
						return false;
					}
				}

				return false;
				break;
			default:
				# code...
				break;
		}
	}

	return false;
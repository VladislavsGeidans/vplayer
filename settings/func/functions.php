<?php

/**
 * @param string $paramName
 * @param string $type
*/
function getUrlParams(string $paramName, string $type) 
{
	if (!isset($_GET[$paramName])) {
		return false;
	}

	switch ($type) {
		case 'string':
			return (string) ($_GET[$paramName]);
			break;
		case 'int':
			return (int) $_GET[$paramName];		
			break;
		case 'bool':
			return $_GET[$paramName];
			break;
		default:
			return false;
			break;
	}
}

function getPageData(string $pageCode) {
	echo $pageCode;
}

function getAccessDenied() {
	include_once('templates/access_denied.php');
}

function isActivePage($pageName) {
	if ($page = getUrlParams('page', 'string')) {
		if ($page == $pageName) {
			return 'active';
		}

		return '';
	}

	return '';
}

function getCurrentPage() {
	global $globalPages;
	
	foreach($globalPages as $page) {
		$urlPage = getUrlParams('page', 'string');

		if ($urlPage === $page->getPageCode()) {
			return $page;
		}
	}

	return false;
}
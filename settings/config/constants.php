<?php
	include_once('class/Page.php');

	$homePage = new Page('Home', 'home', 'pages/home.php');
	$adsPage = new Page('Ads', 'ads', 'pages/ads.php');
	$settingsPage = new Page('Settings', 'settings', 'pages/settings.php');

	$globalPages = [
		$homePage,
		$adsPage,
		$settingsPage
	];

	$globalPageNames = [
		$homePage->getPageName(),
		$adsPage->getPageName(),
		$settingsPage->getPageName()
	];

	$globalPageCodes = [
		$homePage->getPageCode(),
		$adsPage->getPageCode(),
		$settingsPage->getPageCode()
	];
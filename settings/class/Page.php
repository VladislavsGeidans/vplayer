<?php

	class Page 
	{
		public string $pageName;
		public string $pageCode;
		public string $pageUrl;
		public string $pageTitle;

		public function __construct(string $pageName, string $pageCode, string $pageUrl) {
			$this->pageName = $pageName;
			$this->pageCode = $pageCode;
			$this->pageUrl = $pageUrl;
		}

		public function setPageName(string $pageName)
		{
			$this->pageName = $pageName;
		}

		public function getPageName() 
		{
			return $this->pageName;
		}

		public function setPageCode(string $pageCode)
		{
			$this->pageCode = $pageCode;
		}

		public function getPageCode() 
		{
			return $this->pageCode;
		}

		public function setPageUrl(string $pageUrl)
		{
			$this->pageUrl = $pageUrl;
		}

		public function getPageUrl() 
		{
			return $this->pageUrl;
		}

		public function getPageTitle(): ?string {
			return $this->pageTitle;
		}

		public function setPageTitle(?string $pageTitle) {
			$this->pageTitle = $pageTitle;
		} 
	}
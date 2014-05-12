<?php
	/**
	 * Server Side Analytics
	 *
	 * Server Side Analytics is free software; you can redistribute it and/or 
	 * modify it under the terms of the GNU General Public License as published by
	 * the Free Software Foundation; either version 3 of the License, or
	 * any later version.
	 *
	 * The GNU General Public License can be found at
	 * http://www.gnu.org/copyleft/gpl.html.
	 *
	 * @copyright  Copyright (c) 2009 elements.at New Media Solutions GmbH (http://www.elements.at)
	 * @license    http://www.gnu.org/copyleft/gpl.html  GPL
	 */

	class Elements_Tools_Serversideanalytics
    {
        private $defaultAnalyticsType = "event";
        
        private static $trackingCodeUrl = "http://www.google-analytics.com/ga.js"; 
        private static $trackingDomain = "riob.us"; // Your host
        private $beaconURL = "http://www.google-analytics.com/__utm.gif"; // Beacon
        private $utmwv = "4.3"; // Analytics version
        private $utmn; // Random number 
        private $utmhn; // Host name (www.elements.at)
        private $utmcs; // Charset
        private $utmul; // Language
        private $utmdt; // Page title
        private $utmhid; // Random number (unique for all session requests)
        private $utmp; // Pageview
        private $utmac; // Google Analytics account
        private $utmt; // Analytics type (event)
        private $utmcc; //Cookie related variables
        
        private $eventCategory; // Event category
        private $eventAction; // Event action
        private $eventLabel; // Event label
        private $eventValue; // Event value
        
        private $eventString; // Internal structure of the complete event string
        
        private $httpClient;

        public function __construct()
        {
            $this->setUtmhid();
            $this->setCharset(); 
            $this->setCookieVariables();     
        }
          
        public function getHttpClient () {
        	if(!$this->httpClient instanceof Zend_Http_Client) {
	        	include_once("/usr/share/zendframework/library/Zend/Http/Client.php");
	            $this->httpClient = new Zend_Http_Client();
	            $this->httpClient->setConfig(array(
	                'maxredirects' => 1,
	                'timeout'      => 4
	            ));
	            $this->httpClient->setHeaders('Referer', "http://" . self::$trackingDomain . "/");
	            $this->httpClient->setHeaders("User-Agent", "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.7) Gecko/2009021910 Firefox/3.0.7 (.NET CLR 3.5.30729)");
	            $this->httpClient->setCookieJar();
        	}
        	return $this->httpClient;
        }
        
        private function setCookieVariables()
        {
            $cookie=rand(10000000,99999999) . "00145214523";
            $random=rand(1000000000,2147483647);
            $today=time();
            $this->utmcc='__utma=1.'.$cookie.'.'.$random.'.'.$today.'.'.$today.'.15;+__utmz=1.' . $today . '.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);';
        }
        
        private function getCookieVariables()
        {
            return $this->utmcc;
        }
        
        public function setEvent($category, $action, $label="", $value="")
        {
            $this->eventCategory = (string) $category;
            $this->eventAction = (string) $action;
            if ($label) $this->eventLabel = (string) $label;
            if ($value) $this->eventValue = (int) intval($value);
            
            $eventString = "5(" . $this->eventCategory . "*" . $this->eventAction;
            
            if ($label)
                $eventString .= "*" . $this->eventLabel . ")";
            else
                $eventString .= ")";
                
            if ($this->eventValue)
                $eventString .= "(" . $this->eventValue . ")";                 
            
            $this->eventString = $eventString;
        }
        
        private function getEventString()
        {
            return $this->eventString;
        }
        
        private function setAnalyticsType($type="")
        {
            if ($type)
                $this->utmt = $type;
            else
                $this->utmt = $this->defaultAnalyticsType;
        }
        
        private function getAnalyticsType()
        {
            return $this->utmt;
        }
        
        public function setAccountId($accountId)
        {
            $this->utmac = $accountId;
        }
        
        private function getAccountId()
        {
            return $this->utmac;
        }
            
        public function setPageView($pageView="")
        {
            $this->utmp = $pageView;
        }

        private function getPageView()
        {
            return $this->utmp;
        }    
        
        public function setVersion($version="")
        {
            if ($version)
                $this->utmwv = $version;    
        }
        
        private function getVersion()
        {
            return $this->utmwv;
        }
        
        private function getGetUniqueId()
        {
            return $this->utmhid;
        }
        
        private function setUtmhid()
        {           
            $this->utmhid = mt_rand(100000000,999999999);
        }
        
        private function getRandomNumber()
        {
            return mt_rand(100000000,999999999);
        }
        
        public function setCharset($charset="")
        {
            if ($charset)
                $this->utmcs = $charset;
            else
                $this->utmcs = "UTF-8";        
        }
        
        private function getCharset()
        {
            return $this->utmcs;
        }
        
        public function setLanguage($language="")
        {
            if ($language)
                $this->utmul = $language;
            else
                $this->utmul = "en-us";           
        }
        
        public function setPageTitle($pageTitle="")
        {
            $this->utmdt = $pageTitle;
        }

        private function getPageTitle()
        {
            return $this->utmdt;
        }
        
        private function getLanguage()
        {
            return $this->utmul;    
        }
        
        public function setHostName($hostName="")
        {
            $this->utmhn = $hostName;
        }
        
        private function getHostName()
        {
            return $this->utmhn;
        }    
        
        public function createPageView()
        {            
            $parameters = array(
			    'utmwv' => $this->getVersion(),
			    'utmn' => $this->getRandomNumber(),
			    'utmhn' => $this->getHostName(),
            	'utmcs' => $this->getCharset(),
            	"utmul" => $this->getLanguage(),
            	"utmdt" => $this->getPageTitle(),
            	"utmhid" => $this->getGetUniqueId(),
            	"utmp" => $this->getPageView(),
            	"utmac" => $this->getAccountId(),
            	"utmcc" => $this->getCookieVariables()
			);
            return $this->requestHttp($this->beaconURL, $parameters);
        }
        
        public function createEvent()
        {
            $this->setAnalyticsType();
            $parameters = array(
                'utmwv' => $this->getVersion(),
                'utmn' => $this->getRandomNumber(),
                'utmhn' => $this->getHostName(),
                'utmt' => 'event',
                'utme' => $this->getEventString(),                
                'utmcs' => $this->getCharset(),
                "utmul" => $this->getLanguage(),
                //"utmdt" => $this->getPageTitle(),
                "utmhid" => $this->getGetUniqueId(),
                //"utmp" => $this->getPageView(),
                "utmac" => $this->getAccountId(),
                "utmcc" => $this->getCookieVariables()
            );            
            return $this->requestHttp($this->beaconURL, $parameters);     
        } 
        
        private function requestHttp($url, $getParams = array())
        {
        	$client = $this->getHttpClient();
            $client->setUri($url);
            $client->setParameterGet($getParams);
            $response = $client->request();
            
            if ($response->isSuccessful())
                return true;
            else
                return false;
        }
    }            
?>

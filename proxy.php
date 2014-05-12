<?
require_once('./ssga.class.php');

if (isset($_GET["linha"])) {

	$url = 'http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterPosicoesDaLinha/' . $_GET['linha'];
	header('Content-Type: application/json');
	header('Access-Control-Allow-Origin: *');
	$ch=curl_init();
	curl_setopt($ch,CURLOPT_URL,$url);
	curl_setopt($ch,CURLOPT_BINARYTRANSFER,1);
	curl_exec($ch);
	curl_close($ch);

	try {

		$ga = new Elements_Tools_Serversideanalytics();

		$ga->setAccountId("UA-49628280-3");

		//Set your charset
		$ga->setCharset("UTF-8");

		//Set your hostname
		$ga->setHostName("riob.us");

		//Set page title
		$ga->setPageTitle("Test");

		//Set language
		$ga->setLanguage("en");

		//Set a pageview
		$ga->setPageView("/en/serverside/test");

		//Set an event (based on http://code.google.com/apis/analytics/docs/tracking/eventTrackerGuide.html) 
		if (isset($_GET["s"]) && $_GET['s'] == "1") {
			$ga->setEvent("REST Hit", "REST", "Site", "1");
		} else if (isset($_GET["s"]) && $_GET['s'] == "2") {
			$ga->setEvent("REST Hit", "REST", "Mobile", "2");
		} else {
			$ga->setEvent("REST Hit", "REST", "Legado", "3");
		}	

		//Submit an event
		$ga->createEvent();
		
		$ga->setEvent("REST Hit", "Linha", $_GET["linha"], $_GET["linha"]);
		$ga->createEvent();
		
	} catch (Exception $e) {

	}
}

?>

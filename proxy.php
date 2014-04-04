<?

$url = 'http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterPosicoesDaLinha/' . $_GET['linha'];
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
$ch=curl_init();
curl_setopt($ch,CURLOPT_URL,$url);
curl_setopt($ch,CURLOPT_BINARYTRANSFER,1);
curl_exec($ch);
curl_close($ch);
?>
riobus-web
==========

Rio de Janeiro bus geolocalization web app


http://riob.us

Os dados são oferecidos publicamente pela prefeitura do Rio de Janeiro, em parceria com a FETRANSPOR e Iplanrio. As posições dos ônibus são recuperadas pelo GPS embarcado neles, enviados para a FETRANSPOR e, por fim, a Iplanrio as disponibiliza no Data.Rio, o projeto de dados abertos do município.

Para rodá-lo, 
	1) instale node.js
	2) clone ou baixe o zip do projeto.
		2.1) se baixou em zip, descopacte-o.
	3) abra o terminal e entre no diretório 'riob-us'
		$ cd riobus-web/riob-us
	4) chame o node passando o 'dataGraber.js' como argumento
		$ node dataGraber.js

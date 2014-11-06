riobus-web data grabber
==========

Rio de Janeiro bus geolocalization web app


http://riob.us

Os dados são oferecidos publicamente pela prefeitura do Rio de Janeiro, em parceria com a FETRANSPOR e Iplanrio. As posições dos ônibus são recuperadas pelo GPS embarcado neles, enviados para a FETRANSPOR e, por fim, a Iplanrio as disponibiliza no Data.Rio, o projeto de dados abertos do município.

Para rodá-lo, 
<ol>

	<li>instale node.js</li>

	<li>clone o projeto ou baixe o zip dele.
		<ol>
			<li>se baixou em zip, descopacte-o.</li>
			<li>se preferir clonar: <br>
			<code>git clone https://github.com/marco-jardim/riobus-web</code></li>
		</ol>
	</li>

	<li>abra o terminal e entre no diretório 'riob-us'.<br>
	<code>cd riobus-web/riob-us</code> </li>
		
	<li>installe as dependencias usando o npm. <br>
	<code>npm install</code></li>

	<li>chame o node passando o 'server.js' como argumento. <br>
	<code>node server.js</code></li>
		
</ol>
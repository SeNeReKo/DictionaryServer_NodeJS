== Kurzbeschreibung ==

Das NodeJS-Modul "jk-apiservercore" stellt ein Framework bereit für die schnelle Implementierung von einfachen API-basierten Webservern. Das Framework ist so konzipiert, dass einzelne Funktionseinheiten in den Server eingehängt werden können, die dann über eine HTTP-Schnittstelle zugänglich gemacht werden.

== Implementierung eingener Komponenten ==

Eigene Komponenten werden in Form eines Objektes implementiert und dann bei der Initialisierung übergeben. Hierzu ein Beispiel:

 "argtest" : {
 	argumentDescription : {
 			"a" : {		"type" : "str",			"required" : true		},
 			"b" : {		"type" : "int",			"required" : true		},
 			"c" : {		"type" : "json",		"required" : true		}
 	},
 	exec : function(functionalServerCore, argsArray, argsObject, userObj, callback) {
 		callback(null, {
 			"a" : argsArray[0],
 			"b" : argsArray[1],
 			"c" : argsArray[2]
 		});
	}
 }

Unter "argumentDescription" ist ein Objekt zu implementieren, welches zu jedem Argument der API-Funktion - hier "a", "b" und "c" - ein beschreibendes Objekt besitzt. In diesem beschreibenden Objekt müssen die folgenden Felder implementiert werden:

* <icode>type</icode>: Hierfür ist der Datentyp als Zeichenkette anzugeben. Gültige Bezeichner hierfür sind: <icode>str</icode>, <icode>int</icode>, <icode>float</icode>, <icode>bool</icode> und <icode>json</icode>.
* <icode>required</icode>: Hierfür ist entweder <icode>true</icode> oder <icode>false</icode> anzugeben, je nach dem, ob dieses Argument optional ist oder benötigt wird.

Unter "exec" ist eine Funktion zu spezifizieren, welche die Funktionalität erbringt. Vier Parameter werden erwartet:

* <icode>functionalServerCore</icode>: Dies ist ein Hilfsobjekt. Mehr dazu siehe unten.
* <icode>argsArray</icode>: Die Argumente für die API-Funktion in der Reihenfolge, wie sie in der <icode>argumentDescription</icode> vorgegeben wurden
* <icode>argsObject</icode>: Die Argumente für die API-Funktion als Objekt; unter den entsprechenden Properties befindet sich der jeweilige Wert
* <icode>userObj</icode>: Ein Objekt, welches den aktuellen User repräsentiert; ist keine Authentifizierung notwendig, wird hier ein Dummy-Objekt übergeben. (Die Daten in diesem Objekt dürfen nicht verändert werden!)
* <icode>callback</icode>: Eine Callback-Mehode, welche sich um das Senden der Daten an den Client kümmert. Mehr dazu siehe unten.

== Zweischichtige Architektur - functionalServerCore ==

<icode>functionalServerCore</icode> ist dazu gedacht, dass es die eigentliche über das API zugängliche Funktionalität erbringt. In <icode>exec()</icode> sollte der Aufruf von einer oder mehreren Funktionen dieses Hilfsobjektes erfolgen. Das Objekt in <icode>functionalServerCore</icode> stellt eine funktionale Softwareschicht dar, <icode>exec()</icode> eine Präsentationsschicht und sorgt für eine API-konforme Strukturierung der Rückgabedaten, die dann mittels <icode>callback</icode> zurück an den Aufrufer gegeben werden. Der Aufrufer ist das Framework: Dieses kümmert sich dann um eine API-Konforme Darstellung der Daten gemäß des Wunsches eines diese API-Funktion aufrufenden Clients.

== Rückgabe der Daten an den Aufrufer - callback() ==

TODO



# Regenboogrit

Een mobiele Three.js-game: een eenhoorn rent over een regenboog langs wolkenkastelen. Rekenen geeft een veilige boost.

## Starten

Node.js is voldoende; alle gamecode en Three.js staan lokaal in dist.

    node server.mjs

Open http://localhost:4173. Op hetzelfde wifi-netwerk kan ook het LAN-adres van deze computer met poort 4173 worden gebruikt, mits de firewall dit toestaat. De privéversie wordt via Sites gepubliceerd.

## Spelen

Veeg links/rechts om van baan te wisselen, omhoog om te springen en omlaag om te bukken. Er zijn ook grote aanraakknoppen. Op een computer werken pijltjestoetsen, WASD en spatie. Escape pauzeert. Onder elfjesbogen liggen vijf lage sterren die je alleen bukkend verzamelt, ook bovenop verhoogde routes. Minstens iedere derde gewone obstakelrij bevat een boog; er blijft altijd een vrije uitwijkbaan.

Je kiest eerst een groep (3–8). Alle passende soorten sommen staan standaard aan en kunnen los worden uitgevinkt. De standaard is begin groep 5: plus en min onder 100, kleine tafels met beide factoren 1–5 en bijpassende deelsommen. Alleen de tafels hebben dus maximaal 25 als uitkomst. De standaard avonturenrit wordt al vroeg duidelijk sneller: circa 46% boven de startsnelheid na 30 actieve seconden, 77% na één minuut en ruim tweemaal zo snel na twee minuten. Daarna loopt de snelheid verder op tot het maximum bij tien minuten. Obstakels volgen elkaar ook eerder sneller op; de rustige stand blijft rustig. Onder het ingeklapte menu Geavanceerde instellingen staan de rekentimer en de optionele rustige rit. De rekentimer heeft vier standen: Oefenen (onbeperkt), Rustig (60 seconden), Vlot (30 seconden, standaard) en Uitdaging (15 seconden). Bij de overgang naar de groepskeuze wordt eenmalig de passende oefenmix aangezet. Bestaande eigen keuzes voor racestand en timer blijven bewaard. Vanaf deze versie worden ook uitgevinkte onderdelen en eigen getallenbereiken bewaard. De timer geldt per som, ook voor reddingsvragen, en pauzeert als de pagina niet zichtbaar is. Bij een gewone som toont een verlopen timer het juiste antwoord en gaat de rit zonder boost verder; bij een reddingssom eindigt de rit. Een ingediend goed antwoord stopt de timer direct, ook tijdens de beloningsanimatie. De speler kiest zelf wanneer moeilijkere stof aan bod komt.

Onder Sommen en tafels aanpassen kies je de bovengrens voor plus/min: 10, 20, 50, 100, 1.000, 10.000 of een eigen heel getal van 2–10.000. Beide getallen en de uitkomst blijven strikt onder die grens en zijn nooit negatief. Tafels 1–10 zijn afzonderlijk te selecteren, met factoren tot 3, 5 of 10. Delen gebruikt dezelfde selectie omgekeerd. Zonder geselecteerde somsoort, of zonder tafel terwijl Tafels/Delen aanstaat, kun je niet starten. Herstel standaard zet de groepskeuze terug inclusief bereik en tafels; timer en racesnelheid veranderen daarbij niet.

Standaard per groep: groep 3 plus/min onder 20; groep 4 plus/min onder 100 en tafels 1, 2, 5, 10 tot factor 5; groep 5 de hierboven beschreven instapmix; groep 6 alle tafels, plus/min onder 1.000, delen en eenvoudige breuken; groep 7 dezelfde basis met kommagetallen en procenten; groep 8 ook plus/min onder 10.000 en uitgebreidere breuken en procenten. Groepen zijn instelbare oefenprofielen, geen beoordeling van het volledige schoolniveau. Het eigen getallenbereik geldt voor de gewone plus/minsommen; kommagetallen, breuken en procenten volgen het gekozen groepsprofiel.

Regenbooghellingen leiden naar verhoogde wolkenroutes en drakenruggen. De eerste route heeft een helling omhoog en omlaag; latere routes hebben echte gaten waarover je kunt springen, en obstakels op het dak. De volgende route heeft een opvanghelling, zodat een gemiste sprong ook naar een veilige lagere landing kan leiden. De overgangen tussen helling en dak zijn afgerond. Je kunt ook een vrije baan op de gewone regenboog volgen. Als je van een verhoogde route afstapt, val je terug naar beneden. Gewone draken zonder regenboogpad zijn obstakels.

Een eerste zelfstandig goed antwoord bij een rekenpoort geeft 4 seconden veilige boost met maximaal driemaal de snelheid en 5 sterren. Tijdens de boost stijgt de eenhoorn tot zes wereldeenheden en vliegt zichtbaar over rijen draken, wolken en elfjesbogen. De camera volgt mee omhoog. Na hulp, of na één fout antwoord gevolgd door een goed antwoord, wordt de boost 2,5 seconden met 2 sterren. Na twee fout ingediende antwoorden toont het spel de juiste uitkomst en blijft de rekensom staan totdat je op Verder over de regenboog drukt. Je gaat dan op de grond verder zonder boost of rekenbeloning. Iedere nieuwe som begint opnieuw met twee pogingen. De bestaande rekentimer blijft tijdens de herkansing doorlopen en stopt zodra de uitkomst wordt getoond. Beide boosts krijgen aansluitend een aparte daling van 1,6 seconde: hoogte en snelheid gaan geleidelijk terug, de vleugels vouwen in en de benen gaan weer lopen. Alle boostobstakels zijn vóór de daling gepasseerd en daarna is er drie seconden vrije baan met bescherming. De natuurkundige simulatie gebruikt kleine tijdstappen, ook bij een lagere beeldsnelheid. Een naderende rekenpoort zet een sprong niet meer plotseling terug op de grond. Lastige sommen komen na tussenliggende vragen terug. Na een crash kan één goede som maximaal drie keer per rit een redding opleveren. Een nieuwe botsing binnen vijf actieve seconden na redding beëindigt de rit. Een verkeerde reddingssom beëindigt de rit ook. Aftellen, rekenen en pauzeren tellen niet mee voor actieve racetijd.

Op het eindscherm staat een groot blok Jouw highscore, naast de afstand van de zojuist gespeelde rit. Een lagere nieuwe score overschrijft het record niet. Highscores worden per groep, geselecteerde somsoorten, actieve getallengrenzen, racestand en rekentimer bewaard. Oude scores blijven in de opslag behouden; nieuwe oefencombinaties hebben hun eigen record. Herhalingsvragen gebruiken dezelfde profielgrens: een oude lastige som uit een uitgeschakeld onderdeel komt niet tussendoor terug. Sterren, kleuren, instellingen en rekenvoortgang staan alleen in de lokale browseropslag. Verschillende apparaten delen deze gegevens niet automatisch.

## Bestanden

- dist/app.mjs: menu, invoer, rekenvensters en bewaren
- dist/engine.mjs: tijd, beweging, botsingen, boosts en reddingen
- dist/course.mjs: hoogtes, hellingen, verhoogde routes en vluchtpad
- dist/rules.mjs: instellingen, migratie, profielherkenning en moeilijkheid
- dist/practice.mjs: groepsprofielen, onderdeelkeuze en opgavengenerator
- dist/timer.mjs: pauzeerbare rekentimer
- dist/world.mjs: procedurele 3D-modellen en camera
- dist/audio.mjs: zachte geluiden via Web Audio
- dist/vendor: Three.js r180 en MIT-licentie

De 3D-modellen zijn lokaal gegenereerd uit geometrie. Fonts hebben systeemlettertypen als fallback.

## Controleren

    node --test

De controles omvatten rekenbereiken, cijferinvoer, botsingen, boosts, alle reddingsgrenzen, een twaalfminutenrit, hellingen, springen tussen daken, hoogtebotsingen, zichtbare boostpassages, obstakelvrije landingen op 20/30/60/120 beelden per seconde, vroege snelheidsopbouw, buksterren, één herkansing en de camerakadrering op smalle telefoonschermen. De UI-logica wordt ook getest met een nagebootste DOM: twee fouten gevolgd door verder lopen, de kleinere boost bij een goede herkansing en blijvende highscores na herladen. De groepskeuze, alle combinaties van onderdelen, aangepaste grenzen, uitgesloten tafels, lege keuzes en instellingen na herladen zijn getest. Het nieuwe menu is daarnaast in de browser op telefoonformaat (390 × 844) gecontroleerd, inclusief instellingen aan/uit en bewaren na herladen. Aanraakbediening op een fysiek toestel blijft een handmatige controle.

# Regenboogrit

Een mobiele Three.js-game: een eenhoorn rent over een regenboog langs wolkenkastelen. Rekenen geeft een veilige boost.

## Starten

Node.js is voldoende; alle gamecode en Three.js staan lokaal in dist.

    node server.mjs

Open http://localhost:4173. Op hetzelfde wifi-netwerk kan ook het LAN-adres van deze computer met poort 4173 worden gebruikt, mits de firewall dit toestaat. De privéversie wordt via Sites gepubliceerd.

## Spelen

Veeg links/rechts om van baan te wisselen, omhoog om te springen en omlaag om te bukken. Er zijn ook grote aanraakknoppen. Op een computer werken pijltjestoetsen, WASD en spatie. Escape pauzeert. Onder elfjesbogen liggen vijf lage sterren die je alleen bukkend verzamelt, ook bovenop verhoogde routes. Minstens iedere derde gewone obstakelrij bevat een boog; er blijft altijd een vrije uitwijkbaan.

De standaard Kleine tafels gebruikt uitsluitend getallen 1 t/m 5 aan beide kanten van het keerteken, met maximaal 25 als antwoord. De standaard avonturenrit wordt al vroeg duidelijk sneller: circa 46% boven de startsnelheid na 30 actieve seconden, 77% na één minuut en ruim tweemaal zo snel na twee minuten. Daarna loopt de snelheid verder op tot het maximum bij tien minuten. Obstakels volgen elkaar ook eerder sneller op; de rustige stand blijft rustig. Onder het ingeklapte menu Geavanceerde instellingen staan de rekentimer en de optionele rustige rit. De rekentimer heeft vier standen: Oefenen (onbeperkt), Rustig (60 seconden), Vlot (30 seconden, standaard) en Uitdaging (15 seconden). Bestaande spelinstellingen gaan bij deze update eenmalig naar de avonturenrit en 30 seconden; het rekenprofiel en de voortgang blijven bewaard. Latere eigen keuzes blijven opgeslagen. De timer geldt per som, ook voor reddingsvragen, en pauzeert als de pagina niet zichtbaar is. Bij een gewone som toont een verlopen timer het juiste antwoord en gaat de rit zonder boost verder; bij een reddingssom eindigt de rit. Een ingediend goed antwoord stopt de timer direct, ook tijdens de beloningsanimatie. De speler kiest zelf wanneer moeilijkere stof aan bod komt.

Extra standen: individuele of gemengde tafels 1–10 met factoren 1–5 of 1–10; plus/min strikt onder 20, 50 of 100; groepenmix 3–8. Groep 5 is bewust een instapmix met kleine tafels. Groepen zijn instelbare oefenprofielen, geen beoordeling van het volledige schoolniveau.

Regenbooghellingen leiden naar verhoogde wolkenroutes en drakenruggen. De eerste route heeft een helling omhoog en omlaag; latere routes hebben echte gaten waarover je kunt springen, en obstakels op het dak. De volgende route heeft een opvanghelling, zodat een gemiste sprong ook naar een veilige lagere landing kan leiden. De overgangen tussen helling en dak zijn afgerond. Je kunt ook een vrije baan op de gewone regenboog volgen. Als je van een verhoogde route afstapt, val je terug naar beneden. Gewone draken zonder regenboogpad zijn obstakels.

Een eerste zelfstandig goed antwoord bij een rekenpoort geeft 4 seconden veilige boost met maximaal driemaal de snelheid en 5 sterren. Tijdens de boost stijgt de eenhoorn tot zes wereldeenheden en vliegt zichtbaar over rijen draken, wolken en elfjesbogen. De camera volgt mee omhoog. Na hulp, of na één fout antwoord gevolgd door een goed antwoord, wordt de boost 2,5 seconden met 2 sterren. Na twee fout ingediende antwoorden toont het spel de juiste uitkomst en blijft de rekensom staan totdat je op Verder over de regenboog drukt. Je gaat dan op de grond verder zonder boost of rekenbeloning. Iedere nieuwe som begint opnieuw met twee pogingen. De bestaande rekentimer blijft tijdens de herkansing doorlopen en stopt zodra de uitkomst wordt getoond. Beide boosts krijgen aansluitend een aparte daling van 1,6 seconde: hoogte en snelheid gaan geleidelijk terug, de vleugels vouwen in en de benen gaan weer lopen. Alle boostobstakels zijn vóór de daling gepasseerd en daarna is er drie seconden vrije baan met bescherming. De natuurkundige simulatie gebruikt kleine tijdstappen, ook bij een lagere beeldsnelheid. Een naderende rekenpoort zet een sprong niet meer plotseling terug op de grond. Lastige sommen komen na tussenliggende vragen terug. Na een crash kan één goede som maximaal drie keer per rit een redding opleveren. Een nieuwe botsing binnen vijf actieve seconden na redding beëindigt de rit. Een verkeerde reddingssom beëindigt de rit ook. Aftellen, rekenen en pauzeren tellen niet mee voor actieve racetijd.

Op het eindscherm staat een groot blok Jouw highscore, naast de afstand van de zojuist gespeelde rit. Een lagere nieuwe score overschrijft het record niet. Highscores worden per rekenprofiel, racestand en rekentimer bewaard; bestaande scores blijven onder Onbeperkt beschikbaar. De Plus & min-tab heeft directe plus-presets voor groep 3 (onder 20) en groep 4 (onder 100). Sterren, kleuren, instellingen en rekenvoortgang staan alleen in de lokale browseropslag. Verschillende apparaten delen deze gegevens niet automatisch.

## Bestanden

- dist/app.mjs: menu, invoer, rekenvensters en bewaren
- dist/engine.mjs: tijd, beweging, botsingen, boosts en reddingen
- dist/course.mjs: hoogtes, hellingen, verhoogde routes en vluchtpad
- dist/rules.mjs: rekenniveaus, opgavengenerator en moeilijkheid
- dist/timer.mjs: pauzeerbare rekentimer
- dist/world.mjs: procedurele 3D-modellen en camera
- dist/audio.mjs: zachte geluiden via Web Audio
- dist/vendor: Three.js r180 en MIT-licentie

De 3D-modellen zijn lokaal gegenereerd uit geometrie. Fonts hebben systeemlettertypen als fallback.

## Controleren

    node --test

De controles omvatten rekenbereiken, cijferinvoer, botsingen, boosts, alle reddingsgrenzen, een twaalfminutenrit, hellingen, springen tussen daken, hoogtebotsingen, zichtbare boostpassages, obstakelvrije landingen op 20/30/60/120 beelden per seconde, vroege snelheidsopbouw, buksterren, één herkansing en de camerakadrering op smalle telefoonschermen. De UI-logica wordt ook getest met een nagebootste DOM: twee fouten gevolgd door verder lopen, de kleinere boost bij een goede herkansing en blijvende highscores na herladen. Een visuele browsertest was bij oplevering niet beschikbaar in de uitvoeromgeving. Controleer de uitstraling en veegbediening daarom nog op het uiteindelijke toestel.

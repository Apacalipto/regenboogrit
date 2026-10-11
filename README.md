# Regenboogrit

Een mobiele Three.js-game: een eenhoorn rent over een regenboog langs wolkenkastelen. Rekenen geeft een veilige boost.

## Starten

Node.js is voldoende; alle gamecode en Three.js staan lokaal in dist.

    node server.mjs

Open http://localhost:4173. Op hetzelfde wifi-netwerk kan ook het LAN-adres van deze computer met poort 4173 worden gebruikt, mits de firewall dit toestaat. De privéversie wordt via Sites gepubliceerd.

## Spelen

Veeg links/rechts om van baan te wisselen, omhoog om te springen en omlaag om te bukken. Er zijn ook grote aanraakknoppen. Op een computer werken pijltjestoetsen, WASD en spatie. Escape pauzeert.

De standaard Kleine tafels gebruikt uitsluitend getallen 1 t/m 5 aan beide kanten van het keerteken, met maximaal 25 als antwoord. Rustig hobbelen staat standaard aan. Rekensommen hebben geen tijdslimiet. De speler kiest zelf wanneer moeilijkere stof aan bod komt.

Extra standen: individuele of gemengde tafels 1–10 met factoren 1–5 of 1–10; plus/min strikt onder 20, 50 of 100; groepenmix 3–8. Groep 5 is bewust een instapmix met kleine tafels. Groepen zijn instelbare oefenprofielen, geen beoordeling van het volledige schoolniveau.

Een eerste zelfstandig goed antwoord bij een rekenpoort geeft 4 seconden veilige boost op driemaal de snelheid en 5 sterren. Na hulp wordt dit 2,5 seconden en 2 sterren. Lastige sommen komen na tussenliggende vragen terug. Na een crash kan één goede som maximaal drie keer per rit een redding opleveren. Een nieuwe botsing binnen vijf actieve seconden na redding beëindigt de rit. Een verkeerde reddingssom beëindigt de rit ook. Aftellen, rekenen en pauzeren tellen niet mee voor actieve racetijd.

Highscores worden per rekenprofiel en racestand bewaard. Sterren, kleuren, instellingen en rekenvoortgang staan alleen in de lokale browseropslag. Verschillende apparaten delen deze gegevens niet automatisch.

## Bestanden

- dist/app.mjs: menu, invoer, rekenvensters en bewaren
- dist/engine.mjs: tijd, beweging, botsingen, boosts en reddingen
- dist/rules.mjs: rekenniveaus, opgavengenerator en moeilijkheid
- dist/world.mjs: procedurele 3D-modellen en camera
- dist/audio.mjs: zachte geluiden via Web Audio
- dist/vendor: Three.js r180 en MIT-licentie

De 3D-modellen zijn lokaal gegenereerd uit geometrie. Fonts hebben systeemlettertypen als fallback.

## Controleren

    node --test tests/rules.test.mjs tests/engine.test.mjs tests/integration.test.mjs

De controles omvatten rekenbereiken, cijferinvoer, botsingen, boosts, alle reddingsgrenzen, een twaalfminutenrit en de camerakadrering op smalle telefoonschermen. Een visuele browsertest was bij oplevering niet beschikbaar in de uitvoeromgeving. Controleer de uitstraling en veegbediening daarom nog op het uiteindelijke toestel.

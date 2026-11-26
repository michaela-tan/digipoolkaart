# De Digipoolkaart beheren

Met deze handleiding pas je zelf de teksten van de Digipoolkaart aan: de gegevens van de pools, de plaatsen op de kaart, de filterlabels en de teksten op de pagina. Je hebt er geen technische kennis voor nodig.

De beheerpagina staat op **https://michaela-tan.github.io/digipoolkaart/admin/**

## Eenmalig: toegang regelen

Dit doe je één keer. Reken op een kwartier.

### 1. Maak een GitHub-account

De kaart staat op GitHub, en daar worden je wijzigingen bewaard.

1. Ga naar https://github.com/signup.
2. Vul je e-mailadres in, kies een wachtwoord en een gebruikersnaam.
3. Bevestig je e-mailadres met de code die je krijgt.

### 2. Vraag toegang tot de kaart

1. Stuur je GitHub-gebruikersnaam naar de beheerder van de Digipoolkaart.
2. Je krijgt een e-mail van GitHub met de uitnodiging "invited you to collaborate on michaela-tan/digipoolkaart".
3. Klik in die e-mail op **View invitation** en daarna op **Accept invitation**.

### 3. Maak een sleutelcode

De beheerpagina gebruikt een sleutelcode (op GitHub heet dat een *token*) in plaats van je wachtwoord.

1. Ga naar https://github.com/settings/tokens/new?scopes=repo&description=Digipoolkaart%20beheer. Log in als GitHub daarom vraagt.
2. Bij **Note** staat al "Digipoolkaart beheer". Laat dat zo.
3. Kies bij **Expiration** hoe lang de code geldig is, bijvoorbeeld 1 jaar. Daarna maak je een nieuwe.
4. Bij **Select scopes** staat het vinkje bij **repo** al aan. Laat de rest uit.
5. Klik onderaan op **Generate token**.
6. Je ziet nu een lange code die begint met `ghp_`. Kopieer hem met het knopje ernaast. GitHub toont hem maar één keer.

Behandel de sleutelcode als een wachtwoord: deel hem met niemand en zet hem niet in een e-mail of chat.

### 4. Log in op de beheerpagina

1. Ga naar https://michaela-tan.github.io/digipoolkaart/admin/.
2. Klik op **Inloggen met een toegangstoken**.
3. Plak de sleutelcode en klik op **Inloggen**.

Je browser onthoudt dat je bent ingelogd. De volgende keer ga je direct naar de beheerpagina.

Werk je op een gedeelde computer? Log dan na afloop uit: klik rechtsboven op het rondje met je profiel en kies **Uitloggen**.

## Iets aanpassen

Links in de beheerpagina staan vier onderdelen.

| Onderdeel | Wat pas je hier aan |
|---|---|
| **Pools** | De gegevens van elke pool: naam, omschrijving, contact, plaatsen en filterlabels |
| **Paginateksten** | De titel en subtitel in de blauwe kop, de kopjes boven het zoekveld en de filters |
| **Filterlabels** | De labels onder "Voor welke organisaties?" en "Vakgebied" |
| **Plaatsen** | De plaatsen waar een pool op de kaart kan staan |

### Een pool aanpassen

1. Klik op **Pools** en daarna op de pool.
2. Pas de velden aan. Onder elk veld staat waar de tekst op de kaart terechtkomt.
3. Klik rechtsboven op **Opslaan**.

Een veld dat je leeg laat, verschijnt niet op de kaart.

### Een pool toevoegen

1. Klik op **Pools** en daarna op **Nieuw**.
2. Vul minstens de naam in. Kies bij **Plaatsen op de kaart** waar de pool zit.
3. Klik op **Opslaan**.

Staat de plaats nog niet in de lijst? Voeg hem dan eerst toe onder **Plaatsen** (zie hieronder).

### Een pool verwijderen

Open de pool, klik rechtsboven op de drie puntjes (⋮) en kies **Verwijderen**.

### Een plaats toevoegen

1. Klik op **Plaatsen**.
2. Klik onderaan op **plaats toevoegen**.
3. Vul de naam in.
4. Typ de plaats in het zoekveld boven het kaartje en kies hem uit de lijst, of klik op de plek op het kaartje.
5. Klik op **Opslaan**.

Twee plaatsen op precies hetzelfde punt delen één speld op de kaart.

### Een filterlabel toevoegen of hernoemen

1. Klik op **Filterlabels**.
2. Pas een naam aan, of klik op **label toevoegen** voor een nieuw label.
3. Klik op **Opslaan**.

Een nieuwe naam geldt meteen voor alle pools met dat label. Je hoeft de pools zelf niet aan te passen. De volgorde in de lijst is de volgorde op de pagina; versleep een label aan de streepjes (≡) om het te verplaatsen.

Het veld **Vaste sleutel** vult zich vanzelf in. Daarmee onthoudt de kaart welke pools bij welk label horen.

## Na het opslaan

- Je wijziging staat **binnen een paar minuten** op de kaart. Zie je hem nog niet? Wacht even en vernieuw de pagina.
- Opslaan is meteen publiceren. Er zit geen controlestap tussen, dus lees je tekst na voordat je opslaat.
- Ging er iets mis? Elke wijziging wordt bewaard. De beheerder kan een eerdere versie terugzetten.

## Let op

- **Contactpersonen staan openbaar op internet.** Zet iemands naam, e-mailadres of telefoonnummer er alleen op met diens toestemming.
- **Werk je met meer mensen tegelijk aan de pools?** Alle pools staan in één bestand. Slaat een collega iets op terwijl jij bezig bent, dan kan de beheerpagina vragen om de pool opnieuw te openen. Kopieer in dat geval eerst je tekst, open de pool opnieuw en plak hem terug.

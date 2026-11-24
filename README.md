# far3d

3D-modeller af FAR's rum til farcph.dk: Palmehuset, plateauet, restauranten (samtalebordet og langsiden) og hele huset (En dag hos FAR). Kunden vælger rum og opstilling, trykker **Forespørg på denne opstilling**, og valget udfylder forespørgselsformularen på siden.

Filerne i `dist/` hentes af hjemmesiden via jsDelivr. Der ligger intet hemmeligt i repoet; koden kan alligevel ses på hjemmesiden.

## Sådan bruges det i Webflow

1. Et sted på siden: en Code Embed med den tomme boks, fx på Lej stedet:

   ```html
   <div class="far3d-multi" data-venues="palmehus:langbord,reception,tom;plateau:oplaeg6,workshop,tom;restaurant:begge,samtalebordet,langsiden;huset" data-form="#forespoergsel"></div>
   ```

   Ét rum alene: `<div class="far3d" data-venue="palmehus" data-layouts="langbord,reception,tom" data-form="#forespoergsel"></div>`

2. Under sidens Custom code → Before `</body>` tag. Adressen peger på en bestemt commit (`@<commit>`), så siden aldrig ændrer sig uden, at vi skifter adressen:

   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FARcph/far3d@COMMIT/dist/far3d.css">
   <script type="module" src="https://cdn.jsdelivr.net/gh/FARcph/far3d@COMMIT/dist/far3d-alle.js"></script>
   ```

   Til ét rum kan den mindre fil bruges: `far3d-palmehus.js`, `far3d-plateau.js`, `far3d-restaurant.js` eller `far3d-huset.js`.

## Rum og opstillinger

| Rum (data-venue) | Opstillinger |
|---|---|
| palmehus | langbord (72), reception (100), tom |
| plateau | oplaeg6 (57), oplaeg5 (57), workshop (24), tom |
| restaurant | begge (84), samtalebordet (24), langsiden (60), overblik |
| huset | workshop-samtalebordet (vores pakke), workshop-langsiden, workshop-begge, oplaeg-samtalebordet, oplaeg-langsiden, oplaeg-begge |

Direkte links: `/lej-stedet#palmehus-langbord`, `/lej-stedet#huset`, `/lej-stedet#plateau-oplaeg6` osv.

## Rettelser

```bash
npm install
npm run build
git commit -am "..." && git push
```

Skift derefter `COMMIT` i adressen på hjemmesiden til den nye commit (`git rev-parse HEAD`) og udgiv. Den aktuelle commit på hjemmesiden står i Lej stedet → Page settings → Custom code.

Mål stammer fra Lendagers tegninger (2019) og er vejledende.

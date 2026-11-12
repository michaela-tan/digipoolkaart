"""Zet de provinciegrenzen (GeoJSON, WGS84) om naar SVG-paden voor de Digipoolkaart.

Bron: CBS Gebiedsindelingen via PDOK, vereenvoudigd door cartomap/nl
(https://github.com/cartomap/nl). Licentie: CC BY 4.0 (CBS / Kadaster).

Gebruik:  python3 tools/maak_kaart.py data/provincie_2026.geojson js/kaart-nederland.js
"""
import json
import math
import sys

# Eenvoudige equirectangulaire projectie, gecorrigeerd voor de breedtegraad van NL.
LON0, LAT0 = 3.30, 53.60      # linksboven
SCHAAL = 1000                 # SVG-eenheden per graad breedte
COS = math.cos(math.radians(52.2))


def projecteer(lon, lat):
    return ((lon - LON0) * COS * SCHAAL, (LAT0 - lat) * SCHAAL)


def ring_naar_pad(ring):
    punten = [projecteer(lon, lat) for lon, lat in ring]
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in punten) + "Z"


def main(bron, doel):
    geo = json.load(open(bron, encoding="utf-8"))
    provincies = []
    xs, ys = [], []
    for f in geo["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        d = ""
        for poly in polys:
            for ring in poly:
                d += ring_naar_pad(ring)
                for lon, lat in ring:
                    x, y = projecteer(lon, lat)
                    xs.append(x)
                    ys.append(y)
        provincies.append({"naam": f["properties"]["statnaam"], "code": f["properties"]["statcode"], "d": d})

    marge = 10
    viewbox = [round(min(xs) - marge), round(min(ys) - marge),
               round(max(xs) - min(xs) + 2 * marge), round(max(ys) - min(ys) + 2 * marge)]
    data = {
        "viewBox": viewbox,
        "projectie": {"lon0": LON0, "lat0": LAT0, "schaal": SCHAAL, "cos": COS},
        "provincies": provincies,
    }
    with open(doel, "w", encoding="utf-8") as uit:
        uit.write("// Gegenereerd door tools/maak_kaart.py — niet handmatig bewerken.\n")
        uit.write("// Provinciegrenzen: CBS / PDOK via cartomap/nl, CC BY 4.0.\n")
        uit.write("window.KAART_NEDERLAND = ")
        json.dump(data, uit, ensure_ascii=False, separators=(",", ":"))
        uit.write(";\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

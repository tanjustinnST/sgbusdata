const togeojson = require("@tmcw/togeojson");
const { fetch, parseXML, parseDOM, readFile, writeFile } = require("../utils");
const path = require("path");

const services = readFile("./data/v1/raw/bus-services.json");
const servicesLen = services.length;

const failedXMLs = [];
const failedKMLs = [];

(async () => {
  for (let i = 0; i < servicesLen; i++) {
    const { number, type, kmlFile, routeFile } = services[i];

    if (/^-/.test(number) || !/^(CITYDIRECT|TRUNK)$/.test(type)) {
      console.log(`Skipping ${number} (${type})`);
      continue;
    }

    for (let k = 0; k < routeFile.length; k++) {
      const fileName = routeFile[k];
      try {
        const data = await fetch(
          `https://www.lta.gov.sg/map/busService/bus_route_xml/${fileName}`
        );
        const regDirection = /^direction$/i;
        const json = parseXML(data, {
          isArray: (name) => name.match(regDirection),
        });
        const { direction } = json.route;
        const route = direction.map((d) => {
          const { name, busstop } = d;
          // Sometimes, `busstop` is undefined.
          // The XML looks like this (missing data): `<direction name="From to" />`
          return { name, stops: busstop?.map((s) => s.name) || [] };
        });

        writeFile(
          `data/v1/raw/services/${type}/${path.parse(fileName).name}.json`,
          route
        );
      } catch (e) {
        failedXMLs.push({ fileName, e });
      }
    }

    for (let k = 0; k < kmlFile.length; k++) {
      const fileName = kmlFile[k];
      try {
        const data = await fetch(
          `https://www.lta.gov.sg/map/busService/bus_route_kml/${fileName}`
        );
        const kml = parseDOM(data);
        const geojson = togeojson.kml(kml);

        writeFile(
          `data/v1/raw/services/${type}/${path.parse(fileName).name}.geojson`,
          geojson
        );
      } catch (e) {
        failedKMLs.push({ fileName, e: e.toString() });
      }
    }

    // Wait a second
    await new Promise((res) => setTimeout(res, 1000));
  }

  if (failedXMLs.length || failedKMLs.length) {
    console.log("FAILURES:");
    console.table(failedXMLs);
    console.table(failedKMLs);

    writeFile(`data/v1/patch/bus-services-routes.failures.json`, {
      failedXMLs,
      failedKMLs,
    });
  }
})();

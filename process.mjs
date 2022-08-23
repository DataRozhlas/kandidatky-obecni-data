import fs from "fs";
import { csvParse } from "d3-dsv";

// zpracuj seznam okresů
const rawOkresy = fs.readFileSync("./data/2022/cnumnuts.csv", "utf8");
const okresy = csvParse(rawOkresy)
  .filter(nuts => nuts.NUTS.length === 6)
  .map(okres => {
    return {
      ...okres,
      key: okres.NAZEVNUTS.normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replaceAll(" ", "-")
        .toLowerCase(),
    };
  });
fs.writeFileSync("./data/processed/okresy.json", JSON.stringify(okresy));

// převeď zastupitelstva do JSONu
const rawZastupitelstva = fs.readFileSync("./data/2022/kvrzcoco.csv", "utf8");
const zastupitelstva = csvParse(rawZastupitelstva).map(zastupitelstvo => {
  return {
    OKRES: zastupitelstvo.OKRES === "1100" ? "1199" : zastupitelstvo.OKRES,
    TYPZASTUP: zastupitelstvo.TYPZASTUP,
    DRUHZASTUP: zastupitelstvo.DRUHZASTUP,
    KODZASTUP: zastupitelstvo.KODZASTUP,
    NAZEVZAST: zastupitelstvo.NAZEVZAST,
    OBVODY: zastupitelstvo.OBVODY,
    COBVODU: zastupitelstvo.COBVODU,
    MANDATY: zastupitelstvo.MANDATY,
    POCOBYV: zastupitelstvo.POCOBYV,
    key: zastupitelstvo.NAZEVZAST.normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replaceAll(" ", "-")
      .replaceAll(".", "")
      .toLowerCase(),
  };
});
const zastUniq = [
  ...new Map(zastupitelstva.map(v => [v.KODZASTUP, v])).values(),
];
fs.writeFileSync(
  "./data/processed/zastupitelstva.json",
  JSON.stringify(zastUniq)
);

// převeď kandidáty do JSONu
const rawKandidati = fs.readFileSync("./data/2022/kvrk.csv", "utf8");
const kandidati = csvParse(rawKandidati).map(kandidat => {
  return {
    OKRES: kandidat.OKRES === "1100" ? "1199" : kandidat.OKRES,
    KODZASTUP: kandidat.KODZASTUP,
    COBVODU: kandidat.COBVODU,
    POR_STR_HL: kandidat.POR_STR_HL,
    OSTRANA: kandidat.OSTRANA,
    PORCISLO: kandidat.PORCISLO,
    JMENO: kandidat.JMENO,
    PRIJMENI: kandidat.PRIJMENI,
    TITULPRED: kandidat.TITULPRED,
    TITULZA: kandidat.TITULZA,
    VEK: kandidat.VEK,
    POVOLANI: kandidat.POVOLANI,
    BYDLISTEN: kandidat.BYDLISTEN,
    PSTRANA: kandidat.PSTRANA,
    NSTRANA: kandidat.NSTRANA,
    PLATNOST: kandidat.PLATNOST,
  };
});

fs.writeFileSync("./data/processed/kandidati.json", JSON.stringify(kandidati));

// rozděl zastupitelstva a kandidáty podle okresů a ulož je do adresáře

okresy.forEach(okres => {
  const zastupitelstvaOkresu = zastUniq.filter(
    zastupitelstvo => zastupitelstvo.OKRES === okres.NUMNUTS
  );
  const kandidatiOkresu = kandidati.filter(
    kandidat => kandidat.OKRES === okres.NUMNUTS
  );
  fs.mkdirSync(`./data/processed/${okres.key}`, { recursive: true });
  fs.writeFileSync(
    `./data/processed/${okres.key}/zastupitelstva.json`,
    JSON.stringify(zastupitelstvaOkresu)
  );
  fs.writeFileSync(
    `./data/processed/${okres.key}/kandidati.json`,
    JSON.stringify(kandidatiOkresu)
  );
});

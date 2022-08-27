import fs from "fs";
import { csvParse, tsvFormat } from "d3-dsv";

const roky = process.argv.splice(2, process.argv.length);

roky.forEach(rok => {
  if (!fs.existsSync(rok)) {
    fs.mkdirSync(rok);
  }

  // zpracuj seznam okresů
  const rawOkresy = fs.readFileSync(`raw/${rok}/cnumnuts.csv`, "utf8");
  const okresy = csvParse(rawOkresy)
    .filter(nuts => nuts.NUTS.length === 6)
    .map(okres => {
      return {
        NUMNUTS: okres.NUMNUTS,
        NAZEVNUTS: okres.NAZEVNUTS,
        key: okres.NAZEVNUTS.normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replaceAll(" ", "-")
          .toLowerCase(),
      };
    });
  fs.writeFileSync(`${rok}/okresy.json`, JSON.stringify(okresy));
  fs.writeFileSync(`${rok}/okresy.tsv`, tsvFormat(okresy));

  console.log(`${rok} okresy ok`);

  // převeď zastupitelstva do JSONu
  const rawZastupitelstva = fs.readFileSync(`raw/${rok}/kvrzcoco.csv`, "utf8");
  const zastupitelstva = csvParse(rawZastupitelstva).map(zastupitelstvo => {
    return {
      OKRES: zastupitelstvo.OKRES === "1100" ? "1199" : zastupitelstvo.OKRES, //aby Praha byla Praha
      TYPZASTUP: zastupitelstvo.TYPZASTUP,
      DRUHZASTUP: zastupitelstvo.DRUHZASTUP,
      KODZASTUP: zastupitelstvo.KODZASTUP,
      NAZEVZAST: zastupitelstvo.NAZEVZAST,
      OBVODY: zastupitelstvo.OBVODY,
      COBVODU: zastupitelstvo.COBVODU,
      MANDATY: zastupitelstvo.MANDATY,
      POCOBYV: zastupitelstvo.POCOBYV,
      key:
        zastupitelstvo.KODZASTUP === "553930"
          ? "mezholezy-2"
          : zastupitelstvo.KODZASTUP === "573591"
          ? "pohled-2"
          : zastupitelstvo.KODZASTUP === "582891"
          ? "brezina-2"
          : zastupitelstvo.NAZEVZAST.normalize("NFD")
              .replace(/\p{Diacritic}/gu, "")
              .replaceAll(" ", "-")
              .replaceAll(".", "")
              .toLowerCase(),
    };
  });
  const zastUniq = [
    //každé zastupitelstvo stačí jednou (aby se neopakovala zastupitelstva, do kterých se volí ve více obcích)
    ...new Map(zastupitelstva.map(v => [v.KODZASTUP, v])).values(),
  ];
  // fs.writeFileSync(`${rok}/zastupitelstva.json`, JSON.stringify(zastUniq));
  fs.writeFileSync(`${rok}/zastupitelstva.tsv`, tsvFormat(zastUniq));

  //vyrob seznam obcí pro autocomplete
  const zastAutocomplete = zastUniq.map(zast => {
    return {
      label: `${zast.NAZEVZAST}, okr. ${
        okresy.find(okres => okres.NUMNUTS === zast.OKRES).NAZEVNUTS
      }`,
      value: `${okresy.find(okres => okres.NUMNUTS === zast.OKRES).key}/${
        zast.key
      }`,
    };
  });
  fs.writeFileSync(`${rok}/zast-autocomplete.tsv`, tsvFormat(zastAutocomplete));

  console.log(`${rok} zastupitelstva ok`);

  // převeď kandidáty do JSONu
  const rawKandidati = fs.readFileSync(`raw/${rok}/kvrk-gender.csv`, "utf8");
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
      POHLAVI: kandidat.POHLAVI,
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

  // fs.writeFileSync(`${rok}/kandidati.json`, JSON.stringify(kandidati));
  fs.writeFileSync(`${rok}/kandidati.tsv`, tsvFormat(kandidati));
  console.log(`${rok} kandidati ok`);

  //vyegneruj kandidáty a zastupitelstva pro každý okres
  okresy.forEach(okres => {
    const zastupitelstvaOkresu = zastUniq.filter(
      zastupitelstvo => zastupitelstvo.OKRES === okres.NUMNUTS
    );
    const kandidatiOkresu = kandidati.filter(
      kandidat => kandidat.OKRES === okres.NUMNUTS
    );
    if (!fs.existsSync(`${rok}/${okres.key}`)) {
      fs.mkdirSync(`${rok}/${okres.key}`);
    }

    fs.writeFileSync(
      `${rok}/${okres.key}/zastupitelstva.tsv`,
      tsvFormat(zastupitelstvaOkresu)
    );
    console.log(`${rok} zastupitelstva ${okres.NAZEVNUTS} ok`);

    fs.writeFileSync(
      `${rok}/${okres.key}/kandidati.tsv`,
      tsvFormat(kandidatiOkresu)
    );
    console.log(`${rok} kandidáti ${okres.NAZEVNUTS} ok`);

    // vygeneruj kandidáty pro každou obec
    zastupitelstvaOkresu.forEach(zastupitelstvo => {
      const kandidatiObce = kandidatiOkresu.filter(
        kandidat => zastupitelstvo.KODZASTUP === kandidat.KODZASTUP
      );

      if (!fs.existsSync(`${rok}/${okres.key}/${zastupitelstvo.key}}`)) {
        fs.mkdirSync(`${rok}/${okres.key}/${zastupitelstvo.key}`);
      }
      fs.writeFileSync(
        `${rok}/${okres.key}/${zastupitelstvo.key}/kandidati.tsv`,
        tsvFormat(kandidatiObce)
      );
      console.log(`${rok} kandidáti ${zastupitelstvo.NAZEVZAST} ${rok} ok`);
    });
  });
});

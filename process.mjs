import fs from "fs";
import { csvParse, tsvFormat } from "d3-dsv";

const roky = process.argv.splice(2, process.argv.length);

//zkopíruj číselník stran
if (!fs.existsSync("2022")) {
  fs.mkdirSync("2022");
}
const rawCVS = fs.readFileSync(`raw/2022/cvs.csv`, "utf8");
const CVS = csvParse(rawCVS);
fs.writeFileSync(`2022/cvs.tsv`, tsvFormat(CVS));

roky.forEach(rok => {
  if (!fs.existsSync(rok)) {
    fs.mkdirSync(rok);
  }

  // zpracuj seznam okresů
  const rawOkresy = fs.readFileSync(`raw/2022/cnumnuts.csv`, "utf8");
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
    //Březina Blansko=>Brno-venkov
    if (rok === "2006" && zastupitelstvo.KODZASTUP === "581429") {
      zastupitelstvo.OKRES = "6203";
    }
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
        zastupitelstvo.KODZASTUP === "581429"
          ? "brezina"
          : zastupitelstvo.KODZASTUP === "553921"
          ? "mezholezy"
          : zastupitelstvo.KODZASTUP === "553930"
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
  const zastAutocomplete = zastUniq
    .sort((a, b) => Number(b.POCOBYV) - Number(a.POCOBYV))
    .map(zast => {
      return {
        label: `${
          zast.KODZASTUP === "553930"
            ? "Mezholezy 2"
            : zast.KODZASTUP === "582891"
            ? "Březina 2"
            : zast.NAZEVZAST
        }`,
        okres: okresy.find(okres => okres.NUMNUTS === zast.OKRES).NAZEVNUTS,
        value: `${okresy.find(okres => okres.NUMNUTS === zast.OKRES).key}/${
          zast.key
        }`,
      };
    });
  fs.writeFileSync(`${rok}/zast-autocomplete.tsv`, tsvFormat(zastAutocomplete));

  console.log(`${rok} zastupitelstva ok`);

  // převeď kandidáty do JSONu
  const rawKandidati = fs.readFileSync(`raw/${rok}/kvrk-gender.csv`, "utf8");
  const kandidati = csvParse(rawKandidati)
    .filter(kandidat => kandidat.PLATNOST === "A")
    .map(kandidat => {
      //Březina Blansko=>Brno-venkov
      if (rok === "2006" && kandidat.KODZASTUP === "581429") {
        return {
          ...kandidat,
          OKRES: "6203",
        };
      }
      //aby Praha byla Praha
      if (kandidat.OKRES === "1100") {
        return {
          ...kandidat,
          OKRES: "1199",
        };
      }
      return kandidat;
    })
    .sort(
      (a, b) =>
        Number(a.PORCISLO) - Number(b.PORCISLO) ||
        Number(a.COBVODU) - Number(b.COBVODU) ||
        Number(a.POR_STR_HL) - Number(b.POR_STR_HL)
    );

  // fs.writeFileSync(`${rok}/kandidati.json`, JSON.stringify(kandidati));
  fs.writeFileSync(`${rok}/kandidati.tsv`, tsvFormat(kandidati));
  console.log(`${rok} kandidati ok`);

  const rawStrany = fs.readFileSync(`raw/${rok}/kvros.csv`, "utf8");

  const strany = csvParse(rawStrany).map(strana => {
    //Březina Blansko=>Brno-venkov
    if (rok === "2006" && strana.KODZASTUP === "581429") {
      strana.OKRES = "6203";
    }

    //aby Praha byla Praha
    if (strana.OKRES === "1100") {
      strana.OKRES = "1199";
    }

    return strana;
  });

  fs.writeFileSync(`${rok}/strany.tsv`, tsvFormat(strany));
  console.log(`${rok} strany ok`);

  //vyegneruj zastupitelstva, kandidáty a strany pro každý okres
  okresy.forEach(okres => {
    const zastupitelstvaOkresu = zastUniq.filter(
      zastupitelstvo => zastupitelstvo.OKRES === okres.NUMNUTS
    );
    const kandidatiOkresu = kandidati.filter(
      kandidat => kandidat.OKRES === okres.NUMNUTS
    );
    const stranyOkresu = strany.filter(
      strana => strana.OKRES === okres.NUMNUTS
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

    fs.writeFileSync(`${rok}/${okres.key}/strany.tsv`, tsvFormat(stranyOkresu));
    console.log(`${rok} strany ${okres.NAZEVNUTS} ok`);

    // vygeneruj kandidáty pro každou obec
    zastupitelstvaOkresu.forEach(zastupitelstvo => {
      const kandidatiObce = kandidatiOkresu.filter(
        kandidat => zastupitelstvo.KODZASTUP === kandidat.KODZASTUP
      );
      const stranyObce = stranyOkresu.filter(
        strana => zastupitelstvo.KODZASTUP === strana.KODZASTUP
      );

      const zastObceUniq = [
        //každá strana stačí jednou (aby se neopakovaly strany v obcích s více obvody)
        ...new Map(stranyObce.map(v => [v.OSTRANA, v])).values(),
      ];

      if (!fs.existsSync(`${rok}/${okres.key}/${zastupitelstvo.key}`)) {
        fs.mkdirSync(`${rok}/${okres.key}/${zastupitelstvo.key}`);
      }
      fs.writeFileSync(
        `${rok}/${okres.key}/${zastupitelstvo.key}/kandidati.tsv`,
        tsvFormat(kandidatiObce)
      );

      console.log(`${rok} kandidáti ${zastupitelstvo.NAZEVZAST} ${rok} ok`);

      fs.writeFileSync(
        `${rok}/${okres.key}/${zastupitelstvo.key}/strany.tsv`,
        tsvFormat(zastObceUniq)
      );
      console.log(`${rok} strany ${zastupitelstvo.NAZEVZAST} ${rok} ok`);
    });
  });
});

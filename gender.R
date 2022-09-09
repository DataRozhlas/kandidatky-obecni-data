library(tidyverse)
library(readxl)
library(xml2)




# convert xls to csv

for (i in c(2018, 2014, 2010, 2006)) {
  files = list.files(paste0("raw/", i), "*.xlsx")
  for (j in files) {
    data=read_xlsx(paste0("raw/", i, "/", j))
    if (!is.null(data$POHLAVI)) {data = data %>% select(-POHLAVI, -DATNAR)}
    write_csv(data, paste0("raw/", i, "/", str_sub(j, 1, -6), ".csv"), quote = "all", na="")
  }
}


# update 2022 data




# join with POHLAVI
roky = c(2006, 2010, 2014, 2018, 2022)

for (i in roky) {
  if (file.exists(paste0("raw/", i, "/kvrk.csv"))) {
    data = read_csv(paste0("raw/", i, "/kvrk.csv"))
    if (i == 2022) {
      honzodata = read_csv("raw/data2022.csv")
    } else {
      honzodata = read_csv("raw/data.csv") %>% filter(ROK == i)
    }
    result = data %>% left_join(
      honzodata,
      by = c(
        "KODZASTUP",
        "COBVODU",
        "OSTRANA",
        "PORCISLO",
        "JMENO",
        "PRIJMENI",
        "TITULPRED",
        "TITULZA",
        "VEK",
        "POVOLANI",
        "PSTRANA",
        "NSTRANA"
      )
    ) %>% select(
      OKRES,
      KODZASTUP,
      COBVODU,
      POR_STR_HL,
      OSTRANA,
      PORCISLO,
      JMENO,
      PRIJMENI,
      TITULPRED,
      TITULZA,
      VEK,
      POVOLANI,
      BYDLISTEN,
      PSTRANA,
      NSTRANA,
      PLATNOST,
      POHLAVI
    )
    if (nrow(result) == nrow(data)) {
      write_csv(result, paste0("raw/", i, "/kvrk-gender.csv"), na = "")
    }
  }
}


result %>% filter(is.na(POHLAVI))

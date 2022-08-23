library(tidyverse)

dirs = list.dirs("./raw")

for (i in dirs) {
  if(file.exists(paste0(i, "/kvrk.csv"))) {
    data = read_csv(paste0(i, "/kvrk.csv"))
    honzodata = read_csv("raw/data.csv")
    result = data %>% left_join(honzodata, by=c("KODZASTUP", "COBVODU", "OSTRANA", "PORCISLO", "JMENO", "PRIJMENI", "TITULPRED", "TITULZA", "VEK", "POVOLANI", "PSTRANA", "NSTRANA")) %>% select(OKRES, KODZASTUP, COBVODU, POR_STR_HL, OSTRANA, PORCISLO, JMENO, PRIJMENI, TITULPRED, TITULZA, VEK, POVOLANI, BYDLISTEN, PSTRANA, NSTRANA, PLATNOST, POHLAVI)
    if(nrow(result)==nrow(data)) {write_csv(result, paste0(i, "/kvrk-gender.csv"))}
  }
}




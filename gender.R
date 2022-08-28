library(tidyverse)
library(readxl)


# convert semicolon to comma delimited and fix encoding


for (i in c(2018)) {
  files = list.files(paste0("raw/", i), "*.csv")
  for (j in files) {
  data=read_csv2(paste0("raw/", i, "/", j), locale = locale(encoding = "WINDOWS-1250"))
  write_csv(data, paste0("raw/", i, "/", j), quote = "all")
  }
  
}

# convert xls to csv

for (i in c(2014, 2010, 2006)) {
  files = list.files(paste0("raw/", i), "*.xlsx")
  for (j in files) {
    data=read_xlsx(paste0("raw/", i, "/", j))
    if (!is.null(data$POHLAVI)) {data = data %>% select(-POHLAVI, -DATNAR)}
    write_csv(data, paste0("raw/", i, "/", str_sub(j, 1, -6), ".csv"), quote = "all", na="")
  }
}



# join with POHLAVI
roky = c(2006, 2010, 2014, 2018, 2022)

for (i in roky) {
  if(file.exists(paste0("raw/", i, "/kvrk.csv"))) {
    data = read_csv(paste0("raw/", i, "/kvrk.csv"))
    honzodata = read_csv("raw/data.csv") %>% filter(ROK==i)
    result = data %>% left_join(honzodata, by=c("KODZASTUP", "COBVODU", "OSTRANA", "PORCISLO", "JMENO", "PRIJMENI", "TITULPRED", "TITULZA", "VEK", "POVOLANI", "PSTRANA", "NSTRANA")) %>% select(OKRES, KODZASTUP, COBVODU, POR_STR_HL, OSTRANA, PORCISLO, JMENO, PRIJMENI, TITULPRED, TITULZA, VEK, POVOLANI, BYDLISTEN, PSTRANA, NSTRANA, PLATNOST, POHLAVI)
    if(nrow(result)==nrow(data)) {write_csv(result, paste0("raw/", i, "/kvrk-gender.csv"), na="")}
  }
}




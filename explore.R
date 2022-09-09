library(tidyverse) 

kvrzcoco = read_csv("../kandidatky-obecni-data/raw/2022/kvrzcoco.csv")

kvrk = read_csv("../kandidatky-obecni-data/raw/2022/kvrk.csv")

# omezení na vybraný kraj (Liberecký, Ústecký)

numnuts = read_csv("../kandidatky-obecni-data/raw/2022/cnumnuts.csv")

liberecky = c(5101, 5102, 5103, 5104)
ustecky =c(4201, 4202, 4203, 4204, 4205, 4206, 4207)

kvrk = kvrk %>% filter(OKRES %in% liberecky | OKRES %in% ustecky)

kvrk = kvrk %>% filter(OKRES %in% ustecky)

kvrzcoco = kvrzcoco %>% filter(OKRES %in% ustecky)

kvrk = kvrk %>% filter(OKRES %in% liberecky)

kvrzcoco = kvrzcoco %>% filter(OKRES %in% liberecky)

# Obce, kde je stejný počet kandidátů jako mandátů, takže je předem jasné, kdo volby vyhraje

kandidati_v_obcich = kvrk %>% group_by(KODZASTUP) %>% summarise(celkem=n())
kvrzcoco %>% left_join(kandidati_v_obcich) %>% filter(celkem==MANDATY) %>% arrange(desc(POCOBYV))
                       
# Obce, kde je méně kandidátů než mandátů

kvrzcoco %>% left_join(kandidati_v_obcich) %>% filter(celkem<MANDATY) %>% arrange(desc(POCOBYV)) %>% select(NAZEVZAST, celkem, OKRES, MANDATY)

# Obce, kde se o jeden mandát uchází nejvíc kandidátů

kvrzcoco %>% left_join(kandidati_v_obcich) %>% mutate(konkurence=celkem/MANDATY) %>% arrange(desc(konkurence)) %>% select(NAZEVZAST, celkem, OKRES, MANDATY) 

# Obce, kde nikdo nekandiduje

kvrzcoco %>% left_join(kandidati_v_obcich) %>% filter(is.na(celkem)) %>% arrange(desc(POCOBYV))

# Obce, kde má každý kandidát samostatnou kandidátku

kandidatky_jednotlivci = kvrk %>% group_by(KODZASTUP) %>% summarise(maxcislo=max(PORCISLO))  %>% filter(maxcislo==1) %>% distinct(KODZASTUP)

kvrzcoco %>% right_join(kandidatky_jednotlivci) %>% arrange(desc(POCOBYV))


# nejstarší kandidáti

kvrk %>% group_by(KODZASTUP) %>% summarise(prumvek=mean(VEK)) %>% arrange(prumvek)

# nejstarší kandidátní listiny

kandidatky_viceclenne = kvrk %>% group_by(KODZASTUP) %>% summarise(maxcislo=max(PORCISLO))  %>% filter(maxcislo!=1) %>% distinct(KODZASTUP)

kvrk %>% right_join(kandidatky_viceclenne) %>% group_by(KODZASTUP, PORCISLO) %>% summarise(prumvek=mean(VEK)) %>% arrange(prumvek)

# jen muži

read_csv("raw/data2022.csv") %>% filter(KODOKRES %in% liberecky) %>% count(KODZASTUP, POHLAVI)  %>% pivot_wider(names_from = POHLAVI,  values_from = n) %>% filter(is.na(F)) %>% left_join(kvrzcoco) %>% arrange(desc(POCOBYV))
  
  
  
  mutate(rate=F/(M+F)) %>% arrange(desc(rate))




## 1. PACKAGES and FUNCTIONS ##

# install.packages('lme4')
# install.packages('haven')
# install.packages('tidyverse')
# install.packages('lmerTest')
# install.packages('readxl')
# install.packages('effects')
# install.packages('ggpubr')
# install.packages('rstatix')
# install.packages('AICcmodavg')
# install.packages("rmarkdown")
# install.packages('plyr', repos = "http://cran.us.r-project.org")
# install.packages('pROC')
# install.packages('patchwork')
# install.packages('psych')
# install.packages('BayesFactor')
# install.packages('reshape2')
# install.packages('ggridges')
# install.packages('BBmisc')

# load packages

library('lme4') # for the analysis
library('haven') # to load the SPSS .sav file
library('tidyverse') # needed for data manipulation.
library('lmerTest') # to get p-value estimations that are not part of the standard lme4 packages
library('readxl') # to load in the data from exel
library('ggplot2') # to make plots
library('nlme') # for the linear mixed effects models 
library('effects') # to get statistic values
library('ggpubr') # for citations
library('rstatix')  # to get statistic values
library('plyr') # data manipulation 
library('dplyr') # data manipulation 
library('AICcmodavg') # computing AIC's 
library('rmarkdown')
library('pROC')
library('Rcpp')
library('patchwork')
library('BayesFactor')
library('psych') # for corr.test()
library('reshape2')
library('ggridges')
library('BBmisc')
install.packages('quanteda')
library('quanteda')

library(ggplot2)
library(dplyr)
library(hrbrthemes)


myfiles <- list.files(pattern="*.csv", full.names=TRUE)
dat <- ldply(myfiles, read_csv)

# select relevant col(umns:
dat <- dat %>% filter(trial_type == 'html-speech-API-response')
dat <- dat %>% select(rt, `transcribed speech signal response`, answer, confidence, id)

# copmute correctness:
dat$correct <- dat$answer == tolower(dat$`transcribed speech signal response`)

# calculate averages and sort:
sum <- aggregate(dat, list(dat$id), mean)
sum_sorted <- sum[order(sum$correct),] 

mean(dat$correct) # overall average error rate 
(sum(sum$correct < 1)/sum(sum$correct <= 1)) # proportion of items that were transcribed incorrectly at least one time

# which items are good enough?
ggplot(data=sum_sorted, aes(x= reorder(id, correct), y=correct)) +
  geom_point() +
  theme_ipsum()

# is there a relation between confidence and correctness?
ggplot(sum, aes(x=confidence, y=correct)) + 
  geom_point()+
  geom_smooth(method=lm) +
  theme_ipsum()

# confidence and correctness distribution:
ggplot(dat, aes(x=confidence, fill=correct)) +
  geom_histogram( color="#e9ecef", alpha=0.6, position = 'identity') +
  scale_fill_manual(values=c("#69b3a2", "#404080")) +
  theme_ipsum() +
  labs(fill="")








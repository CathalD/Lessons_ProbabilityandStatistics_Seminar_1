# Lesson 1: an empirical model for a field question.
# Run from the repository root for local CSVs, or use the published CSVs.
# Data attribution: datasets::InsectSprays (Beall, 1942), treatment C.
base <- if (dir.exists("data")) "data/" else
  "https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/data/"
training <- read.csv(paste0(base, "insects_training.csv"))
x <- training$count

# Question: what is the chance of at most two insects in a comparable unit?
counts <- table(factor(x, levels = 0:7))
phat <- prop.table(counts)
print(data.frame(count = 0:7, frequency = as.integer(counts), probability = as.numeric(phat)))
Fhat <- ecdf(x)
q <- mean(x <= 2)
expected_in_four <- 4 * q
print(c(probability = q, expected_in_four = expected_in_four))
print(mean(x >= 1 & x <= 3))

# First make your own PMF and CDF. Then run these comparisons.
if (interactive()) {
  barplot(phat, xlab = "Insect count", ylab = "Estimated probability")
  plot(Fhat, xlab = "Insect count", ylab = "Cumulative proportion")
}

# Record the target population, assumptions and forecasts before uncommenting.
# validation <- read.csv(paste0(base, "insects_validation_INSTRUCTOR.csv"))
# sum(validation$count <= 2)
# Four outcomes are too few for a reliable calibration conclusion.

# Continuous measurements: an ECDF can answer interval questions directly.
# Source: Meuse topsoil observations, zinc in mg/kg; this is a selected excerpt.
soil <- read.csv(paste0(base, "soil_distribution.csv"))
soil_Fhat <- ecdf(soil$zinc_mg_kg)
q_soil <- mean(soil$zinc_mg_kg >= 500)
print(c(soil_probability = q_soil, expected_in_ten = 10 * q_soil))
if (interactive()) plot(soil_Fhat, xlab = "Zinc (mg/kg)", ylab = "Cumulative proportion")
# The threshold is a teaching choice. Describe the sample before generalising
# to a new site; these observations do not establish a representative sample.
stopifnot(abs(sum(phat) - 1) < 1e-12, q == .75, q_soil == .3)

# Lesson 2: conditional prediction and a guided spatial model.
# Use the provided CSVs; no additional R packages are required.
base <- if (dir.exists("data")) "data/" else
  "https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/data/"

# A two-stage experiment: a controller chooses one, two or three fair dice.
set.seed(20261120)
N <- sample(1:3, 60, replace = TRUE)
S <- vapply(N, function(n) sum(sample(1:6, n, replace = TRUE)), numeric(1))
training <- data.frame(N, S)
print(aggregate(I(S >= 10) ~ N, training, mean))
# Define p_hat(s | n) using the number of observations in that condition.
if (interactive()) plot(N, S, xlab = "Controller N", ylab = "True total S")

# Forestry transfer. The source's Girth variable is actually diameter.
trees <- read.csv(paste0(base, "trees_training.csv"))
new_trees <- read.csv(paste0(base, "trees_predictors.csv"))
q_group <- tapply(trees$volume_ft3 >= 30, trees$diameter_group, mean)
tree_forecast <- q_group[new_trees$diameter_group]
print(q_group)
print(c(expected_high_volume_count = sum(tree_forecast)))

# Field question: predict held-out *measurements* of zinc at known coordinates.
# Source: Meuse data, Ruud van Rijn and Mathieu Rikken; R compilation E. Pebesma.
soil <- read.csv(paste0(base, "meuse_training.csv"))
locations <- read.csv(paste0(base, "meuse_predictors.csv"))
distance <- function(a, b) {
  sqrt(outer(a[,1], b[,1], "-")^2 + outer(a[,2], b[,2], "-")^2)
}

# SUPPLIED HELPER: a constant-mean Gaussian model for natural-log zinc.
# The exponential length scale (500 m) and nugget fraction (0.10) are declared
# teaching choices. Fit the remaining quantities with training data only.
# The intervals condition on these estimates; parameter uncertainty is omitted.
predict_spatial <- function(training, new_locations, length_scale_m = 500,
                            nugget_fraction = .10) {
  stopifnot(all(training$zinc > 0), length_scale_m > 0,
            nugget_fraction > 0, nugget_fraction < 1)
  z <- log(training$zinc)
  mu <- mean(z)
  total_var <- var(z)
  signal_var <- (1 - nugget_fraction) * total_var
  noise_var <- nugget_fraction * total_var
  xy <- as.matrix(training[, c("x", "y")])
  target_xy <- as.matrix(new_locations[, c("x", "y")])
  K <- signal_var * exp(-distance(xy, xy) / length_scale_m)
  diag(K) <- diag(K) + noise_var
  cross_cov <- signal_var * exp(-distance(xy, target_xy) / length_scale_m)
  log_mean <- as.vector(mu + crossprod(cross_cov, solve(K, z - mu)))
  latent_var <- pmax(0, signal_var - colSums(cross_cov * solve(K, cross_cov)))
  measurement_var <- latent_var + noise_var
  data.frame(sample_id = new_locations$sample_id,
             baseline_log_prediction = mu,
             spatial_log_prediction = log_mean,
             log_observation_variance = measurement_var,
             zinc_median_mg_kg = exp(log_mean),
             zinc_mean_mg_kg = exp(log_mean + measurement_var / 2),
             lower95_mg_kg = exp(log_mean - 1.96 * sqrt(measurement_var)),
             upper95_mg_kg = exp(log_mean + 1.96 * sqrt(measurement_var)))
}
predictions <- predict_spatial(soil, locations)
print(predictions)
if (interactive()) {
  plot(soil$x, soil$y, asp = 1, pch = 16, col = "steelblue",
       xlab = "Easting (m)", ylab = "Northing (m)")
  points(locations$x, locations$y, pch = 1, cex = 1.4)
}

# Commit predictions and explain the model before running the evaluation.
# validation <- read.csv(paste0(base, "meuse_validation_INSTRUCTOR.csv"))
# result <- merge(predictions, validation, by = "sample_id")
# rmse <- function(y, prediction) sqrt(mean((y - prediction)^2))
# rmse(log(result$zinc), result$baseline_log_prediction)
# rmse(log(result$zinc), result$spatial_log_prediction)
# mean(result$zinc >= result$lower95_mg_kg & result$zinc <= result$upper95_mg_kg)
# This split asks about interpolation. Transferring to a distant region needs
# an appropriate evaluation design; refit any selected model within training folds.
stopifnot(nrow(soil) == 140, nrow(predictions) == 15,
          all(is.finite(predictions$spatial_log_prediction)))

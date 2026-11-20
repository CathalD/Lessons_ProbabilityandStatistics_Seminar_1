# Practical statistics seminars 1 and 2
# Instructor reference: contains validation outcomes and worked answers.
# Run from a writable directory: Rscript "Instructor worked examples.R"
# Base R handles the dice, insect and forestry examples. The soil example
# also needs the sp package. No packages are installed automatically.
# These are worked planning examples, not student assessment handouts.

options(stringsAsFactors = FALSE)
set.seed(20261120)
out_dir <- "assessment_data"
dir.create(out_dir, showWarnings = FALSE)

empirical_pmf <- function(x, support = sort(unique(x))) {
  stopifnot(length(x) > 0, !anyNA(x), !anyDuplicated(support), all(x %in% support))
  counts <- tabulate(match(x, support), nbins = length(support))
  data.frame(value = support, count = counts, probability = counts / length(x))
}
event_probability <- function(x, lower, upper) {
  stopifnot(length(x) > 0, !anyNA(x), lower <= upper)
  mean(x >= lower & x <= upper)
}
brier <- function(probability, outcome) {
  stopifnot(length(probability) == length(outcome),
            all(probability >= 0 & probability <= 1), all(outcome %in% c(0, 1)))
  mean((probability - outcome)^2)
}
rmse <- function(observed, predicted) {
  stopifnot(length(observed) == length(predicted), length(observed) > 0)
  sqrt(mean((observed - predicted)^2))
}
write_data <- function(x, file) {
  write.csv(x, file.path(out_dir, file), row.names = FALSE)
}

# LESSON 1: real insect counts; use only one spray treatment.
insects <- subset(datasets::InsectSprays, spray == "C", select = "count")
insects$sample_id <- seq_len(nrow(insects))
insect_train <- insects[1:8, c("sample_id", "count")]
insect_test <- insects[9:12, c("sample_id", "count")]
q_insect <- mean(insect_train$count <= 2)
insect_pmf <- empirical_pmf(insect_train$count, 0:7)
write_data(insect_train, "insects_training.csv")
write_data(insect_test, "insects_validation_INSTRUCTOR.csv")
cat("\nLESSON 1: INSECTS\n")
print(insect_pmf)
print(data.frame(q_count_at_most_2 = q_insect,
                 expected_in_4 = 4 * q_insect,
                 observed_in_4 = sum(insect_test$count <= 2),
                 p_between_1_and_3 = event_probability(insect_train$count, 1, 3)))
stopifnot(q_insect == 0.75,
          sum(insect_test$count <= 2) == 2,
          event_probability(insect_train$count, 1, 3) == 0.75)

# LESSON 2: exact theoretical random sums, initially N uniform on 1,2,3.
# The controller maps die faces 1,2 -> 1; 3,4 -> 2; 5,6 -> 3.
exact_sum <- function(n, faces = 1:6) {
  grid <- expand.grid(rep(list(faces), n))
  totals <- rowSums(grid)
  tabulate(totals + 1, nbins = 6 * n + 1) / nrow(grid)
}
conditional <- lapply(1:3, exact_sum)
support <- 0:18
conditional_matrix <- sapply(conditional, function(p) c(p, rep(0, 19 - length(p))))
mixture <- rowMeans(conditional_matrix)
theory_mean <- sum(support * mixture)
theory_variance <- sum((support - theory_mean)^2 * mixture)
q_by_n <- colSums(conditional_matrix[support >= 10, , drop = FALSE])
stopifnot(abs(sum(mixture) - 1) < 1e-12,
          abs(theory_mean - 7) < 1e-12,
          abs(theory_variance - 14) < 1e-12,
          max(abs(q_by_n - c(0, 1 / 6, 5 / 8))) < 1e-12)
cat("\nLESSON 2: RANDOM SUM THEORY\n")
print(data.frame(N = 1:3, mean_total = 3.5 * (1:3), q_total_at_least_10 = q_by_n))
print(c(mixture_mean = theory_mean, mixture_variance = theory_variance,
        q_total_at_least_10 = mean(q_by_n)))

# Thirty training trials, followed by ten independent validation trials.
# A theoretical benchmark is derived before collecting these observations.
sample_trial <- function(k) {
  n <- sample.int(3, 1)
  data.frame(trial = k, N = n, total = sum(sample.int(6, n, replace = TRUE)))
}
random_sum_train <- do.call(rbind, lapply(1:30, sample_trial))
random_sum_test <- do.call(rbind, lapply(31:40, sample_trial))
q_global <- mean(random_sum_train$total >= 10)
q_empirical <- sapply(1:3, function(n) {
  z <- subset(random_sum_train, N == n)$total
  if (!length(z)) return(NA_real_)
  mean(z >= 10)
})
stopifnot(!anyNA(q_empirical))
q_unconditional <- rep(q_global, nrow(random_sum_test))
q_conditional <- q_empirical[random_sum_test$N]
outcomes <- as.integer(random_sum_test$total >= 10)
cat("\nRANDOM SUM: LOCKED MODEL COMPARISON\n")
print(data.frame(model = c("empirical overall", "empirical conditional"),
                 Brier = c(brier(q_unconditional, outcomes), brier(q_conditional, outcomes))))
write_data(random_sum_train, "random_sum_training.csv")
write_data(random_sum_test, "random_sum_validation_INSTRUCTOR.csv")

# Zero covariance does not imply independence: M has N-dependent variance.
# E(M | N) = 3.5; Var(M | N) = (35 / 12) / N.

# Exact two-cup control: independent two-dice totals versus a shared draw.
all_shared <- expand.grid(C = 1:6, A = 1:6, B = 1:6)
all_shared$X <- all_shared$C + all_shared$A
all_shared$Y <- all_shared$C + all_shared$B
pop_cov <- function(x, y) mean((x - mean(x)) * (y - mean(y)))
stopifnot(abs(pop_cov(all_shared$X, all_shared$Y) - 35 / 12) < 1e-12,
          abs(cor(all_shared$X, all_shared$Y) - 0.5) < 1e-12)
cat("\nSHARED DRAW THEORY\n")
print(c(covariance = pop_cov(all_shared$X, all_shared$Y),
        correlation = cor(all_shared$X, all_shared$Y),
        p_Y_at_least_9 = mean(all_shared$Y >= 9),
        p_Y_at_least_9_given_X10 = mean(subset(all_shared, X == 10)$Y >= 9)))

# Genetic-mixing analogy: low/high identities persist through fresh rolls.
# Reset to A={low,low}, B={high,high} before each independent trial.
# k is uniform on 0,1,2; exchange k dice in each direction.
low_faces <- c(0, 0, 1, 1, 2, 2)
high_faces <- c(7, 7, 8, 8, 9, 9)
draw_faces <- function(faces, number) {
  if (!number) return(numeric())
  sample(faces, number, replace = TRUE)
}
mixing_trial <- function(i) {
  k <- sample(0:2, 1)
  a <- sum(c(draw_faces(low_faces, 2 - k), draw_faces(high_faces, k)))
  b <- sum(c(draw_faces(low_faces, k), draw_faces(high_faces, 2 - k)))
  data.frame(trial = i, high_in_A = k, total_A = a, total_B = b)
}
mixing <- do.call(rbind, lapply(1:10000, mixing_trial))
cat("\nMIXING MODEL: SIMULATION AND THEORY\n")
print(c(empirical_covariance = cov(mixing$total_A, mixing$total_B),
        theoretical_covariance = -98 / 3,
        empirical_correlation = cor(mixing$total_A, mixing$total_B),
        theoretical_correlation = -49 / 51))

# Spatial model: five sites share overlapping triples of seven fresh draws.
spatial_trials <- t(replicate(10000, {
  z <- sample.int(6, 7, replace = TRUE)
  vapply(1:5, function(i) sum(z[i:(i + 2)]), numeric(1))
}))
kernel_dice <- function(h) (35 / 12) * pmax(3 - abs(h), 0)
theoretical_cov <- outer(1:5, 1:5, function(i, j) kernel_dice(i - j))
cat("\nSPATIAL COVARIANCE: EMPIRICAL AND THEORETICAL\n")
print(round(cov(spatial_trials), 2))
print(round(theoretical_cov, 2))
stopifnot(all(eigen(theoretical_cov, symmetric = TRUE)$values > 0))

# FORESTRY TRANSFER: real black cherry tree measurements.
# Girth is actually diameter in inches according to the dataset documentation.
# The fixed split is decided without using outcomes; no model tuning on test data.
tree_data <- datasets::trees
names(tree_data)[names(tree_data) == "Girth"] <- "diameter_in"
names(tree_data)[names(tree_data) == "Volume"] <- "volume_ft3"
names(tree_data)[names(tree_data) == "Height"] <- "height_ft"
tree_data$tree_id <- seq_len(nrow(tree_data))
tree_data$diameter_group <- ifelse(tree_data$diameter_in <= 12, "at_most_12", "above_12")
tree_test_rows <- seq(3, 30, by = 3)
tree_train <- tree_data[-tree_test_rows, ]
tree_test <- tree_data[tree_test_rows, ]
tree_summary <- do.call(rbind, lapply(c("at_most_12", "above_12"), function(g) {
  z <- subset(tree_train, diameter_group == g)
  data.frame(diameter_group = g, n = nrow(z), n_volume_at_least_30 = sum(z$volume_ft3 >= 30),
             q = mean(z$volume_ft3 >= 30), mean_volume_ft3 = mean(z$volume_ft3))
}))
cat("\nFORESTRY: TRAINING SUMMARY\n")
print(tree_summary)
q_tree <- setNames(tree_summary$q, tree_summary$diameter_group)
tree_forecasts <- q_tree[tree_test$diameter_group]
cat("Forestry Brier, fixed 10-tree holdout:",
    brier(unname(tree_forecasts), as.integer(tree_test$volume_ft3 >= 30)), "\n")
write_data(tree_train, "trees_training.csv")
write_data(tree_test[, setdiff(names(tree_test), "volume_ft3")], "trees_predictors.csv")
write_data(tree_test, "trees_validation_INSTRUCTOR.csv")
write_data(tree_summary, "trees_training_summary.csv")

# REAL GEOSTATISTICS: Meuse soil zinc observations.
# Predict held-out measurements; the field's latent true concentrations are unknown.
# This is a deliberately simple GP with a constant mean and an exponential kernel.
# Length scale and nugget fraction are declared teaching choices, not values
# estimated by the dataset documentation. Estimate remaining quantities on training only.
# The plug-in intervals below omit uncertainty in the mean and covariance parameters.
if (requireNamespace("sp", quietly = TRUE)) {
  data("meuse", package = "sp", envir = environment())
  # Exclude all Lesson 2 validation sites from the earlier lesson's handout.
  soil_excerpt_rows <- c(1:9, 11)
  soil_distribution <- data.frame(sample_id = soil_excerpt_rows,
                                  zinc_mg_kg = meuse$zinc[soil_excerpt_rows])
  write_data(soil_distribution, "soil_distribution.csv")
  cat("\nLESSON 1: SOIL ECDF\n")
  print(soil_distribution)
  print(c(p_at_least_500 = mean(soil_distribution$zinc_mg_kg >= 500),
          expected_in_10 = 10 * mean(soil_distribution$zinc_mg_kg >= 500)))

  meuse$sample_id <- seq_len(nrow(meuse))
  soil_test_rows <- seq(10, 150, by = 10)
  soil_train <- meuse[-soil_test_rows, c("sample_id", "x", "y", "zinc")]
  soil_test <- meuse[soil_test_rows, c("sample_id", "x", "y", "zinc")]
  pair_distance <- function(a, b) {
    sqrt(outer(a[, 1], b[, 1], "-")^2 + outer(a[, 2], b[, 2], "-")^2)
  }
  predict_spatial <- function(training, locations, length_scale_m = 500, nugget_fraction = 0.1) {
    stopifnot(all(training$zinc > 0), length_scale_m > 0,
              nugget_fraction > 0, nugget_fraction < 1)
    z <- log(training$zinc)
    xy <- as.matrix(training[, c("x", "y")])
    target_xy <- as.matrix(locations[, c("x", "y")])
    mu <- mean(z)
    total_var <- var(z)
    signal_var <- (1 - nugget_fraction) * total_var
    noise_var <- nugget_fraction * total_var
    K <- signal_var * exp(-pair_distance(xy, xy) / length_scale_m)
    diag(K) <- diag(K) + noise_var
    cross_cov <- signal_var * exp(-pair_distance(xy, target_xy) / length_scale_m)
    alpha <- solve(K, z - mu)
    log_mean <- as.vector(mu + crossprod(cross_cov, alpha))
    log_latent_var <- pmax(0, signal_var - colSums(cross_cov * solve(K, cross_cov)))
    log_observation_var <- log_latent_var + noise_var
    data.frame(sample_id = locations$sample_id,
               baseline_log_prediction = mu,
               spatial_log_prediction = log_mean,
               log_observation_variance = log_observation_var,
               zinc_median_mg_kg = exp(log_mean),
               zinc_mean_mg_kg = exp(log_mean + log_observation_var / 2),
               lower95_mg_kg = exp(log_mean - 1.96 * sqrt(log_observation_var)),
               upper95_mg_kg = exp(log_mean + 1.96 * sqrt(log_observation_var)))
  }
  # Target measurements are excluded from the prediction helper's inputs.
  soil_predictors <- soil_test[, c("sample_id", "x", "y")]
  soil_predictions <- predict_spatial(soil_train, soil_predictors)
  results <- merge(soil_predictions, soil_test, by = "sample_id", sort = FALSE)
  soil_metrics <- c(baseline_RMSE_log = rmse(log(results$zinc), results$baseline_log_prediction),
                    spatial_RMSE_log = rmse(log(results$zinc), results$spatial_log_prediction),
                    observed_coverage95 = mean(results$zinc >= results$lower95_mg_kg &
                                                results$zinc <= results$upper95_mg_kg))
  cat("\nMEUSE: FIXED 15-LOCATION INTERPOLATION HOLDOUT\n")
  print(soil_metrics)
  print(head(results, 3))
  write_data(soil_train, "meuse_training.csv")
  write_data(soil_predictors, "meuse_predictors.csv")
  write_data(soil_test, "meuse_validation_INSTRUCTOR.csv")
  write_data(soil_predictions, "meuse_locked_predictions_INSTRUCTOR.csv")
  write_data(data.frame(metric = names(soil_metrics), value = unname(soil_metrics)), "meuse_metrics_INSTRUCTOR.csv")

  # A geographically separated target asks a different prediction question.
  # Refitting is done within its training set; the earlier holdout is not reused to tune.
  north_test <- meuse$y > unname(quantile(meuse$y, 0.8))
  north_training <- meuse[!north_test, c("sample_id", "x", "y", "zinc")]
  north_locations <- meuse[north_test, c("sample_id", "x", "y")]
  north_predictions <- predict_spatial(north_training, north_locations)
  cat("\nMEUSE: OPTIONAL NORTHERN-BLOCK HOLDOUT\n")
  print(c(n_test = sum(north_test),
          RMSE_log = rmse(log(meuse$zinc[north_test]), north_predictions$spatial_log_prediction)))
  stopifnot(nrow(soil_train) == 140, nrow(soil_predictors) == 15,
            !any(soil_distribution$sample_id %in% soil_test$sample_id),
            !any(soil_train$sample_id %in% soil_test$sample_id),
            all(is.finite(soil_predictions$spatial_log_prediction)))
} else {
  message("Soil example skipped: install sp separately to use the real Meuse data.")
}

cat("\nWorked examples complete. CSV files are in", normalizePath(out_dir), "\n")

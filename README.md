# Practical probability and statistics seminars

Two three-hour university seminars for empirical scientists. Every practical follows a scientific question through theory, observation, empirical modelling, comparison, prediction and validation. Each seminar ends with a 25-minute assessment using real ecology and soil observations.

- [Lesson 1](https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/): independent observations, regular and irregular three-dice experiments, empirical PMFs and CDFs, theoretical comparisons, measurement and prediction.
- [Lesson 2](https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/lesson2.html): conditional random sums, paired variation, cup exchange, genetic mixing, spatial covariance and a guided Gaussian-process field model.
- [R and resources](https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/resources.html): scaffolded R, real-data CSVs and sources beside the concepts they support.

The project remains buildless HTML/CSS/JavaScript, with no external scripts, accounts or backend. GitHub Pages already publishes main at the repository root. No Pages-setting change is needed for updates.

## Open the lesson

Serve this directory with any static server and open `index.html`. It has no installation or build step, no external script dependencies, no accounts and no backend. Relative asset links support a GitHub Pages project URL.

For example, with Python installed:

```sh
python3 -m http.server 8768
```

Open `http://localhost:8768/`.

## Publish on GitHub Pages

In this repository, open **Settings → Pages**. Choose **Deploy from a branch**, then **main** and **/ (root)**, and save. The site files live at the repository root; `.nojekyll` makes this a plain static site.

See [GitHub’s publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). The intended project URL is `https://cathald.github.io/Lessons_ProbabilityandStatistics_Seminar_1/` after Pages is enabled and deployment succeeds.

## Teaching sequence

1. Counts become relative frequencies, an empirical PMF and a CDF.
2. Students collect fuzzy readings of three regular dice, make their own plots and write their functions.
3. They lock interval probabilities and check ten new opaque-cup outcomes.
4. They switch to irregular dice with undisclosed face labels from 0–9, construct a new empirical model, and repeat the ten-roll prediction test.
5. They distinguish variation in the process, measurement error and uncertainty in an estimated distribution.

The clear reference values are held back during training. The opaque values are revealed for validation only after forecasts are locked. In Lesson 2, a predictor is revealed before the linked target, so a frozen conditional rule can use new information without refitting.

Open `instructor.html` for the full 180-minute schedule, reference values, simulator assumptions, physical setup and discussion prompts.

Open `lesson2-instructor.html` for the Lesson 2 schedule, complete teaching notes, mechanism comparisons and assessment marking guide. Genetic mixing and spatial covariance each receive 30 minutes. The controller experiment uses one, two or three dice; the original one-to-six version is an extension.

## Models and real-data transfer

Theoretical models state a mechanism and assumptions; empirical models estimate probabilities or relationships from training data; observation models connect readings with the process. Comparisons name the variable being compared. Lesson 1's synthetic sensor clips its error-adjusted readings; Lesson 2's ±1 sensor does not clip.

Lesson 1 transfers the tools to treatment C of `datasets::InsectSprays` and a selected Meuse soil excerpt. Lesson 2 uses `datasets::trees` and a fixed 140/15 split of `sp::meuse`. The earlier soil excerpt excludes all later validation locations. Data sources and units are linked in the lessons and resources page. The `Girth` variable in the forestry source is diameter and is renamed accordingly.

The spatial example predicts held-back measurements using a declared constant-mean, exponential model for natural-log zinc. Length scale 500 m and nugget fraction 0.10 are teaching choices; remaining quantities use training data only. Prediction intervals omit parameter-estimation uncertainty. An interpolation split and a geographically separate target answer different questions.

`r/lesson1.R` and `r/lesson2.R` use base R and prepared CSVs. Run them from the repository root for local data or use their published-data fallback. `r/instructor.R` reproduces the planning checks and data preparation, with `sp` additionally needed for its original-data section. Packages are not installed automatically.

The assessments are formative. Public source contains reference outcomes and worked answers, so the interaction order is a teaching aid rather than examination security.

## Student work

- Both physical-data entry and a clearly labelled simulated instrument are available.
- Each experiment has its own dataset, drawings, functions, prediction explanation and reflection.
- Computed plots are optional comparisons; the drawing grids and function fields begin blank.
- Work saves to browser-local storage when available. **Save notebook** exports JSON; **Load notebook** restores it. No student work is sent to a server. Lesson 1 retains its original version-2 dice store and imports older notebooks. Its new export includes both the dice experiments and the course notes/assessment. Lesson 2 has a separate store.
- **Print worksheets** uses the print layout. Text descriptions offer an alternative to pointer drawing.
- Forecast locking freezes training data and forecasts before validation. It is a teaching aid, not secure exam enforcement.
- The regular known-model comparison distinguishes true totals and observed readings. The irregular simulator reference remains hidden until all ten validation outcomes have been recorded. Simulated clear references are separate from student exports.

## Mathematical conventions

Use `P(event)` for probability, `p(x)` for a discrete PMF, `F(x)` for a CDF and `f(x)` for continuous density. Hats mark estimates. Dice are discrete; a normal curve is an approximation, not their exact distribution.

Three ordinary dice have **216 ordered face combinations and 16 possible totals**, not 600 possibilities. Fuzzy measurements estimate the observed distribution. Predicting true outcomes from them requires a measurement assumption; the site makes that limitation explicit.

## Checks

Run `node tests/math.test.js`, `node tests/dependence.test.js` and `python3 tests/static_check.py`. These check exact probabilities, sensor distributions, shared covariance, conditional boundaries, scores, data separation and local links. Run the student R examples to verify the field calculations.

## Files

- `index.html` — student lesson and quick visual explanations
- `instructor.html` — seminar plan and teaching notes
- `instructor.js` — held-back simulation references in the instructor view
- `app.js` — notebook, sketches, plots and experiment interaction
- `math.js` — probability calculations shared by plots and tests
- `styles.css` — responsive and print layouts
- `tests/math.test.js` — mathematical regression checks
- `lesson2.html`, `lesson2.js`, `dependence.js` — linked experiments and pure probability tools
- `course.js`, `course.css` — shared plots, drawings, model notes, notebook export and import
- `assessments.js`, `data/` — real-data tasks with frozen predictions and revealed validation
- `resources.html`, `r/` — course method, primary sources and R materials
- `lesson2-instructor.html`, `lesson2-instructor.js` — teaching notes and held-back references

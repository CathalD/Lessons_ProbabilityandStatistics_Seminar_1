# Probability and statistics seminar 1

A three-hour, observation-led university lesson for empirical scientists. The static website contains short interactive lessons, regular and irregular three-dice experiments, student plotting canvases, function-writing space, locked interval forecasts and ten fresh validation rolls per experiment.

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

The clear reference values are held back during training. The opaque values are revealed for validation only after forecasts are locked. Lesson 2 will introduce non-independence, swapping dice, covariance and Gaussian processes.

Open `instructor.html` for the full 180-minute schedule, reference values, simulator assumptions, physical setup and discussion prompts.

## Student work

- Both physical-data entry and a clearly labelled simulated instrument are available.
- Each experiment has its own dataset, drawings, functions, prediction explanation and reflection.
- Computed plots are optional comparisons; the drawing grids and function fields begin blank.
- Work saves to browser-local storage when available. **Save notebook** exports JSON; **Load notebook** restores it. No student work is sent to a server.
- **Print worksheets** uses the print layout. Text descriptions offer an alternative to pointer drawing.
- Forecast locking freezes training data and forecasts before validation. It is a teaching aid, not secure exam enforcement.
- Only the regular known-model explainer shows theoretical distributions. The irregular student experiment does not reveal its labels or true training distribution.

## Mathematical conventions

Use `P(event)` for probability, `p(x)` for a discrete PMF, `F(x)` for a CDF and `f(x)` for continuous density. Hats mark estimates. Dice are discrete; a normal curve is an approximation, not their exact distribution.

Three ordinary dice have **216 ordered face combinations and 16 possible totals**, not 600 possibilities. Fuzzy measurements estimate the observed distribution. Predicting true outcomes from them requires a measurement assumption; the site makes that limitation explicit.

## Checks

Run `node tests/math.test.js` to check exact dice counts, empirical probabilities, CDF boundaries, binomial normalization and normal probabilities. The browser smoke tests cover both games, prediction locking, ten-roll limits, physical entry and notebook reloads.

## Files

- `index.html` — student lesson and quick visual explanations
- `instructor.html` — seminar plan and teaching notes
- `instructor.js` — held-back simulation references in the instructor view
- `app.js` — notebook, sketches, plots and experiment interaction
- `math.js` — probability calculations shared by plots and tests
- `styles.css` — responsive and print layouts
- `tests/math.test.js` — mathematical regression checks

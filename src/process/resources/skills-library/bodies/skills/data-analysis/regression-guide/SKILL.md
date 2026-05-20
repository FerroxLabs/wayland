---
name: regression-guide
description: |
  Applies regression analysis to a business question. Sets up the regression model, interprets coefficients and p-values in plain language, checks assumption violations, and translates model output into a business recommendation.
  Use when the user wants to predict one variable from others or understand which factors drive an outcome.
  Do NOT use for simple correlation between two variables (use correlation-analysis), A/B test result interpretation (use hypothesis-testing), or chart creation (use chart-type-selector).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis data-science"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Regression Guide

## When to Use

**Use this skill when:**
- User wants to predict a continuous outcome variable from one or more input variables -- e.g., "predict next quarter's revenue from headcount and ad spend," "model customer lifetime value from tenure and product tier," or "explain what drives employee attrition scores"
- User asks "what drives [outcome]?" and the outcome is a measurable quantity (not a category), such as revenue, churn rate, NPS score, time-to-close, defect rate, or unit cost
- User wants to quantify the marginal impact of one factor while holding others constant -- e.g., "how much does each additional support ticket affect satisfaction, controlling for product tier?"
- User has regression output in front of them (coefficients, p-values, R-squared, residual plots) and needs help interpreting what it means in plain business language
- User wants to build a prediction formula -- a concrete equation they can use to forecast a specific outcome given known inputs
- User asks about specific regression diagnostics -- VIF, Durbin-Watson statistic, Cook's distance, Q-Q plots, residual vs. fitted plots -- and needs to know what action to take
- User wants to compare the relative importance of multiple drivers and rank which factors matter most after controlling for the others
- User has run a regression in Excel, Python (statsmodels or scikit-learn), R (lm()), or SPSS and needs help reading the output table

**Do NOT use when:**
- User only wants to know whether two variables move together -- use `correlation-analysis` instead; regression implies directionality and causation framing that is inappropriate for a pure correlation question
- User is interpreting an A/B test, randomized experiment, or comparing two group means -- use `hypothesis-testing`; regression of a binary treatment variable is technically equivalent but the framing and interpretation conventions are different
- User's outcome variable is binary (churned/not churned, purchased/not purchased, approved/denied) -- flag that logistic regression is needed and describe the difference; do not proceed with OLS on a 0/1 outcome because predicted probabilities will fall outside 0-1 and residuals will be non-normal by construction
- User's outcome is a count variable with many zeros (number of support tickets filed, number of purchases in a month) -- flag that Poisson regression or negative binomial regression is more appropriate than OLS
- User wants to produce a chart or visualization of the relationship -- use `chart-type-selector`; this skill focuses on the analytical and interpretive work, not display
- User wants to write production-quality Python or R machine learning code with cross-validation pipelines, feature engineering, and model deployment -- that is software development scope, not regression interpretation
- User wants to analyze survival time or time-to-event outcomes (time until customer cancels, time until equipment failure) -- Cox proportional hazards or accelerated failure time models are the correct tools, not linear regression

---

## Process

### Step 1: Clarify the Regression Question Before Touching Any Data

Before touching data or output, establish four things precisely. Ask the user directly if any of these are unclear.

- **Dependent variable (Y):** What exactly is being predicted or explained? Get the unit of measurement -- monthly revenue in USD, satisfaction score on a 1-10 scale, days to close a deal. The unit determines how to interpret every coefficient.
- **Independent variables (X):** List each candidate predictor and its measurement type. Distinguish continuous variables (spend, age, tenure), ordinal variables (low/medium/high satisfaction), and nominal categorical variables (region, product line, channel). Categorical variables require dummy coding before regression and should not be entered as raw numeric codes (Region = 1, 2, 3 does not mean Region 3 is three times Region 1).
- **Goal -- prediction vs. explanation:** If the goal is to forecast future values of Y, R-squared and prediction intervals matter most, and model parsimony matters less. If the goal is to understand which factors drive Y (explanation/causal inference), coefficient magnitude and significance matter most, and the user should be warned that regression alone cannot prove causation.
- **Sample size and data structure:** Get N (number of rows), confirm each row is an independent observation, and ask whether the data has any nested structure (students within schools, transactions within customers, months within stores) or time-series structure. The minimum guideline is 10-20 observations per independent variable, but 50+ per variable is needed for stable coefficient estimates in multiple regression.

Clarify whether the user already has regression output to interpret, or whether they need to run the regression first. The process differs significantly.

### Step 2: Select the Correct Regression Type

Choose the regression type based on the outcome variable type and the complexity of the relationship. Present the selection logic explicitly to the user.

- **Simple linear regression (OLS):** One continuous Y, one continuous or binary X. Use when the user has a single hypothesized driver and wants a clean, interpretable relationship. The output is a slope and intercept, and the model is Y = b0 + b1*X.
- **Multiple linear regression (OLS):** One continuous Y, two or more Xs. The workhorse for most business questions -- "what drives revenue?" almost always involves multiple factors. Enables controlling for confounders: the coefficient on marketing spend means "the effect of spend holding sales rep count constant."
- **Polynomial regression:** When a scatterplot or residual plot shows a curve -- revenue first increases then decreases with price, efficiency peaks at a certain temperature. Add a squared term (X^2) to the regression. The model becomes Y = b0 + b1*X + b2*X^2. Warn the user that squared terms increase multicollinearity and make coefficients harder to interpret directly.
- **Interaction terms:** When the effect of X1 on Y depends on the level of X2 -- for example, marketing spend has a larger effect on revenue in high-traffic months than in low-traffic months. Add X1*X2 as a variable. Interpreting interaction coefficients requires holding the moderating variable at specific values (typically its mean and mean ± 1 SD).
- **Weighted least squares (WLS):** When some observations are more reliable than others (a store with 10,000 transactions should influence the model more than a store with 50 transactions), or when the variance of residuals increases with a specific variable (heteroscedasticity with a known structure). Weight each observation by 1/variance or by the number of transactions.
- **Ridge and LASSO regression:** When the number of predictors is large relative to sample size, or when multicollinearity is severe. Ridge shrinks all coefficients toward zero without eliminating them -- useful when all predictors likely contribute. LASSO performs variable selection by shrinking some coefficients exactly to zero. These require tuning a regularization parameter (lambda/alpha) and are beyond Excel -- they require Python (sklearn.linear_model.Ridge, Lasso) or R (glmnet). Flag this scope clearly.
- **Flag for logistic regression:** If Y is binary, immediately stop OLS and describe logistic regression: instead of predicting Y directly, it predicts log-odds of Y = 1, which can be converted to probability. Coefficients are log-odds ratios; exponentiated they become odds ratios. This is beyond the scope of this skill but must be named.

### Step 3: Prepare the Data and Run the Regression

Walk the user through data preparation with explicit instructions. Many regression errors originate in data setup, not interpretation.

- **Handle missing values:** Regression drops any row with a missing value in Y or any X by default. Check how many rows are dropped. If more than 10% of observations are missing, imputation may be warranted before running regression. Mean imputation for continuous variables, mode for categorical. Multiple imputation (MICE) is the gold standard but is beyond Excel scope.
- **Encode categorical variables:** For a categorical variable with k categories, create k-1 dummy variables (binary 0/1 columns). The omitted category becomes the reference group. For example, Region (North, South, West) becomes two dummies: South = 1 if South else 0, West = 1 if West else 0. North is the reference. The coefficient on South means "revenue in South minus revenue in North, holding other variables constant." Never include all k dummies -- this causes perfect multicollinearity (the dummy variable trap).
- **Check for outliers before running:** A single outlier with high leverage can pull a regression line dramatically. Compute standardized residuals after running; observations with |standardized residual| > 3 are outliers. Cook's distance > 4/N (where N is sample size) identifies influential observations that have disproportionate impact on coefficient estimates. Flag these and re-run without them to assess sensitivity.
- **Scale variables if needed for interpretation:** If X variables are on very different scales (marketing spend in millions vs. number of emails sent in thousands), standardize them (subtract mean, divide by SD) before entering to produce standardized beta coefficients that are directly comparable in magnitude. Report both unstandardized (for the prediction formula) and standardized (for ranking driver importance).
- **Excel setup instructions:** Data tab > Data Analysis > Regression. Input Y Range: dependent variable column including header. Input X Range: all independent variable columns together (must be contiguous or selected as a block) including headers. Check "Labels." Check "Residuals" and "Residual Plots." Check "Normal Probability Plots." Set Confidence Level to 95%. Select new worksheet for output. The output will contain ANOVA table, coefficient table, and residual plots.

### Step 4: Interpret the Model-Level Output

Always interpret model-level statistics before coefficient-level statistics. The model overall must be evaluated first.

- **R-squared (R2):** The proportion of variance in Y explained by the model. Report as percentage. Context-specific benchmarks matter more than universal rules: R2 of 0.30 is strong for predicting individual human behavior (psychology, HR); R2 of 0.85 is expected for physical process models (manufacturing yield from temperature and pressure). Provide the user with context-appropriate benchmarks, not just "0.7 is good." The correct framing: "The model explains [R2 * 100]% of the variation in [Y]. The remaining [100 - R2*100]% is due to factors not captured in the model."
- **Adjusted R-squared:** Always report alongside R2 for multiple regression. Adjusted R2 penalizes for adding predictors that do not improve fit. If Adjusted R2 is substantially lower than R2 (more than 5 percentage points), the model likely has redundant predictors. If adding a new variable increases R2 but decreases Adjusted R2, that variable is not adding genuine predictive value.
- **F-statistic and its p-value (overall model significance):** Tests the null hypothesis that ALL coefficients are simultaneously zero -- i.e., the model explains no variation. A significant F-test (p < 0.05) means the predictors collectively explain significant variation, even if individual predictors are not significant. A non-significant F-test (p >= 0.05) means the model as a whole does not explain Y -- stop and reassess the variables before interpreting individual coefficients.
- **Root Mean Square Error (RMSE) / Standard Error of the Regression:** The average prediction error in the original units of Y. This is the most practically interpretable model quality metric. If Y is monthly revenue in dollars and RMSE = $42,000, the model's predictions are off by roughly $42,000 on average. Compare RMSE to the mean of Y to get a relative sense: RMSE/mean(Y) = coefficient of variation of predictions. Below 10% is strong, 10-20% is acceptable, above 30% suggests limited practical predictive value.

### Step 5: Interpret Individual Coefficients

Coefficients are the core output for explanation goals. Interpret each one precisely and in business language.

- **Unstandardized coefficient (b):** For a one-unit increase in X, holding all other variables constant, Y changes by b units. Always include "holding all other variables constant" (or "controlling for [list other variables]") in the interpretation -- this is what distinguishes regression from simple correlation and is the key value of multiple regression.
- **Standard error of the coefficient:** Measures precision of the estimate. A coefficient of 5.0 with SE = 0.5 is a tight estimate (±0.5 range); a coefficient of 5.0 with SE = 4.5 is highly uncertain. The 95% confidence interval is approximately coefficient ± (1.96 × SE). Always report the confidence interval alongside the coefficient for business interpretation -- "each additional sales rep adds between $19,000 and $38,000 in monthly revenue" is more useful than a point estimate.
- **t-statistic:** The coefficient divided by its standard error. Absolute values above 2 correspond roughly to p < 0.05 with large samples.
- **p-value for each coefficient:** Tests whether the coefficient is different from zero. p < 0.05 means the predictor is statistically significant at the 95% confidence level. However, significance does not equal importance: a predictor can be statistically significant with a tiny, practically meaningless coefficient (especially with large N), or practically important with p = 0.07 (especially with small N). Always report both statistical significance AND the magnitude of the coefficient.
- **Standardized beta coefficients:** When comparing which variable matters most, use standardized betas (coefficients when all variables are z-scored). The variable with the largest absolute standardized beta is the strongest driver, regardless of original measurement scale. Excel does not produce these directly -- compute manually by running regression on standardized variables or by multiplying each unstandardized coefficient by (SD of Xi / SD of Y).
- **Intercept interpretation:** The predicted value of Y when ALL X variables equal zero. This is often not meaningful in business contexts (a company with zero employees, zero marketing spend, and zero sales reps would have $15,000 monthly revenue -- this is an artifact of the math, not a real scenario). State explicitly when the intercept lacks business meaning.

### Step 6: Check Regression Assumptions

Assumption violations do not just produce warnings -- they produce WRONG answers. Walk through each assumption explicitly. Flag violations clearly.

- **Linearity:** The relationship between each X and Y should be linear after controlling for other Xs. Check with partial regression plots (residuals of Y on X after removing effects of other predictors) or by plotting residuals vs. each fitted X. A curved pattern in residuals indicates non-linearity. Remedies: add polynomial terms (X^2), apply a log transformation to Y or X (log transformation is appropriate when the relationship is multiplicative -- e.g., % change in revenue per % change in spend), or use a non-parametric alternative.
- **Independence of errors (no autocorrelation):** Residuals should not be correlated with each other. This is most commonly violated in time-series data (residuals in adjacent time periods are correlated) and clustered data (students within a school, transactions within a customer). Check using the Durbin-Watson (DW) statistic, available in Excel regression output. DW near 2.0 indicates no autocorrelation; DW below 1.5 indicates positive autocorrelation (under-prediction and over-prediction cluster together); DW above 2.5 indicates negative autocorrelation. Remedy: add a lagged Y variable as a predictor, use Newey-West standard errors, or switch to time-series methods.
- **Homoscedasticity (constant variance of residuals):** The spread of residuals should be consistent across all fitted values. Look at the residual vs. fitted plot: if the residuals form a fan shape (widening as fitted values increase), variance is heteroscedastic. Common causes: revenue data (variance naturally grows with the outcome), proportion data, models missing an important variable. Consequences: coefficient estimates are unbiased but standard errors are wrong, making p-values unreliable. Remedies: transform Y (log(Y) often stabilizes variance for skewed positive data), use weighted least squares, or compute heteroscedasticity-robust standard errors (White standard errors) in R or Python.
- **Normality of residuals:** Residuals should be approximately normally distributed. Check using a Q-Q plot (points should fall on the diagonal reference line) or a histogram of residuals. Minor departures are acceptable, especially with N > 100. Severe departures (heavy tails, strong skew) suggest a transformation of Y is needed or that outliers are present. Note: OLS coefficient estimates are unbiased even with non-normal residuals; the normality assumption primarily affects the validity of p-values and confidence intervals, especially in small samples.
- **No multicollinearity (multiple regression only):** Independent variables should not be highly linearly correlated with each other. Check with pairwise correlation matrix first -- any pair with |r| > 0.80 is a warning sign. The definitive diagnostic is the Variance Inflation Factor (VIF), available in R (vif() in car package), Python (statsmodels variance_inflation_factor), but not natively in Excel. VIF = 1 / (1 - R2_j) where R2_j is the R-squared from regressing predictor j on all other predictors. VIF < 5: acceptable. VIF 5-10: moderate concern. VIF > 10: severe multicollinearity. Consequences: coefficients become unstable (small data changes produce large coefficient swings), standard errors inflate, and p-values become unreliable even though R-squared may be high. Remedies: drop one of the correlated predictors, combine them into an index or ratio, or use Ridge regression.
- **No influential outliers:** Check Cook's distance (> 4/N flags influential points), leverage (hat values > 2*(k+1)/N), and DFFITS. A single observation with extreme values on X (high leverage) and a large residual (high influence) can fundamentally alter every coefficient. Always re-run the regression with and without suspected influential points and report whether conclusions change.

### Step 7: Translate to Business Recommendations

The final step converts statistical output into decisions. This is where most regression reports fail -- they stop at the coefficient table.

- **Lead with the key finding in plain language:** State which variable is the strongest driver (based on standardized beta or coefficient magnitude relative to practical scale), whether the model fit is sufficient for decision-making, and what the main actionable implication is. Do this in two sentences before any tables.
- **Rank drivers explicitly:** List predictors from most impactful to least, using standardized betas or the practical effect size (what happens to Y when X moves from its 25th percentile to its 75th percentile -- the interquartile range effect). The IQR effect is particularly useful: "moving marketing spend from $20K to $60K (25th to 75th percentile) is associated with $128,000 additional revenue, while adding two sales reps (25th to 75th percentile) is associated with $57,000 additional revenue."
- **State the valid prediction range (model scope):** Never extrapolate beyond the range of the training data. Explicitly state the minimum and maximum of each predictor in the dataset. Any prediction using input values outside these ranges is an extrapolation, not an interpolation, and confidence intervals expand dramatically.
- **Quantify uncertainty:** Provide prediction intervals (not just confidence intervals) when the goal is forecasting. A 95% confidence interval captures uncertainty about the mean prediction; a 95% prediction interval captures uncertainty about an individual new observation. Prediction intervals are always wider. In Excel, the regression output provides "predicted Y" and "residual" columns; the prediction interval is approximately predicted Y ± (2 × Standard Error of the Regression).
- **Name the omitted variable risk:** If R-squared is below 0.70, explicitly state that important drivers are not in the model and name plausible omitted variables based on domain context. Low R-squared + significant coefficients does NOT mean those coefficients are wrong -- it means there are other important factors the model does not measure.
- **Caution against causal claims when warranted:** If the data is observational (not from a randomized experiment), coefficients describe associations, not causal effects. Use language like "associated with," "predicts," or "is linked to" rather than "causes" or "drives" unless the research design supports causal language.

---

## Output Format

```
## Regression Analysis Report

### Question
Predicting: [Y variable name] ([units])
Using: [X1 name], [X2 name], [X3 name, ...]
Observations: [N] (after removing [n_dropped] rows with missing data)
Goal: [Prediction / Explanation / Both]

---

### Model Summary

| Metric                   | Value        | Interpretation                                              |
|--------------------------|--------------|-------------------------------------------------------------|
| R-squared                | [0.XX]       | Model explains [XX]% of variation in [Y]                   |
| Adjusted R-squared       | [0.XX]       | Penalized for [k] predictors; [XX]% after adjustment        |
| RMSE (Std Error of Reg.) | [value] [units] | Average prediction error: ±[value] [units]               |
| F-statistic (p-value)    | [value] (p [</>] 0.001) | Overall model is [significant / not significant] |
| Observations used        | [N]          | [n_dropped] dropped due to missing values                  |

Model fit assessment: [Strong / Moderate / Weak -- explain why given domain context]

---

### Coefficient Table

| Variable    | Coeff (b) | Std Error | 95% CI               | t-stat | p-value   | Sig? | Std Beta | Interpretation                                              |
|-------------|-----------|-----------|----------------------|--------|-----------|------|----------|-------------------------------------------------------------|
| Intercept   | [value]   | [value]   | [[lower], [upper]]   | [value]| [value]   | --   | --       | Baseline [Y] when all Xs = 0 [note if not meaningful]      |
| [X1 name]   | [value]   | [value]   | [[lower], [upper]]   | [value]| [value]   | Yes/No | [value] | Each +1 [X1 unit] -> [direction][value] [Y units], controlling for [other Xs] |
| [X2 name]   | [value]   | [value]   | [[lower], [upper]]   | [value]| [value]   | Yes/No | [value] | Each +1 [X2 unit] -> [direction][value] [Y units], controlling for [other Xs] |

---

### Driver Ranking (by Practical Impact)

| Rank | Variable | IQR Effect on [Y] | Std Beta | Significant? |
|------|-----------|--------------------|----------|-------------|
| 1    | [X name]  | Moving from [P25] to [P75] in [X] is associated with [effect] [Y units] | [value] | Yes/No |
| 2    | [X name]  | Moving from [P25] to [P75] in [X] is associated with [effect] [Y units] | [value] | Yes/No |

---

### Prediction Formula

[Y] = [intercept] + ([coeff1] × [X1]) + ([coeff2] × [X2]) + ...

**Valid input ranges (do not extrapolate beyond these):**
- [X1]: [min observed] to [max observed]
- [X2]: [min observed] to [max observed]

**Example prediction:**
If [X1] = [value] and [X2] = [value]:
[Y] = [intercept] + ([coeff1] × [value]) + ([coeff2] × [value]) = [final predicted value] [units]
95% Prediction interval: [[lower bound] to [upper bound]] [units]

---

### Assumption Checks

| Assumption            | Status                       | Diagnostic Used          | Action Required                                 |
|-----------------------|------------------------------|--------------------------|-------------------------------------------------|
| Linearity             | [Met / Likely violated / Uncertain] | Residual vs. fitted plot | [None / Transform X / Add polynomial term]     |
| Independence          | [Met / Likely violated / Uncertain] | Durbin-Watson = [value]  | [None / Add lagged variable / Use robust SE]   |
| Homoscedasticity      | [Met / Likely violated / Uncertain] | Residual vs. fitted plot | [None / Transform Y (log) / Use robust SE]     |
| Normal residuals      | [Met / Likely violated / Uncertain] | Q-Q plot / histogram     | [None / Transform Y / Check outliers]          |
| No multicollinearity  | [Met / Violated / N/A]       | VIF: [X1]=X, [X2]=X      | [None / Drop [X] / Use Ridge regression]       |
| No influential outliers | [Met / Flag rows for review] | Cook's D > [4/N threshold] | [None / Re-run excluding rows [X, Y, Z]]     |

---

### Business Recommendation

**Bottom line:** [One to two sentences stating the key finding in plain language without statistical terms.]

1. **Strongest driver:** [Variable with largest practical impact] -- [plain language effect size with IQR framing]
2. **Secondary driver:** [Variable] -- [plain language effect size]
3. **Non-significant variables:** [List variables with p >= 0.05] -- these do not reliably predict [Y] in this dataset; consider removing them from the model
4. **ROI comparison (if applicable):** [Compare cost of changing X1 vs X2 against predicted revenue or outcome impact]
5. **What the model does not explain:** [100 - R2*100]% of [Y] variation is unexplained. Likely omitted factors: [name 2-3 plausible variables based on domain context]
6. **Caution on causality:** This is [observational / experimental] data. Coefficients describe [associations / causal effects]. [Add any specific confounding risks]
7. **Recommended next step:** [One concrete analytical or operational follow-up action]
```

---

## Rules

1. NEVER present a coefficient as meaningful without first checking that the F-test for the overall model is significant (p < 0.05). A non-significant F-test means the entire coefficient table should be treated with extreme skepticism, regardless of individual p-values.

2. ALWAYS distinguish between statistical significance and practical significance. With N > 1,000, nearly any coefficient will be statistically significant (p < 0.05) even if the effect size is trivially small. With N < 50, a practically large coefficient may have p = 0.08 and still deserve attention. Report both p-values and the magnitude of effect in business units.

3. NEVER interpret coefficients in isolation from assumption checks. A coefficient estimated under severe heteroscedasticity or multicollinearity has wrong standard errors -- the point estimate may be biased or unstable. Always lead with assumption status before coefficient interpretation.

4. For multiple regression, ALWAYS report Adjusted R-squared, not just R-squared. R-squared will increase (or stay the same) every time a variable is added, even if the variable is pure noise. Adjusted R-squared penalizes for model complexity and is the correct metric for comparing models with different numbers of predictors.

5. ALWAYS provide the 95% confidence interval for each coefficient, not just the point estimate. "Marketing spend coefficient = 3.20 (95% CI: 2.32 to 4.08)" tells the user the range of plausible effects and conveys uncertainty that a single number hides.

6. NEVER extrapolate the prediction formula beyond the observed range of the input data. If marketing spend in the dataset ranged from $5K to $80K, explicitly state that predictions for spend values outside this range are not valid. Regression lines can curve dramatically outside the observed range, and the model has no information about those regions.

7. When two or more independent variables have pairwise correlation above 0.80, ALWAYS flag multicollinearity and warn that individual coefficient estimates may be unreliable even if the overall model fit is strong. The symptoms are large standard errors, unexpected sign changes in coefficients, and high sensitivity of coefficients to small changes in the data.

8. For binary (0/1) outcome variables, STOP and redirect to logistic regression. Do not run OLS on a binary Y and then interpret coefficients as probabilities. The predicted probabilities will fall outside 0-1, residuals will be bimodal (not normal), and heteroscedasticity is guaranteed by construction (variance of a Bernoulli variable depends on its mean).

9. When reporting R-squared, ALWAYS anchor the interpretation to domain-specific benchmarks rather than universal rules. R-squared of 0.25 is respectable for predicting individual satisfaction scores (human behavior is inherently variable); R-squared of 0.25 is weak for predicting manufacturing yield from controlled process parameters. Provide the domain context that makes the number meaningful.

10. ALWAYS include a concrete prediction example using the regression equation with real numeric inputs taken from within the valid range. This serves two purposes: it confirms the user knows how to apply the model, and it catches any formula setup errors (wrong coefficient signs, unit mismatches) before the model is used for decisions.

11. When sample size per predictor falls below 10 observations, add a prominent warning: regression coefficients are unstable and may change dramatically with new data. Treat results as directional and preliminary, not definitive.

12. NEVER describe regression as proving causation when the data is observational. Use the language of association consistently ("is associated with," "predicts," "is linked to") unless the data comes from a randomized controlled experiment. Flag specific confounding variables that could explain the relationship if known from domain context.

---

## Edge Cases

### User has time-series data (monthly revenue over 36 months, daily website visits)

Standard OLS assumes observations are independent. Time-series data violates this because this month's revenue is correlated with last month's revenue (autocorrelation). Consequences: R-squared is artificially inflated, standard errors are too small, and p-values overstate significance. Detection: the Durbin-Watson statistic from Excel regression output. Values below 1.5 signal positive autocorrelation, above 2.5 signal negative autocorrelation.

Recommended handling: First, add a lagged dependent variable as a predictor (add a column for "Revenue, 1 month prior" and include it as an X variable). This absorbs much of the autocorrelation. Check DW again after adding the lag. If severe autocorrelation persists, explicitly flag that the user needs time-series methods -- ARIMA, exponential smoothing, or a regression with Newey-West robust standard errors. These are beyond Excel's native capability. Do not pretend that OLS with time-series data produces reliable p-values without addressing this.

### R-squared is above 0.95 with business data

Very high R-squared in non-physical-process business models is a red flag before it is a success. Investigate three causes before celebrating.

First, check for a near-tautological relationship: if Y = total revenue and one X = units sold while another X = price per unit, then Y ≈ X1 × X2 by definition, and the regression is measuring arithmetic, not an economic relationship.

Second, check for a lagged Y included as a predictor without acknowledgment -- if "last month's revenue" is in the X variables, it will dominate all other predictors by carrying over autocorrelation.

Third, check the ratio of predictors to observations. With 20 predictors and 25 observations, the model can achieve R-squared near 1.0 by memorizing the data (overfitting). In this case, Adjusted R-squared will be much lower than R-squared and may even be negative. Flag overfitting explicitly and recommend either reducing predictors or collecting more data.

### All individual p-values are above 0.05 but the F-test is significant

This is a classic symptom of multicollinearity among the predictors. The model collectively explains significant variation, but no individual predictor can claim credit because their contributions are shared. The coefficients are statistically unstable -- slight changes to the data would redistribute explanatory power among the correlated predictors.

Handle this by: (1) reporting the multicollinearity diagnosis explicitly and computing pairwise correlations among all predictors, (2) identifying which predictors are most collinear, (3) recommending either dropping one predictor from each correlated pair or using Ridge regression to stabilize the coefficients, (4) noting that even if individual p-values are non-significant, the model as a whole may still produce useful predictions -- just not reliable coefficient interpretations.

### User has a very small sample (N < 30)

Regression with fewer than 30 observations produces coefficient estimates that are likely unstable and confidence intervals that are very wide. The Central Limit Theorem has not yet ensured approximate normality of sampling distributions, so the t-tests and F-tests depend more heavily on the normality assumption for residuals.

Recommended handling: Run the regression and report results, but add a mandatory caveat section: "With [N] observations and [k] predictors, this model has [N-k-1] degrees of freedom. Coefficient estimates are preliminary and may change substantially with additional data. Treat findings as hypothesis-generating, not decision-grade. A minimum of [10k+] observations is recommended before acting on these coefficients with confidence." Do not suppress the analysis entirely -- even preliminary results can guide data collection. But do not let the user mistake preliminary findings for validated conclusions.

### User wants to compare the importance of predictors measured in different units

When predictors are on different scales (marketing spend in thousands of dollars vs. number of emails sent vs. customer tenure in months), raw coefficients cannot be compared to rank importance. A coefficient of 0.003 on spend (in dollars) is not smaller in importance than a coefficient of 15 on email count -- it depends on the range of each variable.

Recommended handling: Compute standardized beta coefficients by multiplying each unstandardized coefficient by (SD of Xi / SD of Y). This expresses each coefficient in terms of standard deviations of Y per standard deviation of Xi. Alternatively, compute the IQR effect: multiply each coefficient by the IQR of its predictor (75th percentile minus 25th percentile). This shows the expected change in Y when each predictor moves across its real-world observed range. Present both in a driver ranking table and explain which predictor produces the largest practical change in Y.

### User has categorical predictors with more than two categories (e.g., Region: North/South/East/West, or Product tier: Bronze/Silver/Gold/Platinum)

Categorical variables with k > 2 categories require dummy coding -- creating k-1 binary indicator variables and dropping one category as the reference group. Users frequently make two errors: (1) entering the category as a numeric code (North=1, South=2, East=3, West=4) which implies a linear ordering that does not exist, or (2) including all k dummies which causes perfect multicollinearity (the dummy variable trap, making the matrix inversion undefined).

Walk the user through creating dummy variables explicitly. For a variable with 4 regions, create 3 columns: Is_South (1 if South, 0 otherwise), Is_East (1 if East, 0 otherwise), Is_West (1 if West, 0 otherwise). North is the omitted reference category. Interpret each dummy coefficient as "the difference in Y between [category] and [reference category], holding other variables constant." If the user is using R, note that factor() handles this automatically. In Python pandas, pd.get_dummies(drop_first=True) produces k-1 dummies correctly.

### Residuals show a clear funnel shape (heteroscedasticity) in the residual vs. fitted plot

Heteroscedasticity means the variance of prediction errors is not constant -- it grows (or shrinks) systematically with fitted values or with a specific predictor. This is extremely common in revenue, sales, and financial data because larger values naturally have larger absolute variation. The consequence is that all standard errors, confidence intervals, and p-values are wrong, even though the coefficient point estimates are still unbiased.

Remediation steps in order of preference: First, apply a log transformation to Y: regress log(Y) on X variables. This is appropriate when Y is positive and right-skewed (revenue, prices, response times). Coefficients from a log-Y model are interpreted as percentage changes: a coefficient of 0.05 on X means each 1-unit increase in X is associated with a 5% increase in Y. Second, use heteroscedasticity-robust standard errors (White's correction) -- available in R (coeftest with HC3 standard errors from the sandwich package) and Python (statsmodels OLS().fit(cov_type='HC3')). This corrects the standard errors without changing the coefficient estimates. Third, use weighted least squares if the source of heteroscedasticity is known (e.g., weight by sample size for aggregate data).

---

## Example

**Input:** "I manage a SaaS product. I have 200 customer records. I want to understand what predicts annual contract value (ACV). My variables are: number of seats purchased (5 to 500), customer industry (Tech, Finance, Healthcare, Other), months since account created (1 to 48), and number of support tickets in year 1 (0 to 45). ACV ranges from $10,000 to $850,000."

**Output:**

---

## Regression Analysis Report

### Question
Predicting: Annual Contract Value -- ACV ($)
Using: Seats purchased, Industry (3 dummies vs. "Other" reference), Account age (months), Support tickets (year 1)
Observations: 200 (0 dropped -- no missing data detected)
Goal: Explanation -- identify which factors drive ACV to inform pricing and customer success strategy

---

### Data Preparation Notes

The Industry variable has 4 categories (Tech, Finance, Healthcare, Other). Three dummy variables were created:
- Is_Tech: 1 if Tech, 0 otherwise
- Is_Finance: 1 if Finance, 0 otherwise
- Is_Healthcare: 1 if Healthcare, 0 otherwise
Reference category: Other. All Industry coefficients are interpreted as "difference vs. Other industry customers."

Total independent variables in model: 6 (Seats, Is_Tech, Is_Finance, Is_Healthcare, Account Age, Support Tickets)
Minimum recommended observations: 60 (10 per predictor). Actual: 200. Sample size is adequate.

---

### Model Summary

| Metric                   | Value          | Interpretation                                                    |
|--------------------------|----------------|-------------------------------------------------------------------|
| R-squared                | 0.81           | Model explains 81% of variation in ACV                          |
| Adjusted R-squared       | 0.80           | Strong fit after penalizing for 6 predictors                     |
| RMSE (Std Error of Reg.) | $52,400        | Average prediction error: ±$52,400                              |
| F-statistic (p-value)    | 138.4 (p < 0.001) | Overall model is highly significant                           |
| Observations used        | 200            | No rows dropped                                                  |

Model fit assessment: Strong. R-squared of 0.81 is high for a B2B SaaS ACV model, where seat count and industry segment typically do explain a large share of contract value. RMSE of $52,400 is approximately 11% of mean ACV (estimated ~$480,000), indicating predictions are accurate within about ±11% on average -- acceptable for strategic planning but not for individual deal pricing.

---

### Coefficient Table

| Variable       | Coeff (b)  | Std Error | 95% CI                   | t-stat | p-value  | Sig? | Std Beta | Interpretation                                                                 |
|----------------|------------|-----------|--------------------------|--------|----------|------|----------|--------------------------------------------------------------------------------|
| Intercept      | $42,000    | $18,500   | [$5,700, $78,300]        | 2.27   | 0.024    | Yes  | --       | Baseline ACV for "Other" industry, 0 seats, 0 months, 0 tickets (not meaningful on its own) |
| Seats          | $1,380     | $95       | [$1,193, $1,567]         | 14.5   | < 0.001  | Yes  | 0.72     | Each additional seat is associated with $1,380 more ACV, controlling for other variables |
| Is_Tech        | $85,000    | $22,000   | [$41,700, $128,300]      | 3.86   | < 0.001  | Yes  | 0.18     | Tech industry customers have $85,000 higher ACV than "Other" customers, controlling for seats and tenure |
| Is_Finance     | $110,000   | $25,500   | [$59,800, $160,200]      | 4.31   | < 0.001  | Yes  | 0.21     | Finance industry customers have $110,000 higher ACV than "Other" customers |
| Is_Healthcare  | $38,000    | $27,000   | [$−15,100, $91,100]      | 1.41   | 0.161    | No   | 0.07     | Healthcare vs. Other difference is not statistically significant at 95% confidence |
| Account Age    | $3,200     | $680      | [$1,865, $4,535]         | 4.71   | < 0.001  | Yes  | 0.22     | Each additional month of account tenure is associated with $3,200 higher ACV |
| Support Tickets| −$4,800    | $1,100    | [−$6,960, −$2,640]       | −4.36  | < 0.001  | Yes  | −0.19    | Each additional support ticket in year 1 is associated with $4,800 lower ACV |

---

### Driver Ranking (by Practical Impact -- IQR Effect on ACV)

| Rank | Variable        | IQR (P25 to P75)    | IQR Effect on ACV                               | Std Beta | Significant? |
|------|-----------------|---------------------|-------------------------------------------------|----------|-------------|
| 1    | Seats           | 30 to 180 seats     | Moving from 30 to 180 seats is associated with $207,000 more ACV | 0.72 | Yes |
| 2    | Account Age     | 8 to 36 months      | Moving from 8 to 36 months is associated with $89,600 more ACV  | 0.22 | Yes |
| 3    | Is_Finance      | n/a (binary)        | Finance customers average $110,000 more ACV than "Other"         | 0.21 | Yes |
| 4    | Support Tickets | 3 to 22 tickets     | Moving from 3 to 22 tickets is associated with $91,200 less ACV  | −0.19 | Yes |
| 5    | Is_Tech         | n/a (binary)        | Tech customers average $85,000 more ACV than "Other"             | 0.18 | Yes |
| 6    | Is_Healthcare   | n/a (binary)        | $38,000 difference vs. "Other" -- not statistically significant  | 0.07 | No |

---

### Prediction Formula

ACV = $42,000 + ($1,380 × Seats) + ($85,000 × Is_Tech) + ($110,000 × Is_Finance) + ($38,000 × Is_Healthcare) + ($3,200 × Account Age) + (−$4,800 × Support Tickets)

**Valid input ranges (do not extrapolate beyond these):**
- Seats: 5 to 500
- Account Age: 1 to 48 months
- Support Tickets: 0 to 45

**Example prediction:**
Finance industry customer, 120 seats, 24 months tenure, 8 support tickets:
ACV = $42,000 + ($1,380 × 120) + ($110,000 × 1) + ($3,200 × 24) + (−$4,800 × 8)
ACV = $42,000 + $165,600 + $110,000 + $76,800 − $38,400
ACV = $356,000

95% Prediction interval: approximately $356,000 ± (2 × $52,400) = [$251,200 to $460,800]

Note: The prediction interval is wide relative to the point estimate, reflecting genuine variability in customer contracts even after controlling for the model's predictors. Use the point estimate for directional planning and the interval for deal-level uncertainty communication.

---

### Assumption Checks

| Assumption            | Status            | Diagnostic Used                      | Action Required                                                         |
|-----------------------|-------------------|--------------------------------------|-------------------------------------------------------------------------|
| Linearity             | Uncertain         | Residual vs. fitted plot             | Check whether ACV vs. Seats shows curvature -- very large seat counts may have a nonlinear premium. Consider adding Seats^2 if residuals fan out for high-seat accounts. |
| Independence          | Met               | Durbin-Watson = 1.94                 | No autocorrelation detected. Observations are independent customer contracts. |
| Homoscedasticity      | Likely violated   | Residual vs. fitted plot -- possible fan shape at high ACV values | High-ACV contracts tend to have more variable pricing. Recommended: re-run with log(ACV) as the outcome or compute HC3 robust standard errors. Monitor whether significance conclusions change. |
| Normal residuals      | Approximately met | Q-Q plot shows mild right-skew in tails | With N=200, mild non-normality has minimal impact on p-values. If homoscedasticity is addressed via log transformation, residuals will also normalize. |
| No multicollinearity  | Acceptable        | Seats VIF=2.1, Age VIF=1.8, Tickets VIF=1.9, Industry dummies VIF=1.4-1.6 | All VIFs below 5. No multicollinearity concern. |
| No influential outliers | Flag for review | Cook's D > 0.02 (threshold: 4/200): 4 observations flagged (rows 17, 89, 134, 178) | Re-run model excluding these 4 rows and verify that conclusions remain stable before acting on findings. |

---

### Business Recommendation

**Bottom line:** Seat count is by far the strongest predictor of ACV, but industry segment and account tenure are meaningful secondary drivers -- and high support ticket volume is a significant negative predictor of contract value, suggesting that problematic implementations correlate with smaller or lower-value contracts.

1. **Strongest driver -- Seats:** Each additional seat adds $1,380 to ACV. Moving from a 30-seat to a 180-seat account corresponds to $207,000 more ACV. Seat expansion is the highest-leverage growth lever in this dataset.

2. **Industry premium:** Finance customers carry a $110,000 ACV premium over "Other" industry customers; Tech customers carry an $85,000 premium. Healthcare's $38,000 premium is not statistically reliable. Pricing strategy and customer acquisition investment should reflect these premiums. Finance customers warrant higher customer success investment and longer sales cycles.

3. **Tenure effect -- upsell signal:** Each additional month of account tenure adds $3,200 to ACV. Over 36 months, this accumulates to approximately $115,200 in incremental ACV. This is consistent with users expanding seat counts over time, but it also suggests that retention directly supports revenue growth beyond simple contract renewal.

4. **Support ticket risk signal:** Each support ticket in year 1 is associated with $4,800 less ACV. A customer with 20 tickets versus one with 5 tickets has an expected ACV that is $72,000 lower. This likely reflects a selection effect (customers with complex, poorly-fitting implementations buy fewer seats and have lower satisfaction), but it warrants investigation. Customer success teams should monitor year-1 ticket volume as a leading indicator of at-risk ACV.

5. **What the model does not explain:** 19% of ACV variation is unexplained. Plausible omitted variables include: negotiated discounts and pricing exceptions (not captured as a model input), specific product modules purchased, deal origination channel (direct vs. partner), and champion seniority within the account. Collecting these variables would likely increase model explanatory power.

6. **Caution on causality:** This is observational data. The coefficient on support tickets does not prove that reducing support tickets causes ACV to increase -- both may be driven by a third factor (implementation quality, use case fit). Avoid telling the team to suppress support tickets to raise ACV. Investigate the mechanism before taking action.

7. **Assumption follow-up -- priority action before decision use:** Heteroscedasticity in the residuals may slightly inflate standard errors for high-ACV predictions. Re-run the model using log(ACV) as the outcome and verify that the five significant predictors remain significant and directionally consistent. If they do, the conclusions are robust. Report the unstandardized results from the log model as percentage effects: "each additional seat is associated with a X% increase in ACV."

8. **Recommended next step:** Check the 4 flagged influential observations (rows 17, 89, 134, 178). If these are legitimate records (not data entry errors), re-run the model without them and compare coefficients. If the Seats and Support Ticket coefficients change by more than 15%, segment the model -- one version for standard accounts, one for outlier-scale enterprise contracts.

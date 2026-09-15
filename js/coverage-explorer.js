(() => {
  'use strict';
  const { invNorm, pdf } = window.NormVizStatistics;
  const get = id => document.getElementById(id);
  const input = get('coverage-input');
  const buttons = [...document.querySelectorAll('[data-coverage]')];
  const modeButtons = [...document.querySelectorAll('[data-coverage-mode]')];
  let mode = 'uncertainty';
  const X = z => 24 + (z + 3.6) / 7.2 * 592;
  const Y = z => 178 - pdf(z) / pdf(0) * 150;
  const percent = value => `${Number(value.toFixed(4))}%`;
  function highlightPhrases(id, phrases) {
    const element = get(id);
    let parts = [element.textContent];
    for (const phrase of phrases) {
      parts = parts.flatMap(part => {
        if (typeof part !== 'string' || !part.includes(phrase)) return [part];
        const index = part.indexOf(phrase);
        const highlight = document.createElement('span');
        highlight.className = 'yellow-text';
        highlight.textContent = phrase;
        return [part.slice(0, index), highlight, part.slice(index + phrase.length)];
      });
    }
    element.replaceChildren(...parts);
  }
  function explain(p, z) {
    const titles = {
      uncertainty: 'What this means for uncertainty',
      unusualness: 'What this means for unusual values',
      null: 'What this means for a two-sided z-test'
    };
    get('coverage-conclusion-title').textContent = titles[mode];
    get('coverage-example').hidden = mode !== 'uncertainty' || !Number.isFinite(p) || p < 0 || p > 100;
    let area, action, caution;
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      area = 'Enter a percentage from 0 to 100 to see what the shaded areas mean.';
      action = caution = '';
    } else {
      const middle = percent(p), outside = percent(100 - p), tail = percent((100 - p) / 2);
      const cutoff = Number.isFinite(z) ? z.toFixed(3) : '∞';
      if (mode === 'uncertainty') {
        get('coverage-example-result').textContent = p === 100
          ? '100% confidence requires an interval from −∞ to +∞, so there is no finite range.'
          : `${middle} confidence interval: 20 ± ${cutoff} × 2 ≈ ${(20 - z * 2).toFixed(2)} to ${(20 + z * 2).toFixed(2)} minutes.`;
        area = `A confidence interval turns uncertainty into a range around your estimate. Purple represents the ${middle} of estimation errors small enough for the resulting interval to cover the true average. The gray tails represent the ${outside} large enough for it to miss, split into ${tail} on each side.`;
        action = `Imagine repeating the study many times and making a new interval each time. About ${middle} of those intervals would cover the true average, assuming the normal approximation is appropriate. Increasing the selected percentage widens the interval: you gain coverage by accepting a less precise range.`;
        caution = 'This range describes uncertainty about the average, not the spread of individual walking times. Use the estimate’s standard error (SE), not the observations’ standard deviation. The method assumes approximately standard normal estimation errors and negligible bias. The confidence level describes how often the method works across repeated studies, not the probability that this one interval contains the true average.';
        if (p === 0) action = 'At 0%, the interval collapses to the estimate. With a continuous normal error model, it has zero coverage.';
        if (p === 100) action = 'At 100%, the interval extends from −∞ to +∞. Full coverage gives no finite precision.';
      } else if (mode === 'unusualness') {
        area = `Purple leaves ${middle} of observations unflagged. Gray flags ${outside} in total: ${tail} below the lower boundary and ${tail} above the upper boundary.`;
        action = `Flag observations more than ${cutoff} standard deviations from the average. Even with a correct normal model, about ${outside} of ordinary observations fall outside this range. A flag means “worth checking,” not “definitely wrong.”`;
        caution = 'Use the observations’ standard deviation (SD), not SE. Skewed or heavy-tailed data can produce very different flag rates.';
        if (p === 0) action = 'At 0%, every observation except one exactly at the average is flagged. In a continuous normal model, that means effectively all observations.';
        if (p === 100) action = 'At 100%, the boundaries are infinite, so no finite observation is flagged.';
      } else {
        area = `If the null hypothesis is true, purple contains ${middle} of z-statistics. The gray rejection regions total ${outside}, with ${tail} in each tail. That total is the significance level, α.`;
        action = `Reject the null when the observed z-statistic is below −${cutoff} or above +${cutoff}. Inside the purple range, do not reject it. With a valid standard normal null model, this rule falsely rejects about ${outside} of the time.`;
        caution = 'These controls set a decision threshold, not an observed p-value or a result for your study. A two-sided p-value uses both tails beyond your observed |z|. Not rejecting the null does not prove it true.';
        if (p === 0) action = 'At 0%, the rejection threshold is zero: every nonzero z-statistic rejects the null. The false-positive rate is 100% under the continuous normal null model.';
        if (p === 100) action = 'At 100%, the rejection thresholds are infinite. No finite z-statistic rejects the null; the significance level is 0%.';
      }
    }
    get('coverage-conclusion-area').textContent = area;
    get('coverage-conclusion-action').textContent = action;
    get('coverage-conclusion-caution').textContent = caution;
    if (mode === 'uncertainty' && Number.isFinite(p) && p >= 0 && p <= 100) {
      highlightPhrases('coverage-example-result', ['confidence interval']);
      highlightPhrases('coverage-conclusion-area', ['confidence interval', 'uncertainty into a range around your estimate']);
      highlightPhrases('coverage-conclusion-action', [`${percent(p)} of those intervals would cover the true average`]);
    }
  }
  function curve(lo, hi) {
    const points = [];
    for (let i = 0; i <= 240; i++) {
      const z = lo + (hi - lo) * i / 240;
      points.push(`${i ? 'L' : 'M'} ${X(z)} ${Y(z)}`);
    }
    return points.join(' ');
  }
  function area(lo, hi) {
    if (lo === hi) return '';
    return `${curve(lo, hi)} L ${X(hi)} 178 L ${X(lo)} 178 Z`;
  }
  get('coverage-total').setAttribute('d', area(-3.6, 3.6));
  get('coverage-outline').setAttribute('d', curve(-3.6, 3.6));
  for (let z = -3; z <= 3; z++) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', X(z));
    label.setAttribute('y', '202');
    label.textContent = z > 0 ? `+${z}` : String(z);
    get('coverage-ticks').append(label);
  }
  function update() {
    const p = input.valueAsNumber;
    const valid = Number.isFinite(p) && p >= 0 && p <= 100;
    get('coverage-error').hidden = valid;
    input.setAttribute('aria-invalid', String(!valid));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(valid && Number(button.dataset.coverage) === p)));
    if (!valid) {
      ['coverage-middle', 'coverage-boundaries'].forEach(id => get(id).setAttribute('d', ''));
      ['coverage-middle-value', 'coverage-z', 'coverage-tail', 'coverage-outside'].forEach(id => get(id).textContent = '—');
      get('coverage-plot-description').textContent = 'Enter a valid percentage to shade the curve.';
      get('coverage-note').textContent = 'Choose a percentage or use a preset to explore the areas.';
      explain(p);
      return;
    }
    const z = p === 0 ? 0 : -invNorm((1 - p / 100) / 2);
    explain(p, z);
    const edge = Math.min(z, 3.6);
    const boundary = Number.isFinite(z) ? `±${z.toFixed(3)}` : '±∞';
    get('coverage-middle').setAttribute('d', area(-edge, edge));
    const markers = z <= 3.6
      ? [-z, z].map(v => `M ${X(v)} 178 L ${X(v)} ${Y(v)}`).join(' ')
      : 'M 46 165 H 24 L 30 160 M 24 165 L 30 170 M 594 165 H 616 L 610 160 M 616 165 L 610 170';
    get('coverage-boundaries').setAttribute('d', markers);
    get('coverage-middle-value').textContent = percent(p);
    get('coverage-z').textContent = boundary;
    get('coverage-tail').textContent = percent((100 - p) / 2);
    get('coverage-outside').textContent = percent(100 - p);
    get('coverage-plot-description').textContent = `Middle ${percent(p)}, z-boundaries ${boundary}, ${percent((100 - p) / 2)} in each tail, ${percent(100 - p)} outside in total.`;
    get('coverage-note').textContent = p === 100
      ? '100% requires infinite boundaries. The arrows show that the curve continues beyond this view.'
      : z > 3.6
        ? `The boundaries at ${boundary} extend beyond this view (−3.6 to +3.6).`
        : p === 0
          ? 'At 0%, the boundaries meet at the mean. Each half of the curve holds 50%.'
          : `The middle ${percent(p)} leaves ${percent(100 - p)} outside. Increasing coverage widens the interval and shrinks both tails.`;
  }
  input.addEventListener('input', update);
  modeButtons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.coverageMode;
    modeButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update();
  }));
  buttons.forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.coverage;
    update();
  }));
  update();
})();

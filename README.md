# NormViz

**Statistics make more sense when you can actually see them.**

Explore the same percentage as a shaded bell curve and a pie chart. Enter **75 out of 100** to see how much of the whole it represents, how far the middle 75% of a normal distribution reaches from the average, and how it compares with the familiar 68%, 95%, and 99.7% ranges.

**[Try NormViz](https://archipelagoing.github.io/NormViz/)**


![site screenshot](Screenshot.png)

*Site screenshot*

## What you can explore

- **Two connected charts:** a bell curve and a pie chart styled as a sewing button, both updating as you type.
- **A measuring-tape scale:** see distance from the average in standard-deviation units.
- **Your results explained:** central percentage, boundaries, percentage in each tail, and the closest 68–95–99.7 reference.
- **A visual area bar:** connect the purple middle and the two tails to shares of the whole.
- **Plain-language guides:** learn what the curve’s shape tells you, how it complements a pie chart, and how to interpret percentages in daily life.

## How to use it

1. Enter a nonnegative **Part** and a positive **Whole**, with Part no greater than Whole.
2. Compare the purple share of the pie with the purple area under the bell curve.
3. Read the explanation below the charts, then change the fraction to see how the boundaries move.

For **75 / 100**, the central area is **75%**, its boundaries are approximately **−1.150σ and +1.150σ**, and each tail contains **12.5%**. Here, σ means one standard deviation—a measure of spread around the average.

Try **68 / 100**, **95 / 100**, and **99.7 / 100**. Notice how including more of the distribution moves the boundaries farther from the average.

The charts and three-column guides stay side by side. On very narrow screens, scroll horizontally within those sections.

## What the percentage means

NormViz maps your fraction to a **symmetric central area of a standard normal distribution**. It does not calculate your percentile rank or the z-score of an observed score. Entering 75 / 100 selects the middle 75%; it does not establish whether a score of 75 is above average.

Applying this model to real measurements requires knowing their average and spread, and checking whether a bell curve is a reasonable fit.

At **0%**, the interval has zero width. At **100%**, its boundaries are infinite. The chart displays only **−3.6σ to +3.6σ**, so larger intervals extend beyond the visible range.

## Run locally

Open `index.html` in your browser. No installation, external libraries, or build step is required. The site uses HTML, CSS, JavaScript, and the browser’s Canvas API.

## Project structure

```text
NormViz/
├── index.html          # Page structure, inputs, and educational guides
├── bell.png            # Favicon and temporary README image
├── css/
│   └── style.css       # Styling and responsive layout
├── js/
│   ├── statistics.js   # Normal density and inverse normal calculations
│   └── visualizer.js   # Input validation, charts, and dynamic explanations
├── README.md
├── LICENSE
└── .gitignore
```

## License

Apache License 2.0. See [LICENSE](LICENSE).

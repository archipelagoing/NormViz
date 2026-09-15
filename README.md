# NormViz
Visualize any percentage on a bell curve and learn what its standard deviation and z-score tell you about how far it is from average.
----------------------------------------

**Statistics make more sense when you can actually see them.**

NormViz turns percentages and fractions into an interactive bell curve so you can see what the numbers really mean. Enter something as simple as **75 out of 100**, and NormViz instantly shows where that 75% falls on a normal distribution, how far it reaches from the average, and how it compares with the familiar 68%, 95%, and 99.7% ranges.

Along the way, NormViz makes concepts like **standard deviation** and **z-scores** easier to understand. Standard deviation tells you how far values typically spread from the average, while a z-score tells you exactly how far a particular point is from that average in standard-deviation units.

Why does that matter? These ideas show up everywhere, from test scores and grades to research, measurements, probability, data science, and everyday comparisons. They help answer a simple question: **Is this result typical, or is it unusual?**

Instead of memorizing formulas or trying to imagine what “1.5 standard deviations from the mean” looks like, **see it for yourself with NormViz.**

## Run locally

Open `index.html` in your browser. No dependencies or build step are required.

Enter a nonnegative **Part** and a positive **Whole**, with Part no greater than Whole. The shaded region is the symmetric central area of a standard normal distribution, not a percentile rank or a z-score inferred from observed data. For example, 75 / 100 corresponds to an area of 75% between approximately −1.150σ and +1.150σ.

At 0%, the interval has zero width. At 100%, its boundaries are infinite. The chart shows only −3.6σ through +3.6σ.

A pie chart beside the bell curve shows the same percentage as a portion of the whole, with the remainder in gray. Both charts update as you type and stay side by side; on very narrow screens, scroll horizontally within the chart section.

A guide underneath explains the selected area, boundaries, and tails in plain language. Its summary and area strip update with your input, alongside an introduction to averages, standard deviations, and when a normal model is useful.

## Project structure

```text
normal-distribution-visualizer/
├── index.html          # Page structure and inputs
├── css/
│   └── style.css       # Styling and responsive layout
├── js/
│   ├── statistics.js   # Normal density and inverse normal calculations
│   └── visualizer.js   # Input validation, results, and canvas drawing
├── README.md
├── LICENSE
└── .gitignore
```

## License

Apache License 2.0. See [LICENSE](LICENSE).

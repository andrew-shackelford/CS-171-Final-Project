# CS 171 Final Project

### Hanna Kim,  Jennifer Lee,  Sarah Lucioni,  Andrew Shackelford

## Abstract

We aim to help our readers understand both the common features of Reddit comments and how Reddit has evolved over time. As “the front page of the internet,” Reddit represents a vast, (relatively) diverse group of users, with popular subreddits about technology, relationships, sports, cooking, politics, and many more topics — not to mention some more unsavory ones. Our main goal for the final project is to create a unique, informative site that helps provide both context and new insights into the vast database that is Reddit by showcasing a 24 hour snapshot of Reddit.

## Deliverables

### Code

Our code is split up into `implementation` and `preprocessing`.

The `preprocessing` folder contains our filtered data as well as files we wrote to clean and wrangle our data. Within `preprocessing`, `filtered_data` contains our cleaned and filtered data. `original_data` includes a link to a google drive folder containing our unfiltered data as well as a Python script written to help break down the original data into more manageable chunks. The `sentiment` folder contains files written and used to help analyze the sentiment of the Reddit comments.

The `implementation` folder contains the main files for our website. These files include `index.html`, `style.css`, and `main.js` which are our main *HTML*, *CSS*, and *JS* files.

The `css` folder also contains a `bootstrap.min`, `font-awesome.min`, and `jquery.pagepiling.min`. These are three libraries we used. We used [bootstrap](https://getbootstrap.com) to help our website design, [font-awesome](https://fontawesome.com) to include icons, and [pagepiling](https://alvarotrigo.com/pagePiling/) to create a unique flow for our website.

The `data` folder contains the filtered data that we used for our visualizations. `hourly_stats.json` is used for the aster plot visualization, `sentiment.json` is used for the bubble chart, sentiment visualization, `top25Stats.json` is used for the treemap visualization, and `word_counts.json` is used for the word cloud visualization. The `fonts` folder contains necessary files for the Font-Awesome library to function correctly. The `img` folder contains some of the images that we display on our website.

Finally, the `js` folder contains the most of our work. `bootstrap.min`, `colorbrewer`, `d3-color.v1.min`, `d3-interpolate.v1.min`, `d3-scale-chromatic`, `d3.layout.cloud`, `d3.min`, `jquery.min`, `jquery.pagepiling.min`, `lodash.min`, and `popper.min` are all files from libraries. We also used the `d3-tip` file provided in class for tooltips. `asterplot.js` includes the code to create the aster plot visualization. `cover.js` includes the code to create the front page of our website. `sentiment.js` includes the code to create the bubble chart, sentiment visualization. `treemap.js` includes the code to create the treemap visualization. `wordcloud.js` includes the code to create the word cloud visualization. Finally, `main.js` initializes each visualization.

### Screencast
- URL: https://youtu.be/DZ3_P5iStzw

### Website

- URL: [A 24 hour snapshot of Reddit](https://cs-171.herokuapp.com)
- Website features:
  - Coordinated views
    - The orange words throughout our website coordinate the trend being discussed to the relevant visualization. These coordinated words help highlight the trend at hand. The words also help add structure to the visualizations by emphasizing the important aspects of the story being told.  

  - **Aster Plot**
    - Select box changes the data being displayed. The options are *number of comments*, *average controversiality*, and *average score*.
    - Click on a leaf to update the values in the table displayed on the right.
    - Tooltips display more numerical information.

  - **Tree Map**
    - Select one of four options to color the treemap. The options are *average score*, *top score*, *low score*, and *controversiality*. The range of values is shown on the legend.
    - Click on a tile to switch the view and learn more about the selected subreddit. Select another subreddit in this updated view or press the back button to return to the treemap view.
    - Tooltips display more numerical information.

  - **Sentiment Bubble Chart**
    - Play the visualization to see how the sentiment of subreddits fluctuates throughout a day or select a certain hour to see a static representation.
    - The position left to right as well as the color (light to dark) encodes the subreddit's sentiment on a negative to positive scale. The size of the bubbles indicates the number of comments at the selected hour.
    - Tooltips display more numerical information.

  - **Word Cloud**
    - Select one of the top 25 subreddits to view the most commonly used words.
    - Hover over a word to view the amount of times it appeared in the selected subreddit.

### Process Book

- URL: [Visualizing the Front Page of the Internet Process Book](https://docs.google.com/document/d/17VXtrHadIFLPlpGYlRNSiJath0dL3Y4PNc5ZZ_-jYQM/edit?usp=sharing)

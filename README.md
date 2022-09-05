# PhyloDiff
PhyloDiff is a library that extends [Phylo.io](https://github.com/DessimozLab/phylo-io/tree/refactor/) and is suitable for users to efficiently compare a
pair of two phylogenetic trees. Another feature of this library is the ability to easily add new
comparison measures to it, by providing an object to it, with mandatory and non-mandatory
properties.

## Demo
Videos with some demonstrations of our application are available [here](https://beta.phylo.io/).

## Quick Start
**Local build:** You can build the package using the following command
```bash
npm run-script build
```
Then, you just to need open our application file available at 
[phylodiff/Examples/Website/phyloio.html](https://github.com/franciscoludovico/phylodiff/blob/main/Examples/Website/phyloio.html)
and drag it to your favorite browser.

## Adding new comparison measures: 
To add new comparison measures to our library, simply head over to the file available at [phylodiff/blob/metric_modules/lookup-test.js](https://github.com/franciscoludovico/phylodiff/blob/main/src/metric_modules/lookup-test.js)
and push and object with the following structure into our metrics array. Mandatory parameters are marked with a *:

```js
{
    name: EUC,                         //* -> short name of the metric
    full_name: Eucledian,              //-> the full name of the metric
    compute: compute_euc_dist,         //* -> the function that will compute the metric's result
    conditions: {                      //* -> conditions in which the metric can be computed
        'intersect': true,
        'included': false    
    },                                
    highlight_settings: {              //-> the name and color limit values for the highlight associated to this metric
        label:"EUC", 
        color_extent_min: 0,           
        color_extent_max: 1
    },                  
    ref:                              //-> link to the original document/source of the metric
        "https://en.wikipedia.org/wiki/Euclidean_distance"
}
```





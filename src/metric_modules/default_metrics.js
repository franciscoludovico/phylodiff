const HashMap = require("hashmap");


const metrics = []
/*
* We decide which metrics can be calculated based on their leaf information
* R&F and Weighed R&F can be calculated if the leaf sets of both trees intersect themselves
* Generalized R&F can be calculated if the leaf sets of both trees don't intersect themselves and one of those
* sets is included in the other
* */

metrics.push(
    {
        name: "RDF",
        compute: compute_RF_distance,
        description: "RDF Metric",
        conditions: ["intersect"],
        selected: false,
        highlight_settings: {label:"RDF",color_extent_min: 1,color_extent_max: 50},
        ref: "link"
    }
)

metrics.push(
    {
        name: "WRF",
        compute: compute_WRF_distance,
        description: "WRF Metric",
        conditions: ["intersect"],
        selected: true,
        highlight_settings: {label:"Length",color_extent_min: null,color_extent_max: null},
        ref: "link"
    }
)

metrics.push(
    {
        name: "GRF",
        compute: compute_GRF_distance,
        description: "GRF Metric",
        conditions: ["include"],
        selected: false,
        ref: "link"
    }
)

export {metrics}

/*
if(this.available_metrics.RDF && this.leaf_info.intersect) {
    this.distance.RF = compute_RF_distance(mod1, mod2, this.id_set)
}

if(this.available_metrics.WRF && this.leaf_info.intersect) {
    this.distance.WRF = compute_WRF_distance(mod1, mod2,this.id_set)
}

if(this.available_metrics.GRF && this.leaf_info.include && !this.leaf_info.intersect ) {
    this.distance.GRF = compute_GRF_distance(mod1, mod2, this.id_set)
}
 */

function compute_RF_distance(mod1, mod2, id_set) {

    var cl_tree1 = mod1.get_clusters_rf(id_set)
    var cl_tree2 = mod2.get_clusters_rf(id_set)

    var shared_clusters = 0
    const total_clusters = cl_tree1.size + cl_tree2.size

    /*
    * Comparing both cluster maps to check how similar they are
    * */
    var iterator = cl_tree2.values()
    cl_tree1.forEach(function (value, key) {
        for (const bitset of iterator) {
            if (bitset.equals(value)) {
                shared_clusters++
                break
            }
        }
    })

    var rf_distance = -1

    /*
    * The number of shared clusters should not be bigger than the number of clusters of both trees
    * */
    if (shared_clusters * 2 < total_clusters) {
        rf_distance = (total_clusters - shared_clusters * 2) / 2
    }

    return rf_distance
}

function compute_WRF_distance(mod1, mod2, id_set) {

    let distance_map = new HashMap()

    var cl_tree1 = mod1.get_clusters_wrf(id_set, distance_map)
    var cl_tree2 = mod2.get_clusters_wrf(id_set, distance_map)

    var wrf_distance = 0

    distance_map.forEach(function (value, key) {
        wrf_distance += Math.abs(value)
    })

    return wrf_distance
}

function compute_GRF_distance(mod1, mod2, id_set) {

    var cl_tree1 = mod1.get_clusters_rf(id_set)
    var cl_tree2 = mod2.get_clusters_rf(id_set)
    var max_shared_clusters = cl_tree1.size

    if (cl_tree1.size > cl_tree2.size) {
        max_shared_clusters = cl_tree2.size
        let temp = cl_tree2
        cl_tree2 = cl_tree1
        cl_tree1 = temp
    }

    var shared_clusters = 0
    const total_clusters = cl_tree1.size + cl_tree2.size

    var iterator = cl_tree2.values()
    cl_tree1.forEach(function (value, key) {
        for (const bitset of iterator) {
            if (bitset.equals(value)) {
                shared_clusters++
                break
            }
        }
    })

    var grf_distance = -1

    if (shared_clusters <= max_shared_clusters) {
        grf_distance = (total_clusters - shared_clusters * 2) / 2
    }

    return grf_distance
}
